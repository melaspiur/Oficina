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
import { Label } from "@/components/ui/label"
import { Combobox } from "@/components/ui/combobox"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

import { getClientes } from "@/lib/services/clientes"
import { getConfiguracionComprobantes, updateConfiguracionComprobantes } from "@/lib/services/configuracion"
import { addMovimiento, getMovimientosPorCliente } from "@/lib/services/movimientos"
import { addAplicacionesBatch } from "@/lib/services/aplicaciones"
import { AplicacionReciboDialog } from "./aplicacion-recibo-dialog"


import type { ClienteWithId, ConfiguracionComprobantes, Movimiento, MovimientoWithId, FacturaConSaldo, Aplicacion } from "@/lib/types"

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

export function ReciboView() {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [clientes, setClientes] = React.useState<ClienteWithId[]>([])
  const [config, setConfig] = React.useState<ConfiguracionComprobantes | null>(null)
  const [displayImporte, setDisplayImporte] = React.useState("0,00");
  const [isAplicacionDialogOpen, setIsAplicacionDialogOpen] = React.useState(false);
  const [datosParaAplicacion, setDatosParaAplicacion] = React.useState<{
      cliente: ClienteWithId,
      recibo: MovimientoWithId,
      facturasPendientes: FacturaConSaldo[]
  } | null>(null);


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
        const [clientesData, configData] = await Promise.all([
          getClientes(),
          getConfiguracionComprobantes()
        ]);
        setClientes(clientesData.sort((a,b) => a.codigo - b.codigo));
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
  const proximoNumeroRecibo = config ? config.ultimoRecibo + 1 : 0;

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

  const calculateSaldos = (movimientos: MovimientoWithId[]): FacturaConSaldo[] => {
      const facturas = new Map<string, FacturaConSaldo>();

      // Initialize facturas
      movimientos.filter(m => m.comprobante === 'FC').forEach(fc => {
          facturas.set(fc.id, {
              ...fc,
              saldo: fc.importe - fc.aplicacion
          });
      });
      
      return Array.from(facturas.values())
        .filter(f => f.saldo > 0.005) // Use a small epsilon for float comparison
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }


  const onSubmit = async (data: FormSchema) => {
    if (!config) {
        toast({ title: "Error", description: "La configuración no está cargada.", variant: "destructive" });
        return;
    }

    const fechaRecibo = parseDate(data.fecha);
    if (!fechaRecibo) {
         toast({ title: "Error", description: "La fecha ingresada no es válida.", variant: "destructive" });
        return;
    }

    const clienteSeleccionado = clientes.find(c => c.id === data.clienteId);
    if (!clienteSeleccionado) {
        toast({ title: "Error", description: "Cliente no encontrado.", variant: "destructive" });
        return;
    }

    setIsProcessing(true);
    
    const nuevoNumeroRecibo = config.ultimoRecibo + 1;

    try {
        const movimiento: Movimiento = {
            clienteId: data.clienteId,
            fecha: fechaRecibo.toISOString(),
            comprobante: 'RE',
            numero: nuevoNumeroRecibo,
            importe: data.importe,
            aplicacion: 0, // Initially unapplied
            descripcion: data.descripcion || 'Recibo de pago',
        };

        // 1. Guardar el nuevo movimiento de recibo
        const nuevoReciboId = await addMovimiento(movimiento);
        const nuevoRecibo: MovimientoWithId = { ...movimiento, id: nuevoReciboId };
        
        toast({
            title: "Recibo Creado",
            description: `Se generó el recibo N° ${String(nuevoNumeroRecibo).padStart(8,'0')}. Ahora, aplícalo a las facturas.`,
        });
        
        // 2. Actualizar la configuración con el nuevo número de recibo
        const newConfig = { ...config, ultimoRecibo: nuevoNumeroRecibo };
        await updateConfiguracionComprobantes(newConfig);
        setConfig(newConfig);

        // 3. Preparar y abrir el diálogo de aplicación
        const movimientosCliente = await getMovimientosPorCliente(data.clienteId);
        const facturasPendientes = calculateSaldos(movimientosCliente);
        
        setDatosParaAplicacion({
            cliente: clienteSeleccionado,
            recibo: nuevoRecibo,
            facturasPendientes: facturasPendientes
        });

        setIsAplicacionDialogOpen(true);

    } catch (error) {
      console.error("Error al generar recibo:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el recibo. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCloseAplicacionDialog = () => {
    setIsAplicacionDialogOpen(false);
    setDatosParaAplicacion(null);
    form.reset({
        importe: 0,
        descripcion: "",
        clienteId: undefined,
        fecha: formatDate(new Date(), "dd/MM/yyyy"),
    });
    setDisplayImporte("0,00");
  }

  const handleSaveAplicacion = async (aplicaciones: Aplicacion[]) => {
      if (!datosParaAplicacion) return;
      
      try {
          await addAplicacionesBatch(aplicaciones);
          toast({
              title: "Recibo Aplicado",
              description: "El recibo ha sido aplicado a las facturas seleccionadas.",
          });
          handleCloseAplicacionDialog();
      } catch (error) {
          console.error("Error saving aplicacion:", error);
          toast({
              title: "Error",
              description: "No se pudo guardar la aplicación del recibo.",
              variant: "destructive",
          });
      }
  };
  
  return (
    <div className="space-y-6 pt-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Generar Recibo</CardTitle>
          <CardDescription>
            Complete los datos para generar un recibo individual para un cliente.
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
                        <FormLabel>Fecha del Recibo *</FormLabel>
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
                  <div>
                    <Label>Número de Recibo</Label>
                    <Input 
                      disabled 
                      value={String(proximoNumeroRecibo).padStart(8, '0')} 
                      className="font-mono mt-2"
                    />
                  </div>
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
                            <Input maxLength={40} placeholder="Ej: Pago parcial honorarios..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  </div>
              </div>
              <Button type="submit" className="w-full" disabled={isProcessing || !config}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aceptar Recibo
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {datosParaAplicacion && (
        <AplicacionReciboDialog
            isOpen={isAplicacionDialogOpen}
            onOpenChange={handleCloseAplicacionDialog}
            onSave={handleSaveAplicacion}
            cliente={datosParaAplicacion.cliente}
            recibo={datosParaAplicacion.recibo}
            facturas={datosParaAplicacion.facturasPendientes}
        />
      )}
    </div>
  )
}
