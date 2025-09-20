"use client"

import * as React from "react"
import * as XLSX from "xlsx"
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
import { PlusCircle, MoreHorizontal, Edit, Trash2, FileDown, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ClienteDialog } from "./cliente-dialog"
import type { Cliente, ClienteWithId } from "@/lib/types"
import { addCliente, getClientes, updateCliente, deleteCliente, updateClientesBatch } from "@/lib/services/clientes"
import { deleteAsignacionesByClienteId } from "@/lib/services/asignaciones"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

const CUIT_CELULAR_MAP: Record<string, string> = {
  "30545802267": "2936409670",
  "30637697001": "2923647440",
  "20106880337": "2923647181",
  "23115340344": "2923647181",
  "30509384017": "2923647181",
  "20137052165": "2923642563",
  "20167159959": "2923444299",
  "20122308228": "2923653039",
  "20055017086": "1131277705",
  "20136499948": "2923641950",
  "20145281440": "2936403412",
  "20173605650": "2923416933",
  "20055017469": "2923647440",
  "20055017027": "2923467625",
  "27221006246": "2923415084",
  "30563878637": "2923694948",
  "20109505480": "2923655838",
  "20137057426": "2923657350",
  "20206869128": "2923647470",
  "27239423561": "2923698647",
  "30707602305": "2923422851",
  "20203168420": "2936403954",
  "27206917461": "2923409221",
  "20051764693": "2923652104",
  "27218626543": "2923696062",
  "20169129798": "2923418883",
  "20165475012": "2923640558",
  "20137052300": "2923422851",
  "23229441299": "2923645111",
  "20228555631": "2923442506",
  "30708934794": "2923560959",
  "27219797155": "2923440716",
  "27244949040": "2923645067",
  "20076462136": "2923694446",
  "20311378385": "2923653039",
  "20224827459": "2923446151",
  "27165475459": "2923460067",
  "20145281297": "2923642521",
  "27105721116": "2923483868",
  "20255816633": "2923694446",
  "20234315014": "2936414505",
  "20203169990": "2936407045",
  "30711496544": "2923422851",
  "27267042581": "2936409183",
  "27241680709": "2936409020",
  "23165254074": "2923440692",
  "27139936790": "2923653039",
  "24306481815": "2215043299",
  "30711902224": "1144186745",
  "27200492639": "2392514882",
  "20139937393": "2923408307",
  "30712040587": "2923415084",
  "20203169125": "2923467625",
  "2027110074": "2936407266",
  "20166064237": "2923506347",
  "30712451838": "2923536668",
  "30712448365": "2923536668",
  "20220497209": "2923640563",
  "20253560798": "2923650800",
  "20170671113": "2392632177",
  "20167220550": "2923486095",
  "20117210317": "2923486095",
  "27037457545": "2944800700",
  "20055003441": "2923698647",
  "23318268444": "2923422851",
  "27258725021": "2923409257",
  "27165475955": "2923483868",
  "20318269689": "2914025352",
  "30715088343": "2923694446",
  "33715028439": "2944800700",
  "20261028868": "2923504978",
  "20052480346": "2923440769",
  "27224826317": "2923411859",
  "27167158825": "2944800700",
  "23180516859": "2923414023",
  "30715487957": "2923647440",
  "30715987704": "2923458173",
  "20334833292": "2936403146",
  "23261028549": "2914161014",
  "20149779583": "2923445151",
  "20240034469": "2923413486",
  "30716429993": "2923538718",
  "27363621886": "2936403030",
  "27037743025": "2923460371",
  "20392885901": "2923467625",
  "23368959189": "2936403323",
  "20177776638": "2923647374",
  "20236242367": "2923447533",
  "20334832318": "2923505332",
  "27249997639": "2923425480",
  "27220043709": "1163046394",
  "20352355403": "2923414023",
  "20341707081": "2923414023",
  "27165475092": "2914025352",
  "20253560836": "2923409257",
  "20312312582": "2923656061",
  "27409440105": "2923416933",
  "27166048449": "2923647440",
  "27268456606": "2936403247",
  "20311516818": "2936403247",
  "20122308678": "2923424016",
  "20168482222": "2923642950",
};


export function ClientesView() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [clientes, setClientes] = React.useState<ClienteWithId[]>([])
  const [selectedCliente, setSelectedCliente] = React.useState<ClienteWithId | null>(null);
  const [clienteToDelete, setClienteToDelete] = React.useState<ClienteWithId | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdatingPhones, setIsUpdatingPhones] = React.useState(false);
  const { toast } = useToast();

  const fetchClientes = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const clientesData = await getClientes();
      setClientes(clientesData.sort((a,b) => a.codigo - b.codigo));
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
  }, [toast]);

  React.useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

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
      // First, delete all assignments for this client
      await deleteAsignacionesByClienteId(clienteToDelete.id);
      // Then, delete the client itself
      await deleteCliente(clienteToDelete.id);
      
      toast({
        title: 'Cliente Eliminado',
        description: `El cliente "${clienteToDelete.nombre}" y todas sus asignaciones han sido eliminados.`,
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
  
  const handleExportExcel = () => {
    const dataForSheet = clientes.map(c => ({
        'Código': c.codigo,
        'Nombre': c.nombre,
        'CUIT': c.cuit,
        'Domicilio': c.domicilio || '',
        'Localidad': c.localidad || '',
        'Provincia': c.provincia || '',
        'Mail': c.mail || '',
        'Celular': c.celular || '',
        'Tipo': c.tipo,
        'Categoría': c.categoria,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
    worksheet['!cols'] = [
      { wch: 8 },  // Código
      { wch: 35 }, // Nombre
      { wch: 15 }, // CUIT
      { wch: 30 }, // Domicilio
      { wch: 20 }, // Localidad
      { wch: 20 }, // Provincia
      { wch: 30 }, // Mail
      { wch: 15 }, // Celular
      { wch: 12 }, // Tipo
      { wch: 10 }, // Categoría
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
    XLSX.writeFile(workbook, "Lista_de_Clientes.xlsx");
  };

  const handleUpdatePhones = async () => {
    setIsUpdatingPhones(true);
    toast({ title: "Actualizando celulares...", description: "Por favor, espere." });
    
    try {
      const allCurrentClientes = await getClientes();
      const updates: { id: string; changes: Partial<Cliente> }[] = [];

      allCurrentClientes.forEach(cliente => {
        const cuitSinGuiones = cliente.cuit.replace(/-/g, "");
        const celular = CUIT_CELULAR_MAP[cuitSinGuiones];
        // Update only if a phone number is found and it's not already set
        if (celular && !cliente.celular) {
          updates.push({ id: cliente.id, changes: { celular } });
        }
      });

      if (updates.length > 0) {
        await updateClientesBatch(updates);
        toast({
          title: "Actualización completada",
          description: `${updates.length} clientes han sido actualizados con su número de celular.`,
        });
        fetchClientes(); // Refresh view
      } else {
        toast({
          title: "Sin cambios",
          description: "No se encontraron clientes para actualizar o ya tienen un celular asignado.",
        });
      }
    } catch (error) {
      console.error("Error updating phones:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error durante la actualización de celulares.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPhones(false);
    }
  };


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Lista de Clientes</h2>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleUpdatePhones} disabled={isLoading || isUpdatingPhones}>
                {isUpdatingPhones ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Actualizar Celulares (Provisorio)
            </Button>
            <Button variant="outline" onClick={handleExportExcel} disabled={isLoading || clientes.length === 0}>
                <FileDown className="mr-2" />
                Exportar a Excel
            </Button>
            <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2" />
            Nuevo Cliente
            </Button>
        </div>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>CUIT</TableHead>
              <TableHead>Mail</TableHead>
              <TableHead>Celular</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">Cargando clientes...</TableCell>
              </TableRow>
            ) : clientes.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={8} className="text-center">No hay clientes para mostrar. Agregue uno para comenzar.</TableCell>
              </TableRow>
            ) : (
              clientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>{cliente.codigo}</TableCell>
                  <TableCell className="font-medium">{cliente.nombre}</TableCell>
                  <TableCell>{cliente.cuit}</TableCell>
                  <TableCell>{cliente.mail}</TableCell>
                  <TableCell>{cliente.celular}</TableCell>
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
               "{clienteToDelete?.nombre}" y TODAS sus asignaciones de novedades.
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
