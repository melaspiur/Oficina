"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { getAuth, updatePassword, type Auth } from "firebase/auth"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { getClientAuth } from "@/lib/firebase"

const formSchema = z.object({
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

type FormSchema = z.infer<typeof formSchema>;

type ChangePasswordDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function ChangePasswordDialog({ isOpen, onOpenChange }: ChangePasswordDialogProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = React.useState(false)
  const [authInstance, setAuthInstance] = React.useState<Auth | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setAuthInstance(getClientAuth());
    }
  }, [isOpen]);


  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    }
  });

  const onSubmit = async (data: FormSchema) => {
    if (!authInstance) {
       toast({ title: "Error", description: "No se pudo obtener la instancia de autenticación.", variant: "destructive" });
       return;
    }
    const user = authInstance.currentUser;
    if (!user) {
      toast({ title: "Error", description: "No hay un usuario autenticado.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await updatePassword(user, data.newPassword);
      toast({
        title: "Éxito",
        description: "Tu contraseña ha sido actualizada.",
      });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña. Es posible que necesites volver a iniciar sesión. (" + error.message + ")",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>
            Ingresa tu nueva contraseña a continuación.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nueva Contraseña</FormLabel>
                        <FormControl>
                            <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                        <FormControl>
                            <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Contraseña
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
