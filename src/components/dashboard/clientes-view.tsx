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
import { ClienteDialog } from "./cliente-dialog"
import type { Cliente, ClienteWithId } from "@/lib/types"
import { addCliente, getClientes, updateCliente, deleteCliente } from "@/lib/services/clientes"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export function ClientesView() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [clientes, setClientes] = React.useState<ClienteWithId[]>([])
  const [selectedCliente, setSelectedCliente] = React.useState<ClienteWithId | null>(null);
  const [clienteToDelete, setClienteToDelete] = React.useState<ClienteWithId | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchClientes = async () => {
    setIsLoading(true);
    try {
      const clientesData = await getClientes();
      setClientes(clientesData);
    } catch (error) {
      console.error("Error fetching clientes:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchClientes();
  }, []);

  const handleSaveCliente = async (cliente: Cliente) => {
    try {
      if (selectedCliente) {
        await updateCliente(selectedCliente.id, cliente);
        toast({
          title: "Cliente Actualizado",
          description: "El cliente ha sido actualizado correctamente.",
        });
      } else {
        await addCliente(cliente);
        toast({
          title: "Cliente Creado",
          description: "El cliente ha sido creado correctamente.",
        });
      }
      fetchClientes(); // Refresh data
      setIsDialogOpen(false);
      setSelectedCliente(null);
    } catch (error) {
       console.error("Error saving cliente:", error);
       toast({
        title: "Error",
        description: "No se pudo guardar el cliente.",
        variant: "destructive",
      });
    }
  }
  
  const handleEdit = (cliente: ClienteWithId) => {
    setSelectedCliente(cliente);
    setIsDialogOpen(true);
  };
  
  const handleAddNew = () => {
    setSelectedCliente(null);
    setIsDialogOpen(true);
  }

  const openDeleteDialog = (cliente: ClienteWithId) => {
    setClienteToDelete(cliente);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteCliente = async () => {
    if (!clienteToDelete) return;
    try {
      await deleteCliente(clienteToDelete.id);
      toast({
        title: 'Cliente Eliminado',
        description: `El cliente "${clienteToDelete.nombre}" ha sido eliminado.`,
      });
      fetchClientes(); // Refresh data
    } catch (error) {
      console.error("Error deleting cliente:", error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el cliente.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setClienteToDelete(null);
    }
  };


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Lista de Clientes</h2>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2" />
          Nuevo Cliente
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>CUIT</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Cargando clientes...</TableCell>
              </TableRow>
            ) : clientes.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={6} className="text-center">No hay clientes para mostrar.</TableCell>
              </TableRow>
            ) : (
              clientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>{cliente.codigo}</TableCell>
                  <TableCell className="font-medium">{cliente.nombre}</TableCell>
                  <TableCell>{cliente.cuit}</TableCell>
                  <TableCell>
                    <Badge variant={cliente.tipo === 'inscripto' ? "secondary" : "default"}>
                      {cliente.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Cat. {cliente.categoria}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(cliente)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => openDeleteDialog(cliente)}>
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
        <ClienteDialog 
          isOpen={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          onSave={handleSaveCliente} 
          cliente={selectedCliente}
        />
      )}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente
               "{clienteToDelete?.nombre}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCliente}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
