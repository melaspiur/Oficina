"use client"

import * as React from "react"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Combobox } from "@/components/ui/combobox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getMovimientosFacturasPorCliente, updateMovimiento } from "@/lib/services/movimientos"
import { getClientes } from "@/lib/services/clientes"
import { FacturaDialog } from "./factura-dialog"
import type { MovimientoWithId, ClienteWithId } from "@/lib/types"

export function ModificarFacturaView() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(false);
  const [allClientes, setAllClientes] = React.useState<ClienteWithId[]>([])
  const [facturasCliente, setFacturasCliente] = React.useState<MovimientoWithId[]>([])
  const [selectedClienteId, setSelectedClienteId] = React.useState<string | null>(null);
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [facturaToEdit, setFacturaToEdit] = React.useState<MovimientoWithId | null>(null);

  const { toast } = useToast()

  const clienteOptions = React.useMemo(() => {
      return allClientes
        .sort((a, b) => a.codigo - b.codigo)
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
    setFacturasCliente([]);
    
    if (!clienteId) return;

    setIsFetching(true);

    try {
        const result = await getMovimientosFacturasPorCliente(clienteId);
        setFacturasCliente(result.sort((a,b) => b.numero - a.numero));
    } catch (error) {
        console.error("Error al obtener facturas:", error)
        toast({
            title: "Error",
            description: "No se pudieron obtener las facturas del cliente.",
            variant: "destructive",
        })
    } finally {
        setIsFetching(false);
    }
  }

  const handleRowDoubleClick = (factura: MovimientoWithId) => {
    if (factura.aplicacion > 0) {
        toast({
            title: "Factura no modificable",
            description: "Esta factura ya tiene pagos aplicados y no puede ser modificada.",
            variant: "destructive"
        });
        return;
    }
    setFacturaToEdit(factura);
    setIsDialogOpen(true);
  };

  const handleSaveFactura = async (facturaId: string, data: any) => {
     try {
         const fechaISO = new Date(data.fecha.split('/').reverse().join('-')).toISOString();
         const updatedData = {
             ...data,
             fecha: fechaISO,
         }
         await updateMovimiento(facturaId, updatedData);
         toast({ title: "Factura Actualizada", description: "La factura se ha modificado correctamente." });
         setIsDialogOpen(false);
         setFacturaToEdit(null);
         if(selectedClienteId) handleSelectCliente(selectedClienteId); // Refresh data
     } catch (error) {
         console.error("Error updating factura:", error);
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
          <CardTitle>Modificar Factura</CardTitle>
          <CardDescription>
            Seleccione un cliente para ver y modificar sus facturas no canceladas.
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
                <CardTitle>Facturas de {selectedCliente?.nombre}</CardTitle>
                <CardDescription>
                   Haga doble click en una factura para modificarla. Solo las facturas sin pagos aplicados son modificables.
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
                           {isFetching ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            ) : facturasCliente.length > 0 ? (
                                facturasCliente.map((factura) => (
                                    <TableRow 
                                        key={factura.id} 
                                        onDoubleClick={() => handleRowDoubleClick(factura)}
                                        className={factura.aplicacion > 0 ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'}
                                    >
                                        <TableCell>{format(new Date(factura.fecha), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="font-mono">{`FC-${String(factura.numero).padStart(8, '0')}`}</TableCell>
                                        <TableCell>{factura.descripcion}</TableCell>
                                        <TableCell>
                                            {factura.aplicacion > 0 ? (
                                                <Badge variant="secondary">Con pagos</Badge>
                                            ) : (
                                                <Badge variant="default">Pendiente</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(factura.importe)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        No se encontraron facturas para este cliente.
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
        <FacturaDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSave={handleSaveFactura}
            factura={facturaToEdit}
            cliente={selectedCliente}
        />
      )}
    </div>
  )
}
