
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Combobox } from "@/components/ui/combobox"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

import { getClientes } from "@/lib/services/clientes"
import { getNovedades } from "@/lib/services/novedades"
import { getConfiguracionComprobantes, updateConfiguracionComprobantes } from "@/lib/services/configuracion"
import { addMovimiento } from "@/lib/services/movimientos"

import type { ClienteWithId, NovedadWithId, ConfiguracionComprobantes, Movimiento } from "@/lib/types"

const formSchema = z.object({
  clienteId: z.string().min(1, "Debe seleccionar un cliente."),
  novedadId: z.string().min(1, "Debe seleccionar una novedad."),
  fecha: z.date({
    required_error: "Debe seleccionar una fecha.",
  }),
  descripcion: z.string().max(40, "La descripción no puede tener más de 40 caracteres.").optional(),
  importe: z.coerce.number().min(0.01, "El importe debe ser mayor a cero."),
})

type FormSchema = z.infer<typeof formSchema>

export function FacturacionEventualView() {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [clientes, setClientes] = React.useState<ClienteWithId[]>([])
  const [novedades, setNovedades] = React.useState<NovedadWithId[]>([])
  const [config, setConfig] = React.useState<ConfiguracionComprobantes | null>(null)
  const { toast } = useToast()

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
     defaultValues: {
      importe: 0,
      descripcion: "",
    }
  })

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [clientesData, novedadesData, configData] = await Promise.all([
          getClientes(),
          getNovedades(),
          getConfiguracionComprobantes()
        ]);
        setClientes(clientesData.sort((a,b) => a.codigo - b.codigo));
        setNovedades(novedadesData.sort((a,b) => a.codigo - b.codigo));
        setConfig(configData);
      } catch (error) {
         console.error("Error fetching data:", error);
         toast({
          title: "Error de Carga",
          description: "No se pudo cargar la configuración inicial.",
          variant: "destructive",
        });
      }
    }
    fetchData();
  }, [toast]);
  
  const clienteOptions = React.useMemo(() => clientes.map(c => ({ value: c.id, label: `${c.codigo} - ${c.nombre}` })), [clientes]);
  const novedadOptions = React.useMemo(() => novedades.map(n => ({ value: n.id, label: `${n.codigo} - ${n.nombre}` })), [novedades]);

  const onSubmit = async (data: FormSchema) => {
    if (!config) {
        toast({ title: "Error", description: "La configuración de facturación no está cargada.", variant: "destructive" });
        return;
    }

    setIsProcessing(true);
    
    const nuevoNumeroFactura = config.ultimoFactura + 1;

    try {
        const movimiento: Movimiento = {
            clienteId: data.clienteId,
            fecha: data.fecha.toISOString(),
            comprobante: 'FC',
            numero: nuevoNumeroFactura,
            novedadId: data.novedadId,
            importe: data.importe,
            aplicacion: data.importe,
            descripcion: data.descripcion || novedades.find(n => n.id === data.novedadId)?.nombre || 'Factura eventual',
        };

        // 1. Guardar el nuevo movimiento
        await addMovimiento(movimiento);

        // 2. Actualizar la configuración con el nuevo número de factura
        const newConfig = { ...config, ultimoFactura: nuevoNumeroFactura };
        await updateConfiguracionComprobantes(newConfig);
        
        // 3. Actualizar el estado local y notificar
        setConfig(newConfig);
        toast({
            title: "Factura Creada",
            description: `Se generó la factura N° ${String(nuevoNumeroFactura).padStart(8,'0')} correctamente.`,
        });
        form.reset({
            importe: 0,
            descripcion: "",
            clienteId: undefined,
            novedadId: undefined,
            fecha: undefined,
        });

    } catch (error) {
      console.error("Error al generar facturación:", error)
      toast({
        title: "Error",
        description: "No se pudo generar la factura. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  return (
    <div className="p-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Generar Factura Eventual</CardTitle>
          <CardDescription>
            Complete los datos para generar una factura individual para un cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="clienteId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Cliente *</FormLabel>
                        <Combobox
                          options={clienteOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Seleccione un cliente..."
                          searchPlaceholder="Buscar cliente..."
                          notFoundMessage="No se encontraron clientes."
                          disabled={clientes.length === 0}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fecha"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Facturación *</FormLabel>
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
                              disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="novedadId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Novedad *</FormLabel>
                        <Combobox
                          options={novedadOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Seleccione una novedad..."
                          searchPlaceholder="Buscar novedad..."
                          notFoundMessage="No se encontraron novedades."
                          disabled={novedades.length === 0}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="importe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Importe *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2">
                     <FormField
                        control={form.control}
                        name="descripcion"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripción (Opcional)</FormLabel>
                            <FormControl>
                            <Input maxLength={40} placeholder="Descripción breve de la factura..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  </div>
              </div>
              <Button type="submit" className="w-full" disabled={isProcessing || !config}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aceptar Factura
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

