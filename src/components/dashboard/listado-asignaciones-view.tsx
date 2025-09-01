
"use client"

import * as React from "react"
import { Loader2, FileDown } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Combobox } from "@/components/ui/combobox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getClientes } from "@/lib/services/clientes"
import { getNovedades } from "@/lib/services/novedades"
import { getAsignaciones } from "@/lib/services/asignaciones"
import type { ClienteWithId, NovedadWithId, AsignacionWithId, AsignacionViewModel } from "@/lib/types"
import { Pin } from "lucide-react"

export function ListadoAsignacionesView() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [novedades, setNovedades] = React.useState<NovedadWithId[]>([]);
  const [asignaciones, setAsignaciones] = React.useState<AsignacionViewModel[]>([]);
  const [filteredAsignaciones, setFilteredAsignaciones] = React.useState<AsignacionViewModel[]>([]);
  
  const [selectedNovedadId, setSelectedNovedadId] = React.useState<string | null>("all");
  const [showOnlyEventuales, setShowOnlyEventuales] = React.useState(false);
  
  const { toast } = useToast();

  const novedadOptions = React.useMemo(() => {
    return [
      { value: "all", label: "Todas las novedades" },
      ...novedades.map(n => ({ value: n.id, label: `${n.codigo} - ${n.nombre}` }))
    ]
  }, [novedades]);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [clientesData, novedadesData, asignacionesData] = await Promise.all([
          getClientes(),
          getNovedades(),
          getAsignaciones()
        ]);
        
        const uniqueNovedades = Array.from(new Map(novedadesData.map(item => [item.codigo, item])).values());
        setNovedades(uniqueNovedades.sort((a, b) => a.codigo - b.codigo));

        const clientesMap = new Map(clientesData.map(c => [c.id, c]));
        const novedadesMap = new Map(novedadesData.map(n => [n.id, n]));

        const viewModel: AsignacionViewModel[] = asignacionesData.map(a => {
          const cliente = clientesMap.get(a.clienteId);
          const novedad = novedadesMap.get(a.novedadId);
          if (!cliente || !novedad) return null;
          return {
            id: a.id,
            clienteId: cliente.id,
            clienteCodigo: cliente.codigo,
            clienteNombre: cliente.nombre,
            novedadId: novedad.id,
            novedadCodigo: novedad.codigo,
            novedadNombre: novedad.nombre,
            cantidad: a.cantidad,
            importe: novedad.importe * a.cantidad,
            eventual: a.eventual || false,
          };
        }).filter((item): item is AsignacionViewModel => item !== null)
        .sort((a, b) => a.clienteCodigo - b.clienteCodigo || a.novedadCodigo - b.novedadCodigo);

        setAsignaciones(viewModel);

      } catch (error) {
        console.error("Error fetching data:", error);
        toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);
  
  React.useEffect(() => {
    let newFiltered = [...asignaciones];

    if (selectedNovedadId && selectedNovedadId !== "all") {
      newFiltered = newFiltered.filter(a => a.novedadId === selectedNovedadId);
    }

    if (showOnlyEventuales) {
      newFiltered = newFiltered.filter(a => a.eventual);
    }
    
    setFilteredAsignaciones(newFiltered);
  }, [asignaciones, selectedNovedadId, showOnlyEventuales]);


  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
  };

  const handleExportExcel = () => {
    if (filteredAsignaciones.length === 0) return;
    const selectedNovedad = novedades.find(n => n.id === selectedNovedadId);
    const title = selectedNovedad ? selectedNovedad.nombre : "Todas";
    const fileName = `Listado_Asignaciones_${title.replace(/\s+/g, '_')}.xlsx`;

    const dataForSheet = filteredAsignaciones.map(item => ({
        'Cod. Cliente': item.clienteCodigo,
        'Nombre Cliente': item.clienteNombre,
        'Novedad': `${item.novedadCodigo} - ${item.novedadNombre}`,
        'Cantidad': item.cantidad,
        'Tipo': item.eventual ? 'Eventual' : 'Fijo',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
    worksheet['!cols'] = [{ wch: 15 }, { wch: 40 }, { wch: 40 }, { wch: 15 }, {wch: 10}];
    
    filteredAsignaciones.forEach((_row, index) => {
        const i = index + 2;
        if(worksheet[`D${i}`]) worksheet[`D${i}`].z = '#,##0.00';
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asignaciones");
    XLSX.writeFile(workbook, fileName);
  };

  const handleExportPDF = () => {
    if (filteredAsignaciones.length === 0) return;
    const selectedNovedad = novedades.find(n => n.id === selectedNovedadId);
    const title = selectedNovedad ? selectedNovedad.nombre : "Todas las Novedades";
    const fileName = `Listado_Asignaciones_${selectedNovedad ? selectedNovedad.nombre.replace(/\s+/g, '_') : "Todas"}.pdf`;
    
    const doc = new jsPDF();
    doc.text(`Listado de Asignaciones: ${title}`, 14, 16);
    if(showOnlyEventuales) doc.text("Mostrando solo asignaciones eventuales", 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['Cod. Cliente', 'Nombre Cliente', 'Novedad', 'Cantidad', 'Tipo']],
      body: filteredAsignaciones.map(item => [
          item.clienteCodigo,
          item.clienteNombre,
          `${item.novedadCodigo} - ${item.novedadNombre}`,
          { content: formatNumber(item.cantidad), styles: { halign: 'right' } },
          item.eventual ? 'Eventual' : 'Fijo'
      ]),
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: {
          3: { halign: 'right' }
      }
    });

    doc.save(fileName);
  };

  return (
    <div className="space-y-6 pt-6">
      <Card>
        <CardHeader>
          <CardTitle>Listado de Asignaciones</CardTitle>
          <CardDescription>
            Filtre por novedad para ver las asignaciones a clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
                <div className="flex-grow max-w-md">
                    <Label htmlFor="novedad-select">Filtrar por Novedad</Label>
                    <Combobox 
                        options={novedadOptions}
                        value={selectedNovedadId}
                        onValueChange={setSelectedNovedadId}
                        placeholder="Seleccione una novedad..."
                        searchPlaceholder="Buscar novedad..."
                        notFoundMessage="No se encontraron novedades."
                        disabled={isLoading}
                    />
                </div>
                 <div className="flex items-center space-x-2 pb-2">
                    <Checkbox
                        id="eventuales-only"
                        checked={showOnlyEventuales}
                        onCheckedChange={(checked) => setShowOnlyEventuales(Boolean(checked))}
                    />
                    <Label htmlFor="eventuales-only">Listar solo eventuales</Label>
                </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleExportExcel} disabled={filteredAsignaciones.length === 0}>
                <FileDown className="mr-2 h-4 w-4" /> Exportar a Excel
              </Button>
              <Button onClick={handleExportPDF} disabled={filteredAsignaciones.length === 0}>
                <FileDown className="mr-2 h-4 w-4" /> Exportar a PDF
              </Button>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            Mostrando {filteredAsignaciones.length} de {asignaciones.length} asignaciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="border rounded-lg">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Cod. Cliente</TableHead>
                <TableHead>Nombre Cliente</TableHead>
                <TableHead>Novedad</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-center">Tipo</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </TableCell>
                    </TableRow>
                ) : filteredAsignaciones.length > 0 ? (
                filteredAsignaciones.map((asignacion) => (
                    <TableRow key={asignacion.id}>
                        <TableCell className="font-medium">{asignacion.clienteCodigo}</TableCell>
                        <TableCell>{asignacion.clienteNombre}</TableCell>
                        <TableCell>{`${asignacion.novedadCodigo} - ${asignacion.novedadNombre}`}</TableCell>
                        <TableCell className="text-right">{formatNumber(asignacion.cantidad)}</TableCell>
                        <TableCell className="text-center">
                            {asignacion.eventual && (
                                <Badge variant="outline">
                                    <Pin className="mr-1 h-3 w-3"/>
                                    Eventual
                                </Badge>
                            )}
                        </TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                    No hay asignaciones que coincidan con los filtros.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        </CardContent>
      </Card>
    </div>
  )
}
