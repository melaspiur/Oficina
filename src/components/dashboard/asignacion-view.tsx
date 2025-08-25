"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, PlusCircle, Loader2 } from "lucide-react"
import type { ClienteWithId, NovedadWithId, ServicioAsignado } from "@/lib/types"
import { getClientes, updateCliente } from "@/lib/services/clientes"
import { getNovedades } from "@/lib/services/novedades"
import { useToast } from "@/hooks/use-toast"

export function AsignacionView() {
  const [clientes, setClientes] = React.useState<ClienteWithId[]>([])
  const [novedades, setNovedades] = React.useState<NovedadWithId[]>([])
  const [allAsignaciones, setAllAsignaciones] = React.useState<ServicioAsignado[]>([])
  
  const [selectedClienteId, setSelectedClienteId] = React.useState<string | null>(null)
  const [selectedNovedadId, setSelectedNovedadId] = React.useState<string | null>(null)
  const [newCantidad, setNewCantidad] = React.useState<number | string>(1.00)

  const [isLoading, setIsLoading] = React.useState(true)
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [clientesData, novedadesData] = await Promise.all([getClientes(), getNovedades()]);
      const sortedClientes = clientesData.sort((a, b) => a.codigo - b.codigo);
      setClientes(sortedClientes);
      const sortedNovedades = novedadesData.sort((a, b) => a.codigo - b.codigo);
      setNovedades(sortedNovedades);

      // Create the flat table of assignments
      const flatAsignaciones: ServicioAsignado[] = [];
      sortedClientes.forEach(cliente => {
        cliente.serviciosAsignados?.forEach(servicio => {
          const novedad = sortedNovedades.find(n => n.id === servicio.novedadId);
          if (novedad) {
            flatAsignaciones.push({
              clienteId: cliente.id,
              clienteCodigo: cliente.codigo,
              clienteNombre: cliente.nombre,
              novedadId: servicio.novedadId,
              novedadCodigo: novedad.codigo,
              novedadNombre: novedad.nombre,
              cantidad: servicio.cantidad,
              importe: servicio.importe
            });
          }
        });
      });
      setAllAsignaciones(flatAsignaciones);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddServicio = async () => {
    if (!selectedClienteId || !selectedNovedadId) {
      toast({ title: "Error", description: "Debe seleccionar un cliente y una novedad.", variant: "destructive" });
      return;
    }
    const cantidadNum = typeof newCantidad === 'string' ? parseFloat(newCantidad.replace(',', '.')) : newCantidad;
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      toast({ title: "Error", description: "La cantidad debe ser un número positivo.", variant: "destructive" });
      return;
    }

    const cliente = clientes.find(c => c.id === selectedClienteId);
    const novedad = novedades.find(n => n.id === selectedNovedadId);
    if (!cliente || !novedad) return;

    const serviciosActuales = cliente.serviciosAsignados || [];

    if (serviciosActuales.some(s => s.novedadId === selectedNovedadId)) {
        toast({ title: "Servicio Duplicado", description: "Esta novedad ya ha sido asignada a este cliente.", variant: "destructive" });
        return;
    }

    const nuevoServicio = {
      novedadId: novedad.id,
      nombre: novedad.nombre,
      cantidad: cantidadNum,
      importe: novedad.importe * cantidadNum,
    };
    
    const nuevosServiciosAsignados = [...serviciosActuales, nuevoServicio];

    try {
        await updateCliente(cliente.id, { serviciosAsignados: nuevosServiciosAsignados });
        toast({ title: "Asignación Creada", description: "La novedad se asignó correctamente." });
        fetchData(); // Refresh the entire view
        // Reset form
        setSelectedClienteId(null);
        setSelectedNovedadId(null);
        setNewCantidad(1.00);
    } catch (error) {
        console.error("Error adding service:", error);
        toast({ title: "Error", description: "No se pudo guardar la asignación.", variant: "destructive" });
    }
  };

  const handleRemoveServicio = async (asignacion: ServicioAsignado) => {
    const cliente = clientes.find(c => c.id === asignacion.clienteId);
    if (!cliente) return;
    
    const nuevosServiciosAsignados = (cliente.serviciosAsignados || []).filter(
      s => s.novedadId !== asignacion.novedadId
    );

    try {
        await updateCliente(cliente.id, { serviciosAsignados: nuevosServiciosAsignados });
        toast({ title: "Asignación Eliminada", description: "La asignación se ha eliminado correctamente." });
        fetchData(); // Refresh the entire view
    } catch (error) {
        console.error("Error removing service:", error);
        toast({ title: "Error", description: "No se pudo eliminar la asignación.", variant: "destructive" });
    }
  };
  
  const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-AR', {
          style: 'decimal',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
      }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Crear Nueva Asignación</CardTitle>
          <CardDescription>Añada una nueva novedad a un cliente.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                    <Label htmlFor="cliente-select">Cliente</Label>
                    <Select onValueChange={setSelectedClienteId} value={selectedClienteId || ""} disabled={isLoading}>
                        <SelectTrigger id="cliente-select"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                        <SelectContent>
                            {clientes.map(c => <SelectItem key={c.id} value={c.id}>{`${c.codigo} - ${c.nombre}`}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="novedad-select">Novedad</Label>
                     <Select onValueChange={setSelectedNovedadId} value={selectedNovedadId || ""} disabled={isLoading}>
                        <SelectTrigger id="novedad-select"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                        <SelectContent>
                            {novedades.map(n => <SelectItem key={n.id} value={n.id}>{`${n.codigo} - ${n.nombre}`}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="cantidad-input">Cantidad</Label>
                    <Input 
                        id="cantidad-input"
                        type="text" 
                        inputMode="decimal"
                        value={String(newCantidad).replace('.',',')}
                        onChange={(e) => setNewCantidad(e.target.value)}
                    />
                </div>
                <div>
                    <Button onClick={handleAddServicio} disabled={isLoading} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar Asignación
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tabla de Asignaciones</CardTitle>
          <CardDescription>Todas las novedades asignadas a los clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cód. Cliente</TableHead>
                  <TableHead>Nombre Cliente</TableHead>
                  <TableHead>Novedad</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : allAsignaciones.length > 0 ? (
                  allAsignaciones.map((asignacion, index) => (
                    <TableRow key={`${asignacion.clienteId}-${asignacion.novedadId}-${index}`}>
                      <TableCell>{asignacion.clienteCodigo}</TableCell>
                      <TableCell className="font-medium">{asignacion.clienteNombre}</TableCell>
                       <TableCell>{`${asignacion.novedadCodigo} - ${asignacion.novedadNombre}`}</TableCell>
                      <TableCell className="text-right">{formatCurrency(asignacion.cantidad)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveServicio(asignacion)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No hay asignaciones para mostrar.
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
