"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { NovedadDialog } from "./novedad-dialog"
import type { Novedad, NovedadWithId } from "@/lib/types"
import { addNovedad, getNovedades, updateNovedad, deleteNovedad } from "@/lib/services/novedades"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export function NovedadesView() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [novedades, setNovedades] = React.useState<NovedadWithId[]>([])
  const [selectedNovedad, setSelectedNovedad] = React.useState<NovedadWithId | null>(null);
  const [novedadToDelete, setNovedadToDelete] = React.useState<NovedadWithId | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchNovedades = async () => {
    setIsLoading(true);
    try {
      const novedadesData = await getNovedades();
      setNovedades(novedadesData);
    } catch (error) {
      console.error("Error fetching novedades:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las novedades.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchNovedades();
  }, []);

  const handleSaveNovedad = async (novedad: Novedad) => {
    try {
      if (selectedNovedad) {
        await updateNovedad(selectedNovedad.id, novedad);
        toast({
          title: "Novedad Actualizada",
          description: "La novedad ha sido actualizada correctamente.",
        });
      } else {
        await addNovedad(novedad);
        toast({
          title: "Novedad Creada",
          description: "La novedad ha sido creada correctamente.",
        });
      }
      fetchNovedades(); // Refresh data
      setIsDialogOpen(false);
      setSelectedNovedad(null);
    } catch (error) {
       console.error("Error saving novedad:", error);
       toast({
        title: "Error",
        description: "No se pudo guardar la novedad.",
        variant: "destructive",
      });
    }
  }
  
  const handleEdit = (novedad: NovedadWithId) => {
    setSelectedNovedad(novedad);
    setIsDialogOpen(true);
  };
  
  const handleAddNew = () => {
    setSelectedNovedad(null);
    setIsDialogOpen(true);
  }

  const openDeleteDialog = (novedad: NovedadWithId) => {
    setNovedadToDelete(novedad);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteNovedad = async () => {
    if (!novedadToDelete) return;
    try {
      await deleteNovedad(novedadToDelete.id);
      toast({
        title: 'Novedad Eliminada',
        description: `La novedad "${novedadToDelete.nombre}" ha sido eliminada.`,
      });
      fetchNovedades(); // Refresh data
    } catch (error) {
      console.error("Error deleting novedad:", error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la novedad.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setNovedadToDelete(null);
    }
  };


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Lista de Novedades</h2>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2" />
          Nueva Novedad
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Importe</TableHead>
              <TableHead>Meses Activos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Cargando novedades...</TableCell>
              </TableRow>
            ) : novedades.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={5} className="text-center">No hay novedades para mostrar.</TableCell>
              </TableRow>
            ) : (
              novedades.map((novedad) => (
                <TableRow key={novedad.id}>
                  <TableCell>{novedad.codigo}</TableCell>
                  <TableCell className="font-medium">{novedad.nombre}</TableCell>
                  <TableCell>${novedad.importe.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(novedad.meses)
                        .filter(([, active]) => active)
                        .map(([mes]) => (
                          <Badge key={mes} variant="secondary" className="capitalize">{mes.substring(0,3)}</Badge>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(novedad)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => openDeleteDialog(novedad)}>
                           <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {isDialogOpen && (
        <NovedadDialog 
          isOpen={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          onSave={handleSaveNovedad} 
          novedad={selectedNovedad}
        />
      )}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la novedad
               "{novedadToDelete?.nombre}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNovedad}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}