
"use client"

import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type LoginCredentialsAlertProps = {
  email: string
  password?: string
}

export function LoginCredentialsAlert({ email, password }: LoginCredentialsAlertProps) {
  return (
    <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
      <AlertCircle className="h-4 w-4 !text-blue-600 dark:!text-blue-400" />
      <AlertTitle className="text-blue-800 dark:text-blue-300">Datos de Ingreso</AlertTitle>
      <AlertDescription className="text-blue-700 dark:text-blue-300 space-y-1">
        <div>
            <span className="font-semibold">Correo:</span> {email}
        </div>
        {password && (
             <div>
                <span className="font-semibold">Contraseña:</span> {password}
            </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
