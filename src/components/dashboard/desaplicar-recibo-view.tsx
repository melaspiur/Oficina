"use client"

import * as React from "react"
import { format } from "date-fns"
import { Loader2, AlertTriangle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Combobox } from "@/components/ui/combobox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { getMovimientosRecibosPorCliente } from "@/lib/services/movimientos"
import { deleteAplicacionesBatch } from "@/lib/services/aplicaciones"
import { getClientes } from "@/lib/services/clientes"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import type { MovimientoWithId, ClienteWithId } from "@/lib/types"

export function DesaplicarReciboView() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [allClientes, setAllClientes] = React.useState<ClienteWithId[]>([])
  
  const [selectedClienteId, setSelectedClienteId] = React.useState<string | null>(null);
  const [recibosAplicados, setRecibosAplicados] = React.useState<MovimientoWithId[]>([]);
  const [selectedRecibos, setSelectedRecibos] = React.useState<Set<string>>(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  const { toast } = useToast()

  const clienteOptions = React.useMemo(() => {
      return allClientes
        .map(c => ({ value: c.id, label: `${c.codigo} - ${c.nombre}` }))
        .sort((a,b) => a.label.localeCompare(b.label));
  }, [allClientes])

  // Fetch initial client list
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
  
  // Fetch applied receipts when client changes
  const fetchClientData = React.useCallback(async (clienteId: string | null) => {
    if (!clienteId) {
      setRecibosAplicados([]);
      return;
    }
    
    setIsProcessing(true);
    try {
        const todosLosRecibos = await getMovimientosRecibosPorCliente(clienteId);
        const aplicados = todosLosRecibos.filter(r => r.aplicacion > 0.005);
        setRecibosAplicados(aplicados);

        if (aplicados.length === 0) {
            toast({
                title: "Sin Recibos Aplicados",
                description: "Este cliente no tiene recibos aplicados para desaplicar.",
            });
        }
    } catch (error) {
        console.error("Error al obtener recibos aplicados:", error)
        toast({ title: "Error", description: "No se pudieron obtener los recibos aplicados.", variant: "destructive" })
    } finally {
        setIsProcessing(false);
    }
  }, [toast]);

  const handleSelectCliente = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    setSelectedRecibos(new Set());
    fetchClientData(clienteId);
  }

  const handleSelectRecibo = (reciboId: string) => {
    const newSelection = new Set(selectedRecibos);
    if (newSelection.has(reciboId)) {
        newSelection.delete(reciboId);
    } else {
        newSelection.add(reciboId);
    }
    setSelectedRecibos(newSelection);
  }

  const totalADesaplicar = React.useMemo(() => {
    return Array.from(selectedRecibos).reduce((sum, id) => {
        const recibo = recibosAplicados.find(r => r.id === id);
        return sum + (recibo?.aplicacion || 0);
    }, 0);
  }, [selectedRecibos, recibosAplicados]);
  
  const handleDesaplicar = async () => {
    if (selectedRecibos.size === 0) return;
    
    setIsProcessing(true);
    try {
        await deleteAplicacionesBatch(Array.from(selectedRecibos));
        toast({
            title: "Desaplicación Exitosa",
            description: "Los recibos seleccionados han sido desaplicados. Actualizando datos...",
        });
        
        // Refresh data
        fetchClientData(selectedClienteId);
        setSelectedRecibos(new Set());

    } catch (error) {
        console.error("Error al desaplicar:", error);
        toast({ title: "Error", description: "Ocurrió un error al intentar desaplicar los recibos.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
        setIsConfirmOpen(false);
    }
  };


  const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
      }).format(value);
  };
  
  return (
    <div className="p-6 space-y-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Desaplicar Recibos</CardTitle>
          <CardDescription>
            Seleccione un cliente para ver sus recibos aplicados y revertir la aplicación si es necesario.
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
                <CardTitle>Recibos Aplicados</CardTitle>
                <CardDescription>Seleccione los recibos que desea desaplicar.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10"></TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Número</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-right">Importe Aplicado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isProcessing && !recibosAplicados.length ? (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                            ) : recibosAplicados.length > 0 ? recibosAplicados.map(recibo => (
                                <TableRow key={recibo.id}>
                                    <TableCell>
                                        <Checkbox 
                                            id={`recibo-${recibo.id}`}
                                            checked={selectedRecibos.has(recibo.id)}
                                            onCheckedChange={() => handleSelectRecibo(recibo.id)}
                                        />
                                    </TableCell>
                                    <TableCell>{format(new Date(recibo.fecha), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="font-mono">{`RE-${String(recibo.numero).padStart(8, '0')}`}</TableCell>
                                    <TableCell>{recibo.descripcion}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(recibo.aplicacion)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">No hay recibos aplicados para este cliente.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
             {recibosAplicados.length > 0 && (
                <CardFooter className="flex-col items-end space-y-4 pt-6">
                    <div>
                        <span className="text-muted-foreground mr-2">Total a Desaplicar:</span>
                        <span className="text-2xl font-bold text-destructive">{formatCurrency(totalADesaplicar)}</span>
                    </div>
                    <Button 
                        size="lg"
                        variant="destructive"
                        onClick={() => setIsConfirmOpen(true)}
                        disabled={selectedRecibos.size === 0 || isProcessing}
                    >
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Aceptar Desaplicación
                    </Button>
                </CardFooter>
            )}
        </Card>
      )}

       <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
             <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <AlertDialogTitle>¿Está seguro de la desaplicación?</AlertDialogTitle>
             </div>
            <AlertDialogDescription>
              Esta acción es irreversible. Se revertirán las aplicaciones de los recibos seleccionados,
              modificando el saldo de las facturas afectadas y eliminando los registros de aplicación.
              El total a desaplicar es de <span className="font-bold">{formatCurrency(totalADesaplicar)}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDesaplicar} className="bg-destructive hover:bg-destructive/90">
                Confirmar Desaplicación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
