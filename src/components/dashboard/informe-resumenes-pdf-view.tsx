"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getClientesConMovimientos, getMovimientosPorCliente } from "@/lib/services/movimientos"
import { getClientes } from "@/lib/services/clientes"
import type { MovimientoWithId, ClienteWithId } from "@/lib/types"

const currentYear = new Date().getFullYear()

const formSchema = z.object({
  mes: z.string().min(1, "Debe seleccionar un mes."),
  ano: z.string().min(4, "Debe seleccionar un año."),
})

type FormSchema = z.infer<typeof formSchema>

interface CuentaCorrienteItem extends MovimientoWithId {
  debe: number;
  haber: number;
  saldo: number;
}

export function InformeResumenesPdfView() {
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
            setAllClientes(clientes);
        } catch(error) {
            console.error("Error fetching clients:", error);
            toast({ title: "Error", description: "No se pudieron cargar los clientes para el informe.", variant: "destructive" });
        }
    }
    fetchClientesData();
  }, [toast]);

  const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
      }).format(value);
  };
  
  const generatePdfForClient = (
      cliente: ClienteWithId,
      movimientos: MovimientoWithId[],
      mes: number,
      ano: number
  ) => {
    const startDate = new Date(ano, mes - 1, 1);
    const endDate = new Date(ano, mes, 0, 23, 59, 59, 999); // Last moment of the selected month
    const mesLabel = format(startDate, 'LLLL', { locale: es });

    // 1. Calculate initial balance
    const movimientosAnteriores = movimientos.filter(m => new Date(m.fecha) < startDate);
    let saldoInicial = 0;
    movimientosAnteriores.forEach(m => {
        saldoInicial += (m.comprobante === 'FC' ? m.importe : -m.importe);
    });

    // 2. Filter movements for the selected month and build report data
    const movimientosDelMes = movimientos
      .filter(m => {
          const fechaMov = new Date(m.fecha);
          return fechaMov >= startDate && fechaMov <= endDate;
      })
      .sort((a,b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    let saldoAcumulado = saldoInicial;
    const reportData: any[] = [];
    
    // Add initial balance row
    reportData.push([
      '', 
      '', 
      { content: 'SALDO ANTERIOR', styles: { fontStyle: 'bold' } }, 
      '', 
      '', 
      { content: formatCurrency(saldoInicial), styles: { halign: 'right' } }
    ]);


    movimientosDelMes.forEach(mov => {
        const debe = mov.comprobante === 'FC' ? mov.importe : 0;
        const haber = mov.comprobante === 'RE' ? mov.importe : 0;
        saldoAcumulado += debe - haber;
        reportData.push([
            format(new Date(mov.fecha), 'dd/MM/yyyy'),
            `${mov.comprobante}-${String(mov.numero).padStart(8, '0')}`,
            mov.descripcion || '',
            { content: debe > 0 ? formatCurrency(debe) : '', styles: { halign: 'right' } },
            { content: haber > 0 ? formatCurrency(haber) : '', styles: { halign: 'right' } },
            { content: formatCurrency(saldoAcumulado), styles: { halign: 'right' } }
        ]);
    });
    
    // 3. Generate PDF
    const doc = new jsPDF();
    doc.text(`Cuenta Corriente: ${cliente.codigo} - ${cliente.nombre}`, 14, 16);
    doc.text(`Período: ${mesLabel} ${ano}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [['Fecha', 'Comprobante', 'Descripción', 'Debe', 'Haber', 'Saldo']],
      body: reportData,
      foot: [
          [{ content: 'Saldo Final', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
           { content: formatCurrency(saldoAcumulado), styles: { halign: 'right', fontStyle: 'bold' } }]
      ],
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      footStyles: { fillColor: [236, 240, 241], textColor: 0 },
      styles: { fontSize: 8 },
      columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' }
      }
    });

    const fileName = `${cliente.codigo}-${cliente.nombre.replace(/\s+/g, '_')}-${mesLabel}.pdf`;
    doc.save(fileName);
  }

  const onSubmit = async (data: FormSchema) => {
    setIsProcessing(true);
    toast({ title: "Procesando...", description: "Generando resúmenes en PDF. Esto puede tardar unos momentos." });
    
    try {
      const mes = parseInt(data.mes, 10);
      const ano = parseInt(data.ano, 10);
      
      const clientesConMov = await getClientesConMovimientos(ano, mes);
      const clientesInfoMap = new Map(allClientes.map(c => [c.id, c]));

      if (clientesConMov.length === 0) {
        toast({ title: "Sin Resultados", description: "Ningún cliente tuvo movimientos en el período seleccionado." });
        setIsProcessing(false);
        return;
      }
      
      let count = 0;
      for (const clienteId of clientesConMov) {
          const cliente = clientesInfoMap.get(clienteId);
          if (cliente) {
              const todosLosMovimientos = await getMovimientosPorCliente(clienteId);
              generatePdfForClient(cliente, todosLosMovimientos, mes, ano);
              count++;
              // Delay to prevent browser from blocking multiple downloads
              await new Promise(resolve => setTimeout(resolve, 500));
          }
      }

      toast({
        title: "Proceso Completado",
        description: `Se han generado ${count} resúmenes en PDF.`,
      });

    } catch (error) {
      console.error("Error al generar los resúmenes:", error)
      toast({
        title: "Error",
        description: "No se pudieron generar los resúmenes. Intente nuevamente.",
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
          <CardTitle>Generar Resúmenes Mensuales en PDF</CardTitle>
          <CardDescription>
            Seleccione un período para generar el estado de cuenta en PDF para todos los clientes que tuvieron movimientos en dicho mes.
            Los archivos se descargarán automáticamente en su navegador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4 items-end">
                <FormField
                    control={form.control}
                    name="mes"
                    render={({ field }) => (
                    <FormItem className="w-full sm:w-auto flex-grow">
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
                    <FormItem className="w-full sm:w-auto flex-grow">
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
                <Button type="submit" className="w-full sm:w-auto" disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generar Resúmenes
                </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
