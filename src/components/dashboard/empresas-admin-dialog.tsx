
"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getEmpresas, deleteEmpresa, addEmpresa, updateEmpresa } from "@/lib/services/empresas"
import type { Empresa, EmpresaWithId } from "@/lib/empresas"
import { EmpresaDialog } from "./empresa-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

type EmpresasAdminDialogProps = {
  isOpen: boolean
  onOpenChange: () => void
}

export function EmpresasAdminDialog({ isOpen, onOpenChange }: EmpresasAdminDialogProps) {
  const { toast } = useToast()
  const [empresas, setEmpresas] = React.useState<EmpresaWithId[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [selectedEmpresa, setSelectedEmpresa] = React.useState<EmpresaWithId | null>(null)
  const [empresaToDelete, setEmpresaToDelete] = React.useState<EmpresaWithId | null>(null)

  const fetchEmpresas = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getEmpresas()
      setEmpresas(data)
    } catch (error) {
      console.error("Error fetching empresas:", error)
      toast({ title: "Error", description: "No se pudieron cargar las empresas.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    if (isOpen) {
      fetchEmpresas()
    }
  }, [isOpen, fetchEmpresas])

  const handleSaveEmpresa = async (empresaData: Empresa) => {
    try {
      if (selectedEmpresa) {
        await updateEmpresa(selectedEmpresa.id, empresaData)
        toast({ title: "Empresa Actualizada" })
      } else {
        await addEmpresa(empresaData)
        toast({ title: "Empresa Creada" })
      }
      fetchEmpresas()
      setIsEditDialogOpen(false)
      setSelectedEmpresa(null)
    } catch (error) {
      console.error("Error saving empresa:", error)
      toast({ title: "Error", description: "No se pudo guardar la empresa.", variant: "destructive" })
    }
  }

  const handleAddNew = () => {
    setSelectedEmpresa(null)
    setIsEditDialogOpen(true)
  }

  const handleEdit = (empresa: EmpresaWithId) => {
    setSelectedEmpresa(empresa)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (empresa: EmpresaWithId) => {
    setEmpresaToDelete(empresa)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!empresaToDelete) return
    try {
      await deleteEmpresa(empresaToDelete.id)
      toast({ title: "Empresa Eliminada" })
      fetchEmpresas()
    } catch (error) {
      console.error("Error deleting empresa:", error)
      toast({ title: "Error", description: "No se pudo eliminar la empresa.", variant: "destructive" })
    } finally {
      setIsDeleteDialogOpen(false)
      setEmpresaToDelete(null)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Administrar Empresas</DialogTitle>
            <DialogDescription>
              Añada, edite o elimine las empresas del sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-end mb-4">
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Empresa
              </Button>
            </div>
            <div className="border rounded-lg max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>CUIT</TableHead>
                    <TableHead>Project ID</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : empresas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        No hay empresas para mostrar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    empresas.map((empresa) => (
                      <TableRow key={empresa.id}>
                        <TableCell className="font-medium">{empresa.nombre}</TableCell>
                        <TableCell>{empresa.cuit}</TableCell>
                        <TableCell className="font-mono text-xs">{empresa.firebaseConfig.projectId}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(empresa)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(empresa)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isEditDialogOpen && (
          <EmpresaDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSave={handleSaveEmpresa}
            empresa={selectedEmpresa}
           />
      )}

       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la empresa "{empresaToDelete?.nombre}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
