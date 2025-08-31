
"use client"

import * as React from "react"
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
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

type AdminPasswordDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSuccess: () => void
}

const ADMIN_PASSWORD = "Carmen1963";

export function AdminPasswordDialog({ isOpen, onOpenChange, onSuccess }: AdminPasswordDialogProps) {
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const { toast } = useToast()

  const handleVerifyPassword = () => {
    setIsLoading(true);
    // Simulate a small delay for user feedback
    setTimeout(() => {
        if (password === ADMIN_PASSWORD) {
            onSuccess();
        } else {
            toast({
                title: "Contraseña Incorrecta",
                description: "La contraseña que ingresó no es válida. Intente de nuevo.",
                variant: "destructive",
            });
        }
        setPassword("");
        setIsLoading(false);
    }, 300);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleVerifyPassword();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Acceso de Administrador</DialogTitle>
          <DialogDescription>
            Por favor, ingrese la contraseña para acceder a la configuración de empresas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password-admin" className="text-right">
              Contraseña
            </Label>
            <Input
              id="password-admin"
              type="password"
              className="col-span-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={handleVerifyPassword} disabled={isLoading}>
             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
