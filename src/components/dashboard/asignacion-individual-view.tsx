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
import { getAsignacionesByNovedadId, addAsignacion, updateAsignacion, deleteAsignacion } from "@/lib/services/asignaciones"
import { useToast } from "@/hooks/use-toast"
import { AsignacionDialog } from "./asignacion-dialog"
import { Combobox } from "@/components/ui/combobox"

export function AsignacionIndividualView() {
  // Global data
  const [clientes, setClientes] = React.useState<ClienteWithId[]>([])
  const [novedades, setNovedades] = React.useState<NovedadWithId[]>([])
  
  // State for the selected novelty and its assignments
  const [selectedNovedad, setSelectedNovedad] = React.useState<NovedadWithId | null>(null)
  const [asignacionesNovedad, setAsignacionesNovedad] = React.useState<AsignacionViewModel[]>([]);
  
  // State for the "add new" form
  const [selectedClienteId, setSelectedClienteId] = React.useState<string | null>(null)
  const [newCantidad, setNewCantidad] = React.useState<number | string>(1.00)

  // UI State
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingAsignaciones, setIsLoadingAsignaciones] = React.useState(false);
  const [isDialogEditOpen, setIsDialogEditOpen] = React.useState(false);
  const [asignacionToEdit, setAsignacionToEdit] = React.useState<AsignacionViewModel | null>(null);
  const { toast } = useToast()

  const novedadOptions = React.useMemo(() => {
    return novedades.map(n => ({ value: n.id, label: `${n.codigo} - ${n.nombre}` }))
  }, [novedades]);
  
  const clienteOptions = React.useMemo(() => {
    // Filter out clients that are already assigned to the selected novelty
    const assignedClientIds = new Set(asignacionesNovedad.map(a => a.clienteId));
    return clientes
      .filter(c => !assignedClientIds.has(c.id))
      .sort((a, b) => a.codigo - b.codigo)
      .map(c => ({ value: c.id, label: `${c.codigo} - ${c.nombre}` }));
  }, [clientes, asignacionesNovedad]);


  // Initial data fetch for clients and novedades
  React.useEffect(() => {
    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [clientesData, novedadesData] = await Promise.all([getClientes(), getNovedades()]);
            setClientes(clientesData);
            
            const uniqueNovedades = Array.from(new Map(novedadesData.map(item => [item.codigo, item])).values());
            setNovedades(uniqueNovedades.sort((a, b) => a.codigo - b.codigo));

        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ title: "Error", description: "No se pudieron cargar los datos iniciales.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    fetchInitialData();
  }, [toast]);
  
  const fetchAsignacionesForNovedad = React.useCallback(async (novedadId: string) => {
      if (!novedadId) return;
      setIsLoadingAsignaciones(true);
      try {
          const asignacionesData = await getAsignacionesByNovedadId(novedadId);
          const clientesMap = new Map(clientes.map(c => [c.id, c]));
          const novedad = novedades.find(n => n.id === novedadId);
          if (!novedad) return;

          const viewModel: AsignacionViewModel[] = asignacionesData.map(a => {
              const cliente = clientesMap.get(a.clienteId);
              if (!cliente) return null;
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

          setAsignacionesNovedad(viewModel.sort((a,b) => a.clienteCodigo - b.clienteCodigo));

      } catch (error) {
          console.error("Error fetching assignments for novelty:", error);
          toast({ title: "Error", description: "No se pudieron cargar las asignaciones de la novedad.", variant: "destructive" });
      } finally {
          setIsLoadingAsignaciones(false);
      }
  }, [clientes, novedades, toast]);

  const handleSelectNovedad = (novedadId: string) => {
    const novedad = novedades.find(n => n.id === novedadId);
    setSelectedNovedad(novedad || null);
    setAsignacionesNovedad([]); // Clear previous assignments
    if (novedadId) {
        fetchAsignacionesForNovedad(novedadId);
    }
  }

  const handleAddServicio = async () => {
    if (!selectedNovedad || !selectedClienteId) {
      toast({ title: "Error", description: "Debe seleccionar una novedad y un cliente.", variant: "destructive" });
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
            novedadId: selectedNovedad.id,
            cantidad: cantidadNum,
        });
        toast({ title: "Asignación Creada", description: "La novedad se asignó correctamente." });
        fetchAsignacionesForNovedad(selectedNovedad.id); // Refresh list
        setSelectedClienteId(null);
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
        if(selectedNovedad) fetchAsignacionesForNovedad(selectedNovedad.id);
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
      if(selectedNovedad) fetchAsignacionesForNovedad(selectedNovedad.id);
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
            <CardTitle>Seleccionar Novedad</CardTitle>
            <CardDescription>Elija una novedad para ver y gestionar sus clientes asignados.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="max-w-md">
                <Label htmlFor="novedad-select">Novedad</Label>
                 <Combobox 
                    options={novedadOptions}
                    value={selectedNovedad?.id}
                    onValueChange={handleSelectNovedad}
                    placeholder="Seleccione una novedad..."
                    searchPlaceholder="Buscar novedad..."
                    notFoundMessage="No se encontraron novedades."
                    disabled={isLoading}
                />
            </div>
        </CardContent>
      </Card>
      
      {selectedNovedad && (
        <>
            <Card>
                <CardHeader>
                <CardTitle>Añadir Cliente a {selectedNovedad.nombre}</CardTitle>
                <CardDescription>Añada un nuevo cliente a la novedad seleccionada.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="cliente-select">Cliente</Label>
                            <Combobox 
                                options={clienteOptions}
                                value={selectedClienteId}
                                onValueChange={setSelectedClienteId}
                                placeholder="Seleccione un cliente..."
                                searchPlaceholder="Buscar cliente..."
                                notFoundMessage="No hay clientes disponibles."
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
                <CardTitle>Clientes Asignados a {selectedNovedad.nombre}</CardTitle>
                <CardDescription>Lista de todos los clientes asignados.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="border rounded-lg">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Cliente</TableHead>
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
                        ) : asignacionesNovedad.length > 0 ? (
                        asignacionesNovedad.map((asignacion) => (
                            <TableRow key={asignacion.id}>
                                <TableCell className="font-medium">{`${asignacion.clienteCodigo} - ${asignacion.clienteNombre}`}</TableCell>
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
                            Esta novedad no tiene clientes asignados.
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
