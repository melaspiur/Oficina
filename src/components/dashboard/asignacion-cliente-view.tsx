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
import type { ClienteWithId, NovedadWithId, AsignacionViewModel } from "@/lib/types"
import { getClientes } from "@/lib/services/clientes"
import { getNovedades } from "@/lib/services/novedades"
import { getAsignacionesByClienteId, addAsignacion, updateAsignacion, deleteAsignacion } from "@/lib/services/asignaciones"
import { useToast } from "@/hooks/use-toast"
import { AsignacionDialog } from "./asignacion-dialog"
import { Combobox } from "@/components/ui/combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AsignacionClienteView() {
  // Global data
  const [clientes, setClientes] = React.useState<ClienteWithId[]>([])
  const [novedades, setNovedades] = React.useState<NovedadWithId[]>([])
  
  // State for the selected client and their assignments
  const [selectedCliente, setSelectedCliente] = React.useState<ClienteWithId | null>(null)
  const [asignacionesCliente, setAsignacionesCliente] = React.useState<AsignacionViewModel[]>([]);
  
  // State for the "add new" form
  const [selectedNovedadId, setSelectedNovedadId] = React.useState<string | null>(null)
  const [newCantidad, setNewCantidad] = React.useState<number | string>(1.00)

  // UI State
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingAsignaciones, setIsLoadingAsignaciones] = React.useState(false);
  const [isDialogEditOpen, setIsDialogEditOpen] = React.useState(false);
  const [asignacionToEdit, setAsignacionToEdit] = React.useState<AsignacionViewModel | null>(null);
  const { toast } = useToast()

  const clienteOptions = React.useMemo(() => {
    return clientes
      .sort((a, b) => a.codigo - b.codigo)
      .map(c => ({ value: c.id, label: `${c.codigo} - ${c.nombre}` }));
  }, [clientes]);


  // Initial data fetch for clients and novedades
  React.useEffect(() => {
    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [clientesData, novedadesData] = await Promise.all([getClientes(), getNovedades()]);
            setClientes(clientesData);
            setNovedades(novedadesData.sort((a, b) => a.codigo - b.codigo));
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ title: "Error", description: "No se pudieron cargar los datos iniciales.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    fetchInitialData();
  }, [toast]);
  
  const fetchAsignacionesForCliente = React.useCallback(async (clienteId: string) => {
      if (!clienteId) return;
      setIsLoadingAsignaciones(true);
      try {
          const asignacionesData = await getAsignacionesByClienteId(clienteId);
          const novedadesMap = new Map(novedades.map(n => [n.id, n]));
          const cliente = clientes.find(c => c.id === clienteId);
          if (!cliente) return;

          const viewModel: AsignacionViewModel[] = asignacionesData.map(a => {
              const novedad = novedadesMap.get(a.novedadId);
              if (!novedad) return null;
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
              };
          }).filter((item): item is AsignacionViewModel => item !== null);

          setAsignacionesCliente(viewModel);

      } catch (error) {
          console.error("Error fetching assignments for client:", error);
          toast({ title: "Error", description: "No se pudieron cargar las asignaciones del cliente.", variant: "destructive" });
      } finally {
          setIsLoadingAsignaciones(false);
      }
  }, [clientes, novedades, toast]);

  const handleSelectCliente = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    setSelectedCliente(cliente || null);
    setAsignacionesCliente([]); // Clear previous assignments
    if (clienteId) {
        fetchAsignacionesForCliente(clienteId);
    }
  }

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

    try {
        await addAsignacion({
            clienteId: selectedCliente.id,
            novedadId: selectedNovedadId,
            cantidad: cantidadNum,
        });
        toast({ title: "Asignación Creada", description: "La novedad se asignó correctamente." });
        fetchAsignacionesForCliente(selectedCliente.id); // Refresh list
        setSelectedNovedadId(null);
        setNewCantidad(1.00);
    } catch (error: any) {
        console.error("Error adding service:", error);
        toast({ title: "Error", description: error.message || "No se pudo guardar la asignación.", variant: "destructive" });
    }
  };

  const handleRemoveServicio = async (asignacionId: string) => {
    try {
        await deleteAsignacion(asignacionId);
        toast({ title: "Asignación Eliminada", description: "La asignación se ha eliminado correctamente." });
        if(selectedCliente) fetchAsignacionesForCliente(selectedCliente.id);
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
      if(selectedCliente) fetchAsignacionesForCliente(selectedCliente.id);
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
    <div className="space-y-6 pt-6">
      <Card>
        <CardHeader>
            <CardTitle>Seleccionar Cliente</CardTitle>
            <CardDescription>Elija un cliente para ver y gestionar sus novedades asignadas.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="max-w-md">
                <Label htmlFor="cliente-select">Cliente</Label>
                 <Combobox 
                    options={clienteOptions}
                    value={selectedCliente?.id}
                    onValueChange={handleSelectCliente}
                    placeholder="Seleccione un cliente..."
                    searchPlaceholder="Buscar cliente..."
                    notFoundMessage="No se encontraron clientes."
                    disabled={isLoading}
                />
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
                        {isLoadingAsignaciones ? (
                             <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : asignacionesCliente.length > 0 ? (
                        asignacionesCliente.map((asignacion) => (
                            <TableRow key={asignacion.id}>
                                <TableCell className="font-medium">{`${asignacion.novedadCodigo} - ${asignacion.novedadNombre}`}</TableCell>
                                <TableCell className="text-right">{formatCurrency(asignacion.cantidad)}</TableCell>
                                <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleEditServicio(asignacion)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveServicio(asignacion.id)}>
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
