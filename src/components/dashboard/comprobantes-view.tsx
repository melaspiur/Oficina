"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getConfiguracionComprobantes, updateConfiguracionComprobantes } from "@/lib/services/configuracion"
import type { ConfiguracionComprobantes } from "@/lib/types"

const ComprobantesSchema = z.object({
  ultimoFactura: z.coerce.number().min(0, "El número no puede ser negativo."),
  ultimoRecibo: z.coerce.number().min(0, "El número no puede ser negativo."),
  ultimoMesEventual: z.string().optional(),
})

export function ComprobantesView() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ConfiguracionComprobantes>({
    resolver: zodResolver(ComprobantesSchema),
    defaultValues: {
      ultimoFactura: 0,
      ultimoRecibo: 0,
      ultimoMesEventual: "",
    },
  })

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const data = await getConfiguracionComprobantes()
        reset(data)
      } catch (error) {
        console.error("Error fetching comprobantes config:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la configuración de comprobantes.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [reset, toast])

  const onSubmit = async (data: ConfiguracionComprobantes) => {
    setIsSaving(true)
    try {
      await updateConfiguracionComprobantes(data)
      toast({
        title: "Configuración Guardada",
        description: "Los números de comprobantes han sido actualizados.",
      })
    } catch (error) {
      console.error("Error saving comprobantes config:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6">
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Ajustes de Comprobantes</CardTitle>
          <CardDescription>
            Gestiona la numeración de tus facturas, recibos y el último mes facturado para facturas eventuales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ultimoFactura">Último Número de Factura</Label>
                   <Controller
                    name="ultimoFactura"
                    control={control}
                    render={({ field }) => (
                       <Input id="ultimoFactura" type="number" {...field} />
                    )}
                  />
                  {errors.ultimoFactura && <p className="text-sm text-destructive">{errors.ultimoFactura.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ultimoRecibo">Último Número de Recibo</Label>
                   <Controller
                    name="ultimoRecibo"
                    control={control}
                    render={({ field }) => (
                       <Input id="ultimoRecibo" type="number" {...field} />
                    )}
                  />
                  {errors.ultimoRecibo && <p className="text-sm text-destructive">{errors.ultimoRecibo.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="ultimoMesEventual">Último Mes Facturado (Eventual)</Label>
                   <Controller
                    name="ultimoMesEventual"
                    control={control}
                    render={({ field }) => (
                       <Input id="ultimoMesEventual" type="text" placeholder="Ej: enero-2024" {...field} />
                    )}
                  />
                  {errors.ultimoMesEventual && <p className="text-sm text-destructive">{errors.ultimoMesEventual.message}</p>}
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
