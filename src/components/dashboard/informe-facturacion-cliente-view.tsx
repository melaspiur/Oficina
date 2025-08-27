
"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2, FileDown } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Combobox } from "@/components/ui/combobox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getMovimientosFacturasPorCliente } from "@/lib/services/movimientos"
import { getClientes } from "@/lib/services/clientes"
import type { MovimientoWithId, ClienteWithId } from "@/lib/types"

export function InformeFacturacionClienteView() {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [reportData, setReportData] = React.useState<MovimientoWithId[]>([])
  const [allClientes, setAllClientes] = React.useState<ClienteWithId[]>([])
  const [selectedCliente, setSelectedCliente] = React.useState<ClienteWithId | null>(null);
  const [selectedClienteId, setSelectedClienteId] = React.useState<string | null>(null);
  
  const { toast } = useToast()

  const clienteOptions = React.useMemo(() => {
      return allClientes
        .map(c => ({ value: c.id, label: `${c.codigo} - ${c.nombre}` }))
        .sort((a,b) => a.label.localeCompare(b.label));
  }, [allClientes])

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
  
  const handleSelectCliente = async (clienteId: string | null) => {
    setSelectedClienteId(clienteId);
    
    if (!clienteId) {
        setReportData([]);
        setSelectedCliente(null);
        return;
    }

    const cliente = allClientes.find(c => c.id === clienteId);
    setSelectedCliente(cliente || null);

    setIsProcessing(true);
    setReportData([]);

    try {
        const unFilteredResult = await getMovimientosFacturasPorCliente(clienteId);
        
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const result = unFilteredResult.filter(mov => new Date(mov.fecha) >= oneYearAgo);

        setReportData(result.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));

        if (result.length === 0) {
            toast({
                title: "Sin Resultados",
                description: "No se encontraron facturas para este cliente en el último año.",
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
        setIsProcessing(false);
    }
  }


  const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
      }).format(value);
  };

  const totalFacturado = React.useMemo(() => {
      return reportData.reduce((acc, item) => acc + item.importe, 0);
  }, [reportData]);
  
  const handleExportExcel = () => {
    if (!selectedCliente) return;
    const fileName = `Facturacion_${selectedCliente.nombre.replace(/\s+/g, '_')}_ultimo_ano.xlsx`;

    const dataForSheet = reportData.map(item => ({
        Fecha: format(new Date(item.fecha), 'dd/MM/yyyy'),
        Numero: `${item.comprobante}-${String(item.numero).padStart(8, '0')}`,
        Descripcion: item.descripcion,
        Importe: item.importe,
    }));
    
    dataForSheet.push({
      Fecha: '',
      Numero: '',
      Descripcion: 'Total General',
      Importe: totalFacturado
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet);

    worksheet['!cols'] = [
        { wch: 12 }, // Fecha
        { wch: 15 }, // Numero
        { wch: 40 }, // Descripcion
        { wch: 15 }, // Importe
    ];

    dataForSheet.forEach((_row, index) => {
        const i = index + 2;
        if(worksheet[`D${i}`]) worksheet[`D${i}`].z = '$ #,##0.00';
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Facturacion");
    XLSX.writeFile(workbook, fileName);
  };

  const handleExportPDF = () => {
    if (!selectedCliente) return;
    const fileName = `Facturacion_${selectedCliente.nombre.replace(/\s+/g, '_')}_ultimo_ano.pdf`;
    
    const doc = new jsPDF();
    doc.text(`Informe de Facturación para: ${selectedCliente.nombre}`, 14, 16);
    doc.text(`Período: Último año`, 14, 22);


    autoTable(doc, {
      startY: 30,
      head: [['Fecha', 'Número', 'Descripción', 'Importe']],
      body: reportData.map(item => [
          format(new Date(item.fecha), 'dd/MM/yyyy'),
          `${item.comprobante}-${String(item.numero).padStart(8, '0')}`,
          item.descripcion || '',
          { content: formatCurrency(item.importe), styles: { halign: 'right' } }
      ]),
      foot: [
          [{ content: 'Total General', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
           { content: formatCurrency(totalFacturado), styles: { halign: 'right', fontStyle: 'bold' } }]
      ],
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      footStyles: { fillColor: [236, 240, 241], textColor: 0 },
      styles: { fontSize: 9 },
      columnStyles: {
          3: { halign: 'right' }
      }
    });

    doc.save(fileName);
  };


  return (
    <div className="p-6 space-y-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Informe de Facturación por Cliente</CardTitle>
          <CardDescription>
            Seleccione un cliente para ver sus facturas emitidas en el último año.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Label htmlFor="cliente-select">Cliente</Label>
            <Combobox 
                options={clienteOptions}
                value={selectedClienteId}
                onValueChange={handleSelectCliente}
                placeholder="Seleccione un cliente..."
                searchPlaceholder="Buscar cliente..."
                notFoundMessage="No se encontraron clientes."
                disabled={allClientes.length === 0}
            />
          </div>
        </CardContent>
      </Card>
      
      { (isProcessing || reportData.length > 0 || (selectedClienteId && !isProcessing)) && (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Resultados del Informe</CardTitle>
                        {selectedCliente && !isProcessing && (
                            <CardDescription>
                                Mostrando {reportData.length} facturas para {selectedCliente.nombre}.
                            </CardDescription>
                        )}
                    </div>
                     {reportData.length > 0 && !isProcessing && (
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
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Número</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-right">Importe</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {isProcessing ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            ) : reportData.length > 0 ? (
                                reportData.map((mov) => (
                                    <TableRow key={mov.id}>
                                        <TableCell>{format(new Date(mov.fecha), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="font-mono">{`${mov.comprobante}-${String(mov.numero).padStart(8, '0')}`}</TableCell>
                                        <TableCell>{mov.descripcion}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(mov.importe)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        No se encontraron facturas para este cliente en el último año.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        {reportData.length > 0 && !isProcessing && (
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={3} className="text-right font-bold text-lg">Total Facturado</TableCell>
                                    <TableCell className="text-right font-bold text-lg">{formatCurrency(totalFacturado)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  )
}
    
