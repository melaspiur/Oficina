"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2, Search, Send } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useToast } from "@/hooks/use-toast"
import { getMovimientosPorCliente, getClientesConSaldoPendienteYCelular } from "@/lib/services/movimientos"
import { uploadFile } from "@/lib/services/storage"
import type { ClienteWithId, MovimientoWithId } from "@/lib/types"

const currentYear = new Date().getFullYear()

const formSchema = z.object({
  mes: z.string().min(1, "Debe seleccionar un mes."),
  ano: z.string().min(4, "Debe seleccionar un año."),
})

type FormSchema = z.infer<typeof formSchema>

export function InformeResumenWhatsappView() {
  const [isSearching, setIsSearching] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null); // Store client ID being processed
  const [clientesParaEnviar, setClientesParaEnviar] = React.useState<ClienteWithId[]>([])
  const [hasSearched, setHasSearched] = React.useState(false);
  const { toast } = useToast()

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mes: String(new Date().getMonth() + 1),
      ano: String(currentYear),
    },
  })

  const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
      }).format(value);
  };
  
  const generatePdfBlob = (
      cliente: ClienteWithId,
      movimientos: MovimientoWithId[],
      mes: number,
      ano: number
  ): Blob => {
    const startDate = new Date(ano, mes - 1, 1);
    const endDate = new Date(ano, mes, 0, 23, 59, 59, 999); 
    const mesLabel = format(startDate, 'LLLL', { locale: es });

    const movimientosAnteriores = movimientos.filter(m => new Date(m.fecha) < startDate);
    let saldoInicial = 0;
    movimientosAnteriores.forEach(m => {
        saldoInicial += (m.comprobante === 'FC' ? m.importe : -m.importe);
    });

    const movimientosDelMes = movimientos
      .filter(m => {
          const fechaMov = new Date(m.fecha);
          return fechaMov >= startDate && fechaMov <= endDate;
      })
      .sort((a,b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    let saldoAcumulado = saldoInicial;
    const reportData: any[] = [];
    
    reportData.push([
      '', '', { content: 'SALDO ANTERIOR', styles: { fontStyle: 'bold' } }, '', '', 
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
    
    const doc = new jsPDF();
    doc.text(`Cuenta Corriente: ${cliente.codigo} - ${cliente.nombre}`, 14, 16);
    doc.text(`Período: ${mesLabel} ${ano}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [['Fecha', 'Comprobante', 'Descripción', 'Debe', 'Haber', 'Saldo']],
      body: reportData,
      foot: [[{ content: 'Saldo Final', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, { content: formatCurrency(saldoAcumulado), styles: { halign: 'right', fontStyle: 'bold' } }]],
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      footStyles: { fillColor: [236, 240, 241], textColor: 0 },
      styles: { fontSize: 8 },
      columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } }
    });

    return doc.output('blob');
  }

  const handleSearch = async (data: FormSchema) => {
    setIsSearching(true);
    setHasSearched(true);
    setClientesParaEnviar([]);
    try {
      const clientes = await getClientesConSaldoPendienteYCelular();
       if (clientes.length === 0) {
        toast({ title: "Sin Clientes", description: "No se encontraron clientes con saldo pendiente y número de celular cargado." });
      }
      setClientesParaEnviar(clientes);
    } catch (error) {
      console.error("Error buscando clientes:", error);
      toast({ title: "Error", description: "No se pudieron buscar los clientes.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  }

  const handleSend = async (cliente: ClienteWithId) => {
    const { mes, ano } = form.getValues();
    setIsProcessing(cliente.id);

    try {
        const todosLosMovimientos = await getMovimientosPorCliente(cliente.id);
        const mesLabel = format(new Date(parseInt(ano, 10), parseInt(mes, 10) - 1), 'LLLL', { locale: es });
        const fileName = `Resumen-${cliente.nombre.replace(/\s+/g, '_')}-${mesLabel}-${ano}.pdf`;

        // 1. Generate PDF blob
        const pdfBlob = generatePdfBlob(cliente, todosLosMovimientos, parseInt(mes, 10), parseInt(ano, 10));

        // 2. Trigger local download
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(pdfBlob);
        downloadLink.download = fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadLink.href);

        toast({
            title: "PDF Descargado",
            description: `El resumen para ${cliente.nombre} ha comenzado a descargarse.`,
        });

        // 3. Upload PDF to storage and open WhatsApp
        const filePath = `resumenes/${cliente.cuit}/${ano}-${mesLabel}.pdf`;
        const downloadURL = await uploadFile(pdfBlob, filePath);
        
        const mensaje = encodeURIComponent(`Hola ${cliente.nombre}, te enviamos el resumen de cuenta del mes de ${mesLabel}. Puedes verlo en: ${downloadURL}`);
        const numeroLimpio = cliente.celular!.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${numeroLimpio}?text=${mensaje}`;
        window.open(whatsappUrl, '_blank');

        toast({
            title: "Listo para Enviar",
            description: `Se ha abierto WhatsApp para enviar el resumen a ${cliente.nombre}.`,
        });

    } catch (error) {
        console.error("Error al generar o enviar resumen:", error);
        toast({ title: "Error", description: "No se pudo completar el proceso de envío.", variant: "destructive" });
    } finally {
        setIsProcessing(null);
    }
  };


  const mesesOptions = Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: format(new Date(0, i), 'LLLL', { locale: es }),
  }));
  const anosOptions = Array.from({ length: 10 }, (_, i) => String(currentYear - i));

  return (
    <div className="p-6 space-y-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Envío de Resúmenes Mensuales por WhatsApp</CardTitle>
          <CardDescription>
            Busque los clientes con saldo pendiente para un período y envíe sus resúmenes de cuenta por WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSearch)} className="flex flex-col sm:flex-row gap-4 items-end">
                <FormField
                    control={form.control}
                    name="mes"
                    render={({ field }) => (
                    <FormItem className="w-full sm:w-auto flex-grow">
                        <FormLabel>Mes del Resumen</FormLabel>
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
                        <FormLabel>Año del Resumen</FormLabel>
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
                <Button type="submit" className="w-full sm:w-auto" disabled={isSearching}>
                    {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Buscar Clientes
                </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {hasSearched && (
        <Card>
            <CardHeader>
                <CardTitle>Clientes a Enviar</CardTitle>
                <CardDescription>
                    {isSearching 
                        ? "Buscando clientes..." 
                        : `Se encontraron ${clientesParaEnviar.length} clientes con saldo pendiente y celular.`
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Celular</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isSearching ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            ) : clientesParaEnviar.length > 0 ? (
                                clientesParaEnviar.map(cliente => (
                                    <TableRow key={cliente.id}>
                                        <TableCell>{cliente.codigo}</TableCell>
                                        <TableCell className="font-medium">{cliente.nombre}</TableCell>
                                        <TableCell className="font-mono">{cliente.celular}</TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                size="sm"
                                                onClick={() => handleSend(cliente)}
                                                disabled={isProcessing === cliente.id}
                                            >
                                                {isProcessing === cliente.id ? 
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                                                    <Send className="mr-2 h-4 w-4" />
                                                }
                                                Enviar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                               <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No se encontraron clientes para los criterios de búsqueda.
                                    </TableCell>
                                </TableRow> 
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      )}

    </div>
  )
}
