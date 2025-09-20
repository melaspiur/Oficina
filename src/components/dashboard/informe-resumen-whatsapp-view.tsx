"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { useToast } from "@/hooks/use-toast"
import { getClientes } from "@/lib/services/clientes"
import type { ClienteWithId } from "@/lib/types"

const currentYear = new Date().getFullYear()

const formSchema = z.object({
  clienteId: z.string().min(1, "Debe seleccionar un cliente."),
  mes: z.string().min(1, "Debe seleccionar un mes."),
  ano: z.string().min(4, "Debe seleccionar un año."),
})

type FormSchema = z.infer<typeof formSchema>

export function InformeResumenWhatsappView() {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [allClientes, setAllClientes] = React.useState<ClienteWithId[]>([])
  const { toast } = useToast()

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mes: String(new Date().getMonth() + 1),
      ano: String(currentYear),
    },
  })
  
  React.useEffect(() => {
    async function fetchClientesData() {
        try {
            const clientes = await getClientes();
            setAllClientes(clientes.sort((a, b) => a.codigo - b.codigo));
        } catch(error) {
            console.error("Error fetching clients:", error);
            toast({ title: "Error", description: "No se pudieron cargar los clientes.", variant: "destructive" });
        }
    }
    fetchClientesData();
  }, [toast]);
  
  const clienteOptions = React.useMemo(() => allClientes.map(c => ({ value: c.id, label: `${c.codigo} - ${c.nombre}` })), [allClientes]);


  const onSubmit = async (data: FormSchema) => {
    setIsProcessing(true);
    
    const cliente = allClientes.find(c => c.id === data.clienteId);
    if (!cliente) {
        toast({ title: "Error", description: "Cliente no seleccionado.", variant: "destructive" });
        setIsProcessing(false);
        return;
    }
    if (!cliente.celular) {
        toast({ title: "Error", description: `El cliente ${cliente.nombre} no tiene un número de celular cargado.`, variant: "destructive" });
        setIsProcessing(false);
        return;
    }

    try {
      const mensaje = encodeURIComponent("Hola Como estas");
      const numeroLimpio = cliente.celular.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${numeroLimpio}?text=${mensaje}`;

      window.open(whatsappUrl, '_blank');

      toast({
        title: "Listo para Enviar",
        description: `Se ha abierto WhatsApp para enviar el mensaje a ${cliente.nombre}.`,
      });

    } catch (error: any) {
      console.error("Error al preparar el envío:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo completar el proceso. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const mesesOptions = Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: format(new Date(0, i), 'LLLL', { locale: es }),
  }));
  const anosOptions = Array.from({ length: 10 }, (_, i) => String(currentYear - i));

  return (
    <div className="p-6 space-y-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Enviar Resumen Mensual por WhatsApp</CardTitle>
          <CardDescription>
            Seleccione un cliente y un período para generar su estado de cuenta en PDF y enviarlo por WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <FormField
                    control={form.control}
                    name="clienteId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Combobox
                          options={clienteOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Seleccione un cliente..."
                          searchPlaceholder="Buscar cliente..."
                          notFoundMessage="No se encontraron clientes."
                          disabled={allClientes.length === 0}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <div className="flex flex-col sm:flex-row gap-4">
                    <FormField
                        control={form.control}
                        name="mes"
                        render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Mes</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Seleccione un mes" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {mesesOptions.map((mes) => (
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
                        name="ano"
                        render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Año</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Seleccione un año" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {anosOptions.map((ano) => (
                                <SelectItem key={ano} value={ano}>{ano}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <Button type="submit" className="w-full sm:w-auto" disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generar y Enviar
                </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
