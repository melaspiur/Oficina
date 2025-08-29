"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { Empresa, EmpresaWithId } from "@/lib/empresas"

type EmpresaDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSave: (empresa: Empresa) => void
  empresa?: EmpresaWithId | null
}

const empresaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido."),
  cuit: z.string().min(11, "El CUIT debe tener 11 dígitos.").max(11, "El CUIT debe tener 11 dígitos."),
  firebaseConfig: z.object({
    apiKey: z.string().min(1, "API Key es requerida."),
    authDomain: z.string().min(1, "Auth Domain es requerido."),
    projectId: z.string().min(1, "Project ID es requerido."),
    storageBucket: z.string().min(1, "Storage Bucket es requerido."),
    messagingSenderId: z.string().min(1, "Messaging Sender ID es requerido."),
    appId: z.string().min(1, "App ID es requerida."),
  }),
});

export function EmpresaDialog({ isOpen, onOpenChange, onSave, empresa }: EmpresaDialogProps) {
  const form = useForm<Empresa>({
    resolver: zodResolver(empresaSchema),
    defaultValues: empresa || {
      nombre: "",
      cuit: "",
      firebaseConfig: {
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: "",
      },
    }
  });

  React.useEffect(() => {
    form.reset(empresa || {
      nombre: "",
      cuit: "",
      firebaseConfig: {
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: "",
      },
    });
  }, [empresa, form, isOpen]);
  
  const onSubmit = (data: Empresa) => {
    onSave(data);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{empresa ? 'Editar Empresa' : 'Nueva Empresa'}</DialogTitle>
          <DialogDescription>
            Complete los datos de la empresa y su configuración de Firebase.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <ScrollArea className="h-[60vh] pr-6">
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="nombre"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre *</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="cuit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CUIT *</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <h3 className="text-lg font-medium pt-4 border-b pb-2">Configuración de Firebase</h3>

                        <FormField
                            control={form.control}
                            name="firebaseConfig.apiKey"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>API Key *</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="firebaseConfig.authDomain"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Auth Domain *</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="firebaseConfig.projectId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project ID *</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="firebaseConfig.storageBucket"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Storage Bucket *</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="firebaseConfig.messagingSenderId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Messaging Sender ID *</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="firebaseConfig.appId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>App ID *</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </ScrollArea>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
              </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
