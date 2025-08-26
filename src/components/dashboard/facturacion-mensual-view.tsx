
"use client"

import * as React from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { generarFacturacion, GenerarFacturacionOutput } from "@/ai/flows/generar-facturacion-flow"
import { mesesList } from "@/lib/types"

const formSchema = z.object({
  mes: z.string().min(1, "Debe seleccionar un mes."),
  fechaFacturacion: z.date({
    required_error: "Debe seleccionar una fecha.",
  }),
})

type FormSchema = z.infer<typeof formSchema>

export function FacturacionMensualView() {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [facturacionResult, setFacturacionResult] = React.useState<GenerarFacturacionOutput | null>(null)
  const { toast } = useToast()

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        mes: String(new Date().getMonth() + 1),
    }
  })

  const onSubmit = async (data: FormSchema) => {
    setIsProcessing(true)
    setFacturacionResult(null)
    
    const mesSeleccionado = mesesList[Number(data.mes) - 1];

    try {
      const result = await generarFacturacion({ 
        mes: mesSeleccionado,
        fechaFacturacion: data.fechaFacturacion.toISOString()
      });
      setFacturacionResult(result);
       toast({
        title: "Facturación Generada",
        description: `Se procesaron ${result.clientes.length} clientes para el mes de ${mesSeleccionado}.`,
      });
    } catch (error) {
      console.error("Error al generar facturación:", error)
      toast({
        title: "Error",
        description: "No se pudo generar la facturación. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAceptarFacturacion = () => {
    console.log("Facturación aceptada:", facturacionResult);
    toast({
        title: "Proceso Completado",
        description: "La facturación ha sido aceptada y guardada.",
      });
    setFacturacionResult(null);
    form.reset();
  }
  
  const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
      }).format(value);
  };


  if (facturacionResult) {
    return (
      <div className="p-6 space-y-6">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Resultados de la Facturación Mensual</CardTitle>
                        <CardDescription>
                            Resumen de la facturación generada para el mes de <span className="font-semibold capitalize">{facturacionResult.mes}</span> con fecha <span className="font-semibold">{format(new Date(facturacionResult.fechaFacturacion), "dd/MM/yyyy")}</span>.
                        </CardDescription>
                    </div>
                    <Button onClick={() => setFacturacionResult(null)}>Volver</Button>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cód. Cliente</TableHead>
                                <TableHead>Nombre Cliente</TableHead>
                                <TableHead>Novedades</TableHead>
                                <TableHead className="text-right">Total Facturado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {facturacionResult.clientes.map(cliente => (
                                <TableRow key={cliente.clienteId}>
                                    <TableCell>{cliente.clienteCodigo}</TableCell>
                                    <TableCell className="font-medium">{cliente.clienteNombre}</TableCell>
                                    <TableCell>
                                        <ul className="list-disc list-inside text-xs">
                                           {cliente.novedades.map(novedad => (
                                               <li key={novedad.novedadId}>{novedad.novedadNombre} ({formatCurrency(novedad.importe)})</li>
                                           ))}
                                        </ul>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(cliente.totalFacturado)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex justify-end mt-6">
                     <Button onClick={handleAceptarFacturacion}>Acepto Facturación Mensual</Button>
                </div>
            </CardContent>
        </Card>
      </div>
    )
  }


  return (
    <div className="p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Generar Facturación Mensual</CardTitle>
          <CardDescription>
            Seleccione el mes y la fecha para generar las facturas de todos los clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="mes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mes a Facturar</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un mes" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mesesList.map((mes, index) => (
                           <SelectItem key={mes} value={String(index + 1)} className="capitalize">{mes}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fechaFacturacion"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Facturación</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd 'de' LLLL 'de' yyyy", { locale: es })
                            ) : (
                              <span>Seleccione una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generar Facturación
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
