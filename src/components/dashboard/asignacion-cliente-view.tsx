
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
import { Trash2, PlusCircle, Loader2, Edit } from "lucide-react"
import type { ClienteWithId, NovedadWithId, ServicioAsignado } from "@/lib/types"
import { getClientes, updateCliente } from "@/lib/services/clientes"
import { getNovedades } from "@/lib/services/novedades"
import { useToast } from "@/hooks/use-toast"
import { AsignacionDialog } from "./asignacion-dialog"

export function AsignacionClienteView() {
  const [clientes, setClientes] = React.useState<ClienteWithId[]>([])
  const [novedades, setNovedades] = React.useState<NovedadWithId[]>([])
  const [selectedCliente, setSelectedCliente] = React.useState<ClienteWithId | null>(null)
  
  const [selectedNovedadId, setSelectedNovedadId] = React.useState<string | null>(null)
  const [newCantidad, setNewCantidad] = React.useState<number | string>(1.00)

  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogEditOpen, setIsDialogEditOpen] = React.useState(false);
  const [asignacionToEdit, setAsignacionToEdit] = React.useState<ServicioAsignado | null>(null);
  const { toast } = useToast()

  React.useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [clientesData, novedadesData] = await Promise.all([getClientes(), getNovedades()]);
            const sortedClientes = clientesData.sort((a, b) => a.codigo - b.codigo);
            setClientes(sortedClientes);
            setNovedades(novedadesData.sort((a, b) => a.codigo - b.codigo));
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, [toast]);
  
  const handleSelectCliente = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    setSelectedCliente(cliente || null);
  }

  const refreshSelectedClientData = React.useCallback(async () => {
    if (!selectedCliente) return;
    const clientesData = await getClientes();
    const updatedClient = clientesData.find(c => c.id === selectedCliente.id);
    setSelectedCliente(updatedClient || null);
  }, [selectedCliente]);

  const handleAddServicio = async () => {
    if (!selectedCliente || !selectedNovedadId) {
      toast({ title: "Error", description: "Debe seleccionar un cliente y una novedad.", variant: "destructive" });
      return;
    }
    const cantidadNum = typeof newCantidad === 'string' ? parseFloat(newCantidad.replace(',', '.')) : newCantidad;
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      toast({ title: "Error", description: "La cantidad debe ser un número positivo.", variant: "destructive" });
      return;
    }

    const serviciosActuales = selectedCliente.serviciosAsignados || [];

    if (serviciosActuales.some(s => s.novedadId === selectedNovedadId)) {
        toast({ title: "Servicio Duplicado", description: "Esta novedad ya ha sido asignada a este cliente.", variant: "destructive" });
        return;
    }

    const nuevoServicio = {
      novedadId: selectedNovedadId,
      cantidad: cantidadNum,
    };
    
    const nuevosServiciosAsignados = [...serviciosActuales, nuevoServicio];

    try {
        await updateCliente(selectedCliente.id, { serviciosAsignados: nuevosServiciosAsignados });
        toast({ title: "Asignación Creada", description: "La novedad se asignó correctamente." });
        await refreshSelectedClientData();
        setSelectedNovedadId(null);
        setNewCantidad(1.00);
    } catch (error) {
        console.error("Error adding service:", error);
        toast({ title: "Error", description: "No se pudo guardar la asignación.", variant: "destructive" });
    }
  };

  const handleRemoveServicio = async (novedadId: string) => {
     if (!selectedCliente) return;
    
    const nuevosServiciosAsignados = (selectedCliente.serviciosAsignados || []).filter(
      s => s.novedadId !== novedadId
    );

    try {
        await updateCliente(selectedCliente.id, { serviciosAsignados: nuevosServiciosAsignados });
        toast({ title: "Asignación Eliminada", description: "La asignación se ha eliminado correctamente." });
        await refreshSelectedClientData();
    } catch (error) {
        console.error("Error removing service:", error);
        toast({ title: "Error", description: "No se pudo eliminar la asignación.", variant: "destructive" });
    }
  };

  const handleEditServicio = (asignacion: ServicioAsignado) => {
    setAsignacionToEdit(asignacion);
    setIsDialogEditOpen(true);
  };

  const handleSaveEdit = async (nuevaCantidad: number) => {
    if (!asignacionToEdit) return;

    const nuevosServiciosAsignados = (selectedCliente?.serviciosAsignados || []).map(servicio =>
      servicio.novedadId === asignacionToEdit.novedadId
        ? { ...servicio, cantidad: nuevaCantidad }
        : servicio
    );

    try {
      await updateCliente(asignacionToEdit.clienteId, { serviciosAsignados: nuevosServiciosAsignados });
      toast({ title: "Asignación Actualizada", description: "La cantidad se actualizó correctamente." });
      await refreshSelectedClientData();
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

  const asignacionesDelCliente = React.useMemo(() => {
    if (!selectedCliente) return [];
    return selectedCliente.serviciosAsignados?.map(servicio => {
        const novedad = novedades.find(n => n.id === servicio.novedadId);
        if (!novedad) return null;
        return {
            clienteId: selectedCliente.id,
            clienteCodigo: selectedCliente.codigo,
            clienteNombre: selectedCliente.nombre,
            novedadId: servicio.novedadId,
            novedadCodigo: novedad.codigo,
            novedadNombre: novedad.nombre,
            cantidad: servicio.cantidad,
            importe: novedad.importe * servicio.cantidad
        }
    }).filter(Boolean) as ServicioAsignado[] || [];
  }, [selectedCliente, novedades]);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
            <CardTitle>Seleccionar Cliente</CardTitle>
            <CardDescription>Elija un cliente para ver y gestionar sus novedades asignadas.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="max-w-md">
                <Label htmlFor="cliente-select">Cliente</Label>
                <Select onValueChange={handleSelectCliente} disabled={isLoading}>
                    <SelectTrigger id="cliente-select"><SelectValue placeholder="Seleccione un cliente..." /></SelectTrigger>
                    <SelectContent>
                        {clientes.map(c => <SelectItem key={c.id} value={c.id}>{`${c.codigo} - ${c.nombre}`}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>
      
      {selectedCliente && (
        <>
            <Card>
                <CardHeader>
                <CardTitle>Añadir Novedad para {selectedCliente.nombre}</CardTitle>
                <CardDescription>Añada una nueva novedad al cliente seleccionado.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="novedad-select">Novedad</Label>
                            <Select onValueChange={setSelectedNovedadId} value={selectedNovedadId || ""}>
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
                            <Button onClick={handleAddServicio} className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Agregar Asignación
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Novedades Asignadas a {selectedCliente.nombre}</CardTitle>
                <CardDescription>Lista de todas las novedades asignadas.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="border rounded-lg">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Novedad</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {asignacionesDelCliente.length > 0 ? (
                        asignacionesDelCliente.map((asignacion) => (
                            <TableRow key={asignacion.novedadId}>
                                <TableCell className="font-medium">{`${asignacion.novedadCodigo} - ${asignacion.novedadNombre}`}</TableCell>
                                <TableCell className="text-right">{formatCurrency(asignacion.cantidad)}</TableCell>
                                <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleEditServicio(asignacion)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveServicio(asignacion.novedadId)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">
                            Este cliente no tiene novedades asignadas.
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </div>
                </CardContent>
            </Card>
        </>
      )}

      <AsignacionDialog
        isOpen={isDialogEditOpen}
        onOpenChange={setIsDialogEditOpen}
        onSave={handleSaveEdit}
        asignacion={asignacionToEdit}
      />
    </div>
  )
}

    