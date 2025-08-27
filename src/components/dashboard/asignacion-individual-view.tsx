"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, PlusCircle, Loader2, Edit } from "lucide-react"
import type { ClienteWithId, NovedadWithId, AsignacionViewModel, AsignacionWithId } from "@/lib/types"
import { getClientes } from "@/lib/services/clientes"
import { getNovedades } from "@/lib/services/novedades"
import { getAsignaciones, addAsignacion, updateAsignacion, deleteAsignacion } from "@/lib/services/asignaciones"
import { useToast } from "@/hooks/use-toast"
import { AsignacionDialog } from "./asignacion-dialog"
import { Combobox } from "@/components/ui/combobox"

export function AsignacionIndividualView() {
  const [clientes, setClientes] = React.useState<ClienteWithId[]>([])
  const [novedades, setNovedades] = React.useState<NovedadWithId[]>([])
  const [allAsignaciones, setAllAsignaciones] = React.useState<AsignacionViewModel[]>([])
  
  const [selectedClienteId, setSelectedClienteId] = React.useState<string | null>(null)
  const [selectedNovedadId, setSelectedNovedadId] = React.useState<string | null>(null)
  const [newCantidad, setNewCantidad] = React.useState<number | string>(1.00)

  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogEditOpen, setIsDialogEditOpen] = React.useState(false);
  const [asignacionToEdit, setAsignacionToEdit] = React.useState<AsignacionViewModel | null>(null);
  const { toast } = useToast()

  const clienteOptions = React.useMemo(() => {
    return clientes.map(c => ({ value: c.id, label: `${c.codigo} - ${c.nombre}` }))
  }, [clientes]);
  
  const novedadOptions = React.useMemo(() => {
    return novedades.map(n => ({ value: n.id, label: `${n.codigo} - ${n.nombre}` }))
  }, [novedades]);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [clientesData, novedadesData, asignacionesData] = await Promise.all([
          getClientes(), 
          getNovedades(),
          getAsignaciones()
      ]);

      const clientesMap = new Map(clientesData.map(c => [c.id, c]));
      const novedadesMap = new Map(novedadesData.map(n => [n.id, n]));

      const sortedClientes = clientesData.sort((a, b) => a.codigo - b.codigo);
      setClientes(sortedClientes);
      const sortedNovedades = novedadesData.sort((a, b) => a.codigo - b.codigo);
      setNovedades(sortedNovedades);
      
      const viewModel: AsignacionViewModel[] = asignacionesData.map(asignacion => {
        const cliente = clientesMap.get(asignacion.clienteId);
        const novedad = novedadesMap.get(asignacion.novedadId);
        if (!cliente || !novedad) return null;

        return {
          id: asignacion.id,
          clienteId: cliente.id,
          clienteCodigo: cliente.codigo,
          clienteNombre: cliente.nombre,
          novedadId: novedad.id,
          novedadCodigo: novedad.codigo,
          novedadNombre: novedad.nombre,
          cantidad: asignacion.cantidad,
          importe: novedad.importe * asignacion.cantidad
        };
      }).filter((item): item is AsignacionViewModel => item !== null);
      
      setAllAsignaciones(viewModel.sort((a, b) => a.clienteCodigo - b.clienteCodigo || a.novedadCodigo - b.novedadCodigo));

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

    try {
        await addAsignacion({
            clienteId: selectedClienteId,
            novedadId: selectedNovedadId,
            cantidad: cantidadNum,
        });
        toast({ title: "Asignación Creada", description: "La novedad se asignó correctamente." });
        fetchData(); 
        setSelectedClienteId(null);
        setSelectedNovedadId(null);
        setNewCantidad(1.00);
    } catch (error: any) {
        console.error("Error adding service:", error);
        toast({ title: "Error", description: error.message || "No se pudo guardar la asignación.", variant: "destructive" });
    }
  };

  const handleRemoveServicio = async (asignacion: AsignacionViewModel) => {
    try {
        await deleteAsignacion(asignacion.id);
        toast({ title: "Asignación Eliminada", description: "La asignación se ha eliminado correctamente." });
        fetchData();
    } catch (error) {
        console.error("Error removing service:", error);
        toast({ title: "Error", description: "No se pudo eliminar la asignación.", variant: "destructive" });
    }
  };

  const handleEditServicio = (asignacion: AsignacionViewModel) => {
    setAsignacionToEdit(asignacion);
    setIsDialogEditOpen(true);
  };

  const handleSaveEdit = async (nuevaCantidad: number) => {
    if (!asignacionToEdit) return;

    try {
      await updateAsignacion(asignacionToEdit.id, { cantidad: nuevaCantidad });
      toast({ title: "Asignación Actualizada", description: "La cantidad se actualizó correctamente." });
      fetchData();
    } catch (error) {
      console.error("Error updating service:", error);
      toast({ title: "Error", description: "No se pudo actualizar la asignación.", variant: "destructive" });
    } finally {
      setIsDialogEditOpen(false);
      setAsignacionToEdit(null);
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
          <CardTitle>Crear Nueva Asignación Individual</CardTitle>
          <CardDescription>Añada una nueva novedad a un cliente específico.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                    <Label htmlFor="cliente-select">Cliente</Label>
                    <Combobox
                        options={clienteOptions}
                        value={selectedClienteId}
                        onValueChange={setSelectedClienteId}
                        placeholder="Seleccione un cliente..."
                        searchPlaceholder="Buscar cliente..."
                        notFoundMessage="No se encontraron clientes."
                        disabled={isLoading}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="novedad-select">Novedad</Label>
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
                 <div className="space-y-2">
                    <Label htmlFor="cantidad-input">Cantidad</Label>
                    <Input 
                        id="cantidad-input"
                        type="text" 
                        inputMode="decimal"
                        value={String(newCantidad).replace('.',',')}
                        onChange={(e) => setNewCantidad(e.target.value)}
                        disabled={isLoading}
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
          <CardTitle>Tabla General de Asignaciones</CardTitle>
          <CardDescription>Todas las novedades asignadas a todos los clientes.</CardDescription>
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
                  <TableHead className="text-right">Acciones</TableHead>
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
                  allAsignaciones.map((asignacion) => (
                    <TableRow key={asignacion.id}>
                      <TableCell>{asignacion.clienteCodigo}</TableCell>
                      <TableCell className="font-medium">{asignacion.clienteNombre}</TableCell>
                       <TableCell>{`${asignacion.novedadCodigo} - ${asignacion.novedadNombre}`}</TableCell>
                      <TableCell className="text-right">{formatCurrency(asignacion.cantidad)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditServicio(asignacion)}>
                          <Edit className="h-4 w-4" />
                        </Button>
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
      <AsignacionDialog
        isOpen={isDialogEditOpen}
        onOpenChange={setIsDialogEditOpen}
        onSave={handleSaveEdit}
        asignacion={asignacionToEdit}
      />
    </div>
  )
}
