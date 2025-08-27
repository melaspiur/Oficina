
"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2, FileDown } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getMovimientosRecibosPorMes } from "@/lib/services/movimientos"
import { getClientes } from "@/lib/services/clientes"
import type { MovimientoWithId } from "@/lib/types"

const currentYear = new Date().getFullYear()

const formSchema = z.object({
  mes: z.string().min(1, "Debe seleccionar un mes."),
  ano: z.string().min(4, "Debe seleccionar un año."),
})

type FormSchema = z.infer<typeof formSchema>

type ReporteViewModel = MovimientoWithId & {
    clienteNombre?: string;
};

export function InformeCobranzasMensualView() {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [reportData, setReportData] = React.useState<ReporteViewModel[]>([])
  const [clientesMap, setClientesMap] = React.useState<Map<string, string>>(new Map());
  const [hasSearched, setHasSearched] = React.useState(false);

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
            const map = new Map(clientes.map(c => [c.id, c.nombre]));
            setClientesMap(map);
        } catch(error) {
            console.error("Error fetching clients:", error);
            toast({ title: "Error", description: "No se pudieron cargar los clientes para el informe.", variant: "destructive" });
        }
    }
    fetchClientesData();
  }, [toast]);

  const onSubmit = async (data: FormSchema) => {
    setIsProcessing(true)
    setReportData([])
    setHasSearched(true);
    
    try {
      const mes = parseInt(data.mes, 10);
      const ano = parseInt(data.ano, 10);
      const result = await getMovimientosRecibosPorMes(ano, mes);
      
      const viewModel: ReporteViewModel[] = result.map(mov => ({
          ...mov,
          clienteNombre: clientesMap.get(mov.clienteId) || "Cliente no encontrado"
      }));

      setReportData(viewModel.sort((a,b) => a.numero - b.numero));

      if (result.length === 0) {
        toast({
            title: "Sin Resultados",
            description: "No se encontraron recibos para el período seleccionado.",
        });
      }

    } catch (error) {
      console.error("Error al generar el informe:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el informe. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
      }).format(value);
  };

  const totalCobrado = React.useMemo(() => {
      return reportData.reduce((acc, item) => acc + item.importe, 0);
  }, [reportData]);

  const mesesOptions = Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: format(new Date(0, i), 'LLLL', { locale: es }),
  }));

  const anosOptions = Array.from({ length: 10 }, (_, i) => String(currentYear - i));

  const handleExportExcel = () => {
    const { mes, ano } = form.getValues();
    const mesLabel = mesesOptions.find(m => m.value === mes)?.label;
    const fileName = `Cobranzas_${mesLabel}_${ano}.xlsx`;

    const dataForSheet = reportData.map(item => ({
        Fecha: format(new Date(item.fecha), 'dd/MM/yyyy'),
        Numero: `${item.comprobante}-${String(item.numero).padStart(8, '0')}`,
        Cliente: item.clienteNombre,
        Descripcion: item.descripcion,
        Importe: item.importe,
    }));
    
    dataForSheet.push({
        Fecha: '',
        Numero: '',
        Cliente: '',
        Descripcion: 'Total General',
        Importe: totalCobrado
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet);

    worksheet['!cols'] = [
        { wch: 12 }, // Fecha
        { wch: 15 }, // Numero
        { wch: 30 }, // Cliente
        { wch: 40 }, // Descripcion
        { wch: 15 }, // Importe
    ];

    dataForSheet.forEach((_row, index) => {
        const i = index + 2;
        if(worksheet[`E${i}`]) worksheet[`E${i}`].z = '$ #,##0.00';
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cobranzas Mensual");
    XLSX.writeFile(workbook, fileName);
  };

  const handleExportPDF = () => {
    const { mes, ano } = form.getValues();
    const mesLabel = mesesOptions.find(m => m.value === mes)?.label;
    const fileName = `Cobranzas_${mesLabel}_${ano}.pdf`;
    
    const doc = new jsPDF();
    doc.text(`Informe de Cobranzas - ${mesLabel} ${ano}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [['Fecha', 'Número', 'Cliente', 'Descripción', 'Importe']],
      body: reportData.map(item => [
          format(new Date(item.fecha), 'dd/MM/yyyy'),
          `${item.comprobante}-${String(item.numero).padStart(8, '0')}`,
          item.clienteNombre || '',
          item.descripcion || '',
          { content: formatCurrency(item.importe), styles: { halign: 'right' } }
      ]),
      foot: [
          [{ content: 'Total General', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
           { content: formatCurrency(totalCobrado), styles: { halign: 'right', fontStyle: 'bold' } }]
      ],
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      footStyles: { fillColor: [236, 240, 241], textColor: 0 },
      styles: { fontSize: 8 },
      columnStyles: {
          4: { halign: 'right' }
      }
    });

    doc.save(fileName);
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Informe de Cobranzas Mensual</CardTitle>
          <CardDescription>
            Seleccione el mes y año para ver los recibos emitidos.
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
                    Generar Informe
                </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {hasSearched && (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Resultados del Informe</CardTitle>
                        <CardDescription>
                            {reportData.length > 0 
                                ? `Se encontraron ${reportData.length} recibos.`
                                : "No se encontraron resultados para su búsqueda."
                            }
                        </CardDescription>
                    </div>
                     {reportData.length > 0 && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleExportExcel}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Exportar a Excel
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExportPDF}>
                               <FileDown className="mr-2 h-4 w-4" />
                                Exportar a PDF
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            {reportData.length > 0 && (
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Número</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-right">Importe</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               {isProcessing ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reportData.map((mov) => (
                                        <TableRow key={mov.id}>
                                            <TableCell>{format(new Date(mov.fecha), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell className="font-mono">{`${mov.comprobante}-${String(mov.numero).padStart(8, '0')}`}</TableCell>
                                            <TableCell>{mov.clienteNombre}</TableCell>
                                            <TableCell>{mov.descripcion}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(mov.importe)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={4} className="text-right font-bold text-lg">Total Cobrado</TableCell>
                                    <TableCell className="text-right font-bold text-lg">{formatCurrency(totalCobrado)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </CardContent>
            )}
        </Card>
      )}
    </div>
  )
}
