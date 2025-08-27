
"use client"

import * as React from "react"
import { format } from "date-fns"
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
import { getMovimientosPorClienteLastYear } from "@/lib/services/movimientos"
import { getClientes } from "@/lib/services/clientes"
import type { MovimientoWithId, ClienteWithId } from "@/lib/types"

interface CuentaCorrienteItem extends MovimientoWithId {
  debe: number;
  haber: number;
  saldo: number;
}

export function InformeCuentaCorrienteView() {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [reportData, setReportData] = React.useState<CuentaCorrienteItem[]>([])
  const [allClientes, setAllClientes] = React.useState<ClienteWithId[]>([])
  const [selectedCliente, setSelectedCliente] = React.useState<ClienteWithId | null>(null);
  const [selectedClienteId, setSelectedClienteId] = React.useState<string | null>(null);
  
  const { toast } = useToast()

  const clienteOptions = React.useMemo(() => {
      return allClientes
        .sort((a, b) => a.codigo - b.codigo)
        .map(c => ({ value: c.id, label: `${c.codigo} - ${c.nombre}` }));
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
  
  const handleSelectCliente = async (clienteId: string) => {
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
        const movimientos = await getMovimientosPorClienteLastYear(clienteId);
        
        const sortedMovimientos = movimientos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

        let saldoAcumulado = 0;
        const processedData: CuentaCorrienteItem[] = sortedMovimientos.map(mov => {
            const debe = mov.comprobante === 'FC' ? mov.importe : 0;
            const haber = mov.comprobante === 'RE' ? mov.importe : 0;
            saldoAcumulado += debe - haber;

            return {
                ...mov,
                debe,
                haber,
                saldo: saldoAcumulado
            };
        });

        setReportData(processedData);

        if (processedData.length === 0) {
            toast({
                title: "Sin Resultados",
                description: "No se encontraron movimientos para este cliente en el último año.",
            });
        }
    } catch (error) {
        console.error("Error al generar el informe:", error)
        toast({
            title: "Error",
            description: "No se pudo generar el informe de cuenta corriente.",
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

  const finalBalance = reportData.length > 0 ? reportData[reportData.length - 1].saldo : 0;
  
  const handleExportExcel = () => {
    if (!selectedCliente) return;
    const fileName = `CuentaCorriente_${selectedCliente.nombre.replace(/\s+/g, '_')}.xlsx`;

    const dataForSheet = reportData.map(item => ({
        Fecha: format(new Date(item.fecha), 'dd/MM/yyyy'),
        Comprobante: `${item.comprobante}-${String(item.numero).padStart(8, '0')}`,
        Descripcion: item.descripcion,
        Debe: item.debe,
        Haber: item.haber,
        Saldo: item.saldo,
    }));
    
    // Add total row
    dataForSheet.push({
      // @ts-ignore
      Fecha: '',
      Comprobante: '',
      Descripcion: 'Saldo Final',
      Debe: undefined,
      Haber: undefined,
      Saldo: finalBalance
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
    
    // Set column widths
    worksheet['!cols'] = [
        { wch: 12 }, // Fecha
        { wch: 15 }, // Comprobante
        { wch: 40 }, // Descripcion
        { wch: 15 }, // Debe
        { wch: 15 }, // Haber
        { wch: 15 }, // Saldo
    ];

    // Format currency columns
    dataForSheet.forEach((_row, index) => {
        const i = index + 2; // XLSX rows are 1-based, and we have a header
        if(worksheet[`D${i}`]) worksheet[`D${i}`].z = '$ #,##0.00';
        if(worksheet[`E${i}`]) worksheet[`E${i}`].z = '$ #,##0.00';
        if(worksheet[`F${i}`]) worksheet[`F${i}`].z = '$ #,##0.00';
    });


    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cuenta Corriente");
    XLSX.writeFile(workbook, fileName);
  };

  const handleExportPDF = () => {
    if (!selectedCliente) return;
    const fileName = `CuentaCorriente_${selectedCliente.nombre.replace(/\s+/g, '_')}.pdf`;
    
    const doc = new jsPDF();
    doc.text(`Cuenta Corriente: ${selectedCliente.nombre}`, 14, 16);
    doc.text(`Período: Último año`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [['Fecha', 'Comprobante', 'Descripción', 'Debe', 'Haber', 'Saldo']],
      body: reportData.map(item => [
          format(new Date(item.fecha), 'dd/MM/yyyy'),
          `${item.comprobante}-${String(item.numero).padStart(8, '0')}`,
          item.descripcion || '',
          { content: item.debe > 0 ? formatCurrency(item.debe) : '', styles: { halign: 'right' } },
          { content: item.haber > 0 ? formatCurrency(item.haber) : '', styles: { halign: 'right' } },
          { content: formatCurrency(item.saldo), styles: { halign: 'right' } }
      ]),
      foot: [
          [{ content: 'Saldo Final', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
           { content: formatCurrency(finalBalance), styles: { halign: 'right', fontStyle: 'bold' } }]
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

    doc.save(fileName);
  };


  return (
    <div className="p-6 space-y-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>Informe de Cuenta Corriente por Cliente</CardTitle>
          <CardDescription>
            Seleccione un cliente para ver su estado de cuenta del último año.
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
                        <CardTitle>Cuenta Corriente</CardTitle>
                        {selectedCliente && !isProcessing && (
                            <CardDescription>
                                Mostrando {reportData.length} movimientos para {selectedCliente.nombre}.
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
                                <TableHead>Comprobante</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-right">Debe</TableHead>
                                <TableHead className="text-right">Haber</TableHead>
                                <TableHead className="text-right">Saldo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {isProcessing ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            ) : reportData.length > 0 ? (
                                reportData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{format(new Date(item.fecha), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="font-mono">{`${item.comprobante}-${String(item.numero).padStart(8, '0')}`}</TableCell>
                                        <TableCell>{item.descripcion}</TableCell>
                                        <TableCell className="text-right font-medium text-destructive">{item.debe > 0 ? formatCurrency(item.debe) : ""}</TableCell>
                                        <TableCell className="text-right font-medium text-green-600">{item.haber > 0 ? formatCurrency(item.haber) : ""}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(item.saldo)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        No se encontraron movimientos para este cliente en el último año.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        {reportData.length > 0 && !isProcessing && (
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={5} className="text-right font-bold text-lg">Saldo Final</TableCell>
                                    <TableCell className="text-right font-bold text-lg">{formatCurrency(finalBalance)}</TableCell>
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
