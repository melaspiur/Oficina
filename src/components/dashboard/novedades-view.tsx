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
import { PlusCircle, MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { NovedadDialog } from "./novedad-dialog"
import type { Novedad, NovedadWithId, Meses } from "@/lib/types"
import { addNovedad, getNovedades, updateNovedad, deleteNovedad, deleteNovedadesBatch } from "@/lib/services/novedades"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

const allMonthsTrue: Meses = { enero: true, febrero: true, marzo: true, abril: true, mayo: true, junio: true, julio: true, agosto: true, septiembre: true, octubre: true, noviembre: true, diciembre: true };
const onlyAugustTrue: Meses = { enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false, julio: false, agosto: true, septiembre: false, octubre: false, noviembre: false, diciembre: false };

const initialNovedades: Novedad[] = [
    { codigo: 1, nombre: "MENSUAL IVA/IIBB", meses: allMonthsTrue, importe: 80000 },
    { codigo: 2, nombre: "MENSUALIZADO LABOR", meses: allMonthsTrue, importe: 80000 },
    { codigo: 3, nombre: "MENSUALIZADO MONOT", meses: allMonthsTrue, importe: 40000 },
    { codigo: 4, nombre: "MENSUALIZADO GLOBA", meses: allMonthsTrue, importe: 1 },
    { codigo: 5, nombre: "LABORAL DOMESTICO", meses: allMonthsTrue, importe: 14000 },
    { codigo: 6, nombre: "MONOTRIBUTO REDUCI", meses: allMonthsTrue, importe: 20000 },
    { codigo: 7, nombre: "VACANTE", meses: allMonthsTrue, importe: 1 },
    { codigo: 8, nombre: "VACANTE", meses: allMonthsTrue, importe: 1 },
    { codigo: 9, nombre: "TRABAJOS VARIOS", meses: allMonthsTrue, importe: 1 },
    { codigo: 10, nombre: "RECATEG.MONOTRIBUT", meses: onlyAugustTrue, importe: 28000 },
    { codigo: 11, nombre: "RECAT. MONOTR. RED", meses: onlyAugustTrue, importe: 14000 },
    { codigo: 12, nombre: "TRAMITE RED.ALIC.B", meses: onlyAugustTrue, importe: 1 },
    { codigo: 13, nombre: "VACANTE", meses: onlyAugustTrue, importe: 1 },
    { codigo: 14, nombre: "VACANTE", meses: onlyAugustTrue, importe: 1 },
    { codigo: 15, nombre: "VACANTE", meses: onlyAugustTrue, importe: 1 },
    { codigo: 16, nombre: "IP2 GRUESA SIEMBRA", meses: onlyAugustTrue, importe: 25000 },
    { codigo: 17, nombre: "IP1 FINA-EXISTENCI", meses: onlyAugustTrue, importe: 45000 },
    { codigo: 18, nombre: "IP3 EXISTENCIA TRI", meses: onlyAugustTrue, importe: 1 },
    { codigo: 19, nombre: "IP4 COSECHADO FINA", meses: onlyAugustTrue, importe: 1 },
    { codigo: 20, nombre: "IP5 COESCHADO GRUE", meses: onlyAugustTrue, importe: 1 },
    { codigo: 21, nombre: "DDJJ INGR BRUTOS1", meses: onlyAugustTrue, importe: 1 },
    { codigo: 22, nombre: "DDJJ GANANC./B.PER", meses: onlyAugustTrue, importe: 1 },
    { codigo: 23, nombre: "BALANCE", meses: onlyAugustTrue, importe: 1 },
    { codigo: 24, nombre: "DDJJ ING. BRUT. RE", meses: onlyAugustTrue, importe: 1 },
    { codigo: 25, nombre: "VACANTE", meses: onlyAugustTrue, importe: 1 },
    { codigo: 26, nombre: "CERTIF.CONTABLE", meses: onlyAugustTrue, importe: 1 },
    { codigo: 27, nombre: "CERTIF.DE SERVICIO", meses: onlyAugustTrue, importe: 1 },
    { codigo: 28, nombre: "CONF. BALANCE Y GA", meses: onlyAugustTrue, importe: 1 },
    { codigo: 29, nombre: "CONT.FISCAL AGROP.", meses: onlyAugustTrue, importe: 25000 },
    { codigo: 30, nombre: "REG. REGUL. ACTIVO", meses: onlyAugustTrue, importe: 1 },
    { codigo: 31, nombre: "CARPETA BANCO", meses: onlyAugustTrue, importe: 1 },
    { codigo: 32, nombre: "MANIFESTACION BANC", meses: onlyAugustTrue, importe: 1 },
];


export function NovedadesView() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [novedades, setNovedades] = React.useState<NovedadWithId[]>([])
  const [selectedNovedad, setSelectedNovedad] = React.useState<NovedadWithId | null>(null);
  const [novedadToDelete, setNovedadToDelete] = React.useState<NovedadWithId | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

 const fetchNovedades = React.useCallback(async () => {
    setIsLoading(true);
    try {
      let novedadesData = await getNovedades();

      // If database is empty, seed it with initial data.
      if (novedadesData.length === 0) {
        toast({ title: "Inicializando Novedades", description: "Cargando datos por primera vez..." });
        const seedPromises = initialNovedades.map(c => addNovedad(c));
        await Promise.all(seedPromises);
        novedadesData = await getNovedades(); 
      }

      // Check for and remove duplicates.
      const seenCodigos = new Map<number, NovedadWithId>();
      const duplicatesToDelete: string[] = [];

      novedadesData.forEach(novedad => {
        if (seenCodigos.has(novedad.codigo)) {
          duplicatesToDelete.push(novedad.id);
        } else {
          seenCodigos.set(novedad.codigo, novedad);
        }
      });

      if (duplicatesToDelete.length > 0) {
        await deleteNovedadesBatch(duplicatesToDelete);
        toast({
          title: "Duplicados Eliminados",
          description: `Se han eliminado ${duplicatesToDelete.length} novedades duplicadas.`,
          variant: "default",
        });
      }

      const cleanNovedades = Array.from(seenCodigos.values()).sort((a,b) => a.codigo - b.codigo);
      setNovedades(cleanNovedades);

    } catch (error) {
      console.error("Error fetching, seeding, or cleaning novedades:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar ni limpiar las novedades.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchNovedades();
  }, [fetchNovedades]);

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
                <TableCell colSpan={5} className="text-center h-24">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
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
