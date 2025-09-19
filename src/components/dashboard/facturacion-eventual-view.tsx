"use client"

import * as React from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, CalendarIcon } from "lucide-react"
import { format as formatDate } from "date-fns"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Combobox } from "@/components/ui/combobox"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

import { getClientes } from "@/lib/services/clientes"
import { getNovedades } from "@/lib/services/novedades"
import { getConfiguracionComprobantes, updateConfiguracionComprobantes } from "@/lib/services/configuracion"
import { addMovimiento } from "@/lib/services/movimientos"

import type { ClienteWithId, NovedadWithId, ConfiguracionComprobantes, Movimiento } from "@/lib/types"

// Helper to parse dd/mm/yyyy string to Date
const parseDate = (dateStr: string): Date | undefined => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return undefined;
  const [day, month, year] = dateStr.split('/').map(Number);
  if (!day || !month || !year) return undefined;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
    return date;
  }
  return undefined;
};


const formSchema = z.object({
  clienteId: z.string().min(1, "Debe seleccionar un cliente."),
  novedadId: z.string().min(1, "Debe seleccionar una novedad."),
  fecha: z.string().refine((val) => /^\d{2}\/\d{2}\/\d{4}$/.test(val), {
    message: "El formato de fecha debe ser dd/mm/yyyy",
  }).refine((val) => parseDate(val) !== undefined, {
    message: "La fecha ingresada no es válida."
  }),
  descripcion: z.string().max(40, "La descripción no puede tener más de 40 caracteres.").optional(),
  importe: z.coerce.number().min(0.01, "El importe debe ser mayor a cero."),
})

type FormSchema = z.infer<typeof formSchema>

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function FacturacionEventualView() {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [clientes, setClientes] = React.useState<ClienteWithId[]>([])
  const [novedades, setNovedades] = React.useState<NovedadWithId[]>([])
  const [config, setConfig] = React.useState<ConfiguracionComprobantes | null>(null)
  const [displayImporte, setDisplayImporte] = React.useState("0,00");

  const { toast } = useToast()

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
     defaultValues: {
      importe: 0,
      descripcion: "",
      fecha: formatDate(new Date(), "dd/MM/yyyy"),
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
        
        // Remove duplicates from novedades
        const uniqueNovedades = Array.from(new Map(novedadesData.map(item => [item.codigo, item])).values());
        setNovedades(uniqueNovedades.sort((a,b) => a.codigo - b.codigo));

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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove all non-digit characters
    if (value.length > 8) {
      value = value.slice(0, 8);
    }
    if (value.length > 4) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    } else if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    form.setValue('fecha', value, { shouldValidate: true });
  };

  const handleImporteFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = form.getValues('importe');
    setDisplayImporte(String(value || '').replace('.', ','));
  };

  const handleImporteBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = form.getValues('importe');
    if (value) {
      setDisplayImporte(formatNumber(value));
    } else {
      setDisplayImporte("0,00");
    }
  };


  const onSubmit = async (data: FormSchema) => {
    if (!config) {
        toast({ title: "Error", description: "La configuración de facturación no está cargada.", variant: "destructive" });
        return;
    }

    const fechaFactura = parseDate(data.fecha);
    if (!fechaFactura) {
         toast({ title: "Error", description: "La fecha ingresada no es válida.", variant: "destructive" });
        return;
    }

    setIsProcessing(true);
    
    const nuevoNumeroFactura = config.ultimoFactura + 1;

    try {
        const movimiento: Movimiento = {
            clienteId: data.clienteId,
            fecha: fechaFactura.toISOString(),
            comprobante: 'FC',
            numero: nuevoNumeroFactura,
            novedadId: data.novedadId,
            importe: data.importe,
            aplicacion: 0,
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
            fecha: formatDate(new Date(), "dd/MM/yyyy"),
        });
        setDisplayImporte("0,00");

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
                      <FormItem>
                        <FormLabel>Fecha de Facturación *</FormLabel>
                        <div className="relative">
                            <FormControl>
                            <Input 
                                placeholder="dd/mm/yyyy" 
                                value={field.value}
                                onChange={handleDateChange}
                            />
                            </FormControl>
                            <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground">
                                <CalendarIcon className="h-4 w-4" />
                                <span className="sr-only">Abrir calendario</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent 
                                className="w-auto p-0" 
                                align="start"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                            >
                                <Calendar
                                    mode="single"
                                    selected={parseDate(field.value)}
                                    onSelect={(date) => {
                                        if (date) {
                                            field.onChange(formatDate(date, "dd/MM/yyyy"))
                                        }
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                            </Popover>
                        </div>
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
                          <Input 
                            type="text" 
                            inputMode="decimal"
                            className="text-right"
                            value={displayImporte}
                            onFocus={handleImporteFocus}
                            onBlur={handleImporteBlur}
                            onChange={(e) => {
                                const rawValue = e.target.value;
                                setDisplayImporte(rawValue);
                                const parsedValue = parseFloat(rawValue.replace(',', '.'));
                                field.onChange(isNaN(parsedValue) ? 0 : parsedValue);
                            }}
                          />
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
