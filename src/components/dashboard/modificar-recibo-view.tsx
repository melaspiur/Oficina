"use client"

import * as React from "react"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Combobox } from "@/components/ui/combobox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getMovimientosRecibosPorCliente, updateMovimiento } from "@/lib/services/movimientos"
import { getClientes } from "@/lib/services/clientes"
import { ReciboDialog } from "./recibo-dialog"
import type { MovimientoWithId, ClienteWithId } from "@/lib/types"

export function ModificarReciboView() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [isFetchingRecibos, setIsFetchingRecibos] = React.useState(false);
  const [allClientes, setAllClientes] = React.useState<ClienteWithId[]>([])
  const [recibosCliente, setRecibosCliente] = React.useState<MovimientoWithId[]>([])
  const [selectedClienteId, setSelectedClienteId] = React.useState<string | null>(null);
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [reciboToEdit, setReciboToEdit] = React.useState<MovimientoWithId | null>(null);

  const { toast } = useToast()

  const clienteOptions = React.useMemo(() => {
      return allClientes
        .sort((a,b) => a.codigo - b.codigo)
        .map(c => ({ value: c.id, label: `${c.codigo} - ${c.nombre}` }));
  }, [allClientes])

  React.useEffect(() => {
    async function fetchClientesData() {
        setIsLoading(true);
        try {
            const clientes = await getClientes();
            setAllClientes(clientes);
        } catch(error) {
            console.error("Error fetching clients:", error);
            toast({ title: "Error", description: "No se pudieron cargar los clientes.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }
    fetchClientesData();
  }, [toast]);
  
  const handleSelectCliente = async (clienteId: string) => {
    setSelectedClienteId(clienteId);
    setRecibosCliente([]);
    
    if (!clienteId) return;

    setIsFetchingRecibos(true);

    try {
        const result = await getMovimientosRecibosPorCliente(clienteId);
        setRecibosCliente(result.sort((a,b) => b.numero - a.numero));
    } catch (error) {
        console.error("Error al obtener recibos:", error)
        toast({
            title: "Error",
            description: "No se pudieron obtener los recibos del cliente.",
            variant: "destructive",
        })
    } finally {
        setIsFetchingRecibos(false);
    }
  }

  const handleRowDoubleClick = (recibo: MovimientoWithId) => {
    if (recibo.aplicacion > 0) {
        toast({
            title: "Recibo no modificable",
            description: "Este recibo ya ha sido aplicado y no puede ser modificado.",
            variant: "destructive"
        });
        return;
    }
    setReciboToEdit(recibo);
    setIsDialogOpen(true);
  };

  const handleSaveRecibo = async (reciboId: string, data: any) => {
     try {
         const fechaISO = new Date(data.fecha.split('/').reverse().join('-')).toISOString();
         const updatedData = {
             ...data,
             fecha: fechaISO,
         }
         await updateMovimiento(reciboId, updatedData);
         toast({ title: "Recibo Actualizado", description: "El recibo se ha modificado correctamente." });
         setIsDialogOpen(false);
         setReciboToEdit(null);
         if(selectedClienteId) handleSelectCliente(selectedClienteId); // Refresh data
     } catch (error) {
         console.error("Error updating recibo:", error);
         toast({ title: "Error", description: "No se pudo guardar la modificación.", variant: "destructive" });
     }
  }

  const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
      }).format(value);
  };
  
  const selectedCliente = selectedClienteId ? allClientes.find(c => c.id === selectedClienteId) : null;

  return (
    <div className="p-6 space-y-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Modificar Recibo</CardTitle>
          <CardDescription>
            Seleccione un cliente para ver y modificar sus recibos no aplicados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Label htmlFor="cliente-select">Cliente</Label>
            <Combobox 
                options={clienteOptions}
                value={selectedClienteId}
                onValueChange={handleSelectCliente}
                placeholder="Seleccione un cliente..."
                searchPlaceholder="Buscar cliente..."
                notFoundMessage="No se encontraron clientes."
                disabled={isLoading || allClientes.length === 0}
            />
          </div>
        </CardContent>
      </Card>
      
      { selectedClienteId && (
        <Card>
            <CardHeader>
                <CardTitle>Recibos de {selectedCliente?.nombre}</CardTitle>
                <CardDescription>
                   Haga doble click en un recibo para modificarlo. Solo los recibos no aplicados son modificables.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Número</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Importe</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {isFetchingRecibos ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            ) : recibosCliente.length > 0 ? (
                                recibosCliente.map((recibo) => (
                                    <TableRow 
                                        key={recibo.id} 
                                        onDoubleClick={() => handleRowDoubleClick(recibo)}
                                        className={recibo.aplicacion > 0 ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'}
                                    >
                                        <TableCell>{format(new Date(recibo.fecha), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="font-mono">{`RE-${String(recibo.numero).padStart(8, '0')}`}</TableCell>
                                        <TableCell>{recibo.descripcion}</TableCell>
                                        <TableCell>
                                            {recibo.aplicacion > 0 ? (
                                                <Badge variant="secondary">Aplicado</Badge>
                                            ) : (
                                                <Badge variant="default">Pendiente</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(recibo.importe)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        No se encontraron recibos para este cliente.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      )}

      {isDialogOpen && (
        <ReciboDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSave={handleSaveRecibo}
            recibo={reciboToEdit}
            cliente={selectedCliente}
        />
      )}
    </div>
  )
}
