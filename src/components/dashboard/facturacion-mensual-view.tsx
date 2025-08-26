
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { generarFacturacion, type GenerarFacturacionOutput } from "@/ai/flows/generar-facturacion-flow"
import { mesesList, type Movimiento, type ConfiguracionComprobantes, type ClienteFacturado } from "@/lib/types"
import { getConfiguracionComprobantes, updateConfiguracionComprobantes } from "@/lib/services/configuracion"
import { addMovimientosBatch } from "@/lib/services/movimientos"

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
  const [config, setConfig] = React.useState<ConfiguracionComprobantes | null>(null);
  const { toast } = useToast()

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        mes: String(new Date().getMonth() + 1),
    }
  })

  React.useEffect(() => {
    async function fetchConfig() {
      try {
        const configData = await getConfiguracionComprobantes();
        setConfig(configData);
      } catch (error) {
         console.error("Error fetching config:", error);
         toast({
          title: "Error de Configuración",
          description: "No se pudo cargar la configuración de facturación.",
          variant: "destructive",
        });
      }
    }
    fetchConfig();
  }, [toast]);

  const onSubmit = async (data: FormSchema) => {
    const mesSeleccionado = mesesList.find(m => m.value === data.mes)?.label;
    
    if (!mesSeleccionado) {
        toast({ title: "Error", description: "Mes seleccionado no válido.", variant: "destructive" });
        return;
    }

    if (config && config.ultimoMesEventual === mesSeleccionado.toLowerCase()) {
      toast({
        title: "Mes ya Facturado",
        description: `El mes de ${mesSeleccionado} ya ha sido procesado. No se puede facturar de nuevo.`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true)
    setFacturacionResult(null)
    
    try {
      const result = await generarFacturacion({ 
        mes: mesSeleccionado.toLowerCase(),
        fechaFacturacion: data.fechaFacturacion.toISOString()
      });
      setFacturacionResult(result);
       toast({
        title: "Facturación Generada",
        description: `Se procesaron ${result.clientes.reduce((acc, c) => acc + c.novedades.length, 0)} facturas para ${result.clientes.length} clientes.`,
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

  const handleAceptarFacturacion = async () => {
    if (!facturacionResult || !facturacionResult.ultimoNumeroFactura) return;
    
    // 1. Prepare movements data
    const movimientos: Movimiento[] = [];
    const mesFacturado = facturacionResult.mes;
    
    facturacionResult.clientes.forEach(cliente => {
        cliente.novedades.forEach(novedad => {
            movimientos.push({
                clienteId: cliente.clienteId,
                fecha: facturacionResult.fechaFacturacion,
                comprobante: 'FC',
                numero: novedad.numeroFactura,
                novedadId: novedad.novedadId,
                importe: novedad.importe,
                aplicacion: 0,
                descripcion: `Honorarios por el mes de ${mesFacturado}`,
            });
        });
    });

    try {
        // 2. Save movements to the new collection
        await addMovimientosBatch(movimientos);

        // 3. Update the last invoice number and last billed month in config
        const newConfig = { 
            ...config,
            ultimoFactura: facturacionResult.ultimoNumeroFactura,
            ultimoMesEventual: mesFacturado
        };

        // @ts-ignore
        await updateConfiguracionComprobantes(newConfig);
        
        console.log("Facturación aceptada y movimientos creados:", facturacionResult);
        toast({
            title: "Proceso Completado",
            description: "La facturación ha sido aceptada, los movimientos han sido registrados y la configuración actualizada.",
        });
        
        setConfig(newConfig as ConfiguracionComprobantes);
        setFacturacionResult(null);
        form.reset();
    } catch (error) {
        console.error("Error al aceptar facturación:", error);
        toast({
            title: "Error",
            description: "No se pudo guardar la facturación en la base de datos.",
            variant: "destructive",
        });
    }
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
                                <TableHead>Novedad</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                                <TableHead className="text-right">Importe</TableHead>
                                <TableHead className="text-right">Nro. Factura</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {facturacionResult.clientes.map((cliente: ClienteFacturado) => (
                                <React.Fragment key={cliente.clienteId}>
                                    <TableRow className="bg-secondary hover:bg-secondary pointer-events-none">
                                        <TableCell className="font-bold">{cliente.clienteCodigo}</TableCell>
                                        <TableCell colSpan={3} className="font-bold">{cliente.clienteNombre}</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(cliente.totalFacturado)}</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                    {cliente.novedades.map(novedad => (
                                        <TableRow key={novedad.novedadId + novedad.numeroFactura} className="text-sm">
                                            <TableCell></TableCell>
                                            <TableCell></TableCell>
                                            <TableCell className="pl-4">{`${novedad.novedadCodigo} - ${novedad.novedadNombre}`}</TableCell>
                                            <TableCell className="text-right">{novedad.cantidad.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(novedad.importe)}</TableCell>
                                            <TableCell className="text-right font-mono">{String(novedad.numeroFactura).padStart(8, '0')}</TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={5} className="text-right text-lg font-bold">Total General Facturado</TableCell>
                                <TableCell className="text-right text-lg font-bold">{formatCurrency(facturacionResult.totalGeneral)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
                <div className="flex justify-end mt-6">
                     <Button onClick={handleAceptarFacturacion} size="lg">Acepto Facturación Mensual</Button>
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
                        {mesesList.map((mes) => (
                           <SelectItem key={mes.value} value={mes.value} className="capitalize">{mes.label}</SelectItem>
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
              <Button type="submit" className="w-full" disabled={isProcessing || !config}>
                {(isProcessing || !config) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generar Facturación
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
