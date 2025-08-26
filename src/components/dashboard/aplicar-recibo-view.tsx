"use client"

import * as React from "react"
import { format } from "date-fns"
import { Loader2, ArrowRight } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Combobox } from "@/components/ui/combobox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getMovimientosPendientesPorCliente } from "@/lib/services/movimientos"
import { addAplicacionesBatch } from "@/lib/services/aplicaciones"
import { getClientes } from "@/lib/services/clientes"
import type { MovimientoWithId, ClienteWithId, Aplicacion } from "@/lib/types"

export function AplicarReciboView() {
  // Global state
  const [isLoading, setIsLoading] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [allClientes, setAllClientes] = React.useState<ClienteWithId[]>([])
  
  // Client-specific state
  const [selectedCliente, setSelectedCliente] = React.useState<ClienteWithId | null>(null);
  const [selectedClienteId, setSelectedClienteId] = React.useState<string | null>(null);
  const [recibos, setRecibos] = React.useState<MovimientoWithId[]>([]);
  const [facturas, setFacturas] = React.useState<MovimientoWithId[]>([]);

  // Selection state
  const [selectedRecibos, setSelectedRecibos] = React.useState<Set<string>>(new Set());
  const [selectedFacturas, setSelectedFacturas] = React.useState<Set<string>>(new Set());

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
  
  // Fetch pending documents when client changes
  const fetchClientData = React.useCallback(async (clienteId: string | null) => {
    setSelectedClienteId(clienteId);
    setRecibos([]);
    setFacturas([]);
    setSelectedRecibos(new Set());
    setSelectedFacturas(new Set());
    
    if (!clienteId) {
      setSelectedCliente(null);
      return;
    }
    
    const cliente = allClientes.find(c => c.id === clienteId);
    setSelectedCliente(cliente || null);

    setIsProcessing(true);

    try {
        const { facturas: facturasPendientes, recibos: recibosPendientes } = await getMovimientosPendientesPorCliente(clienteId);
        setFacturas(facturasPendientes);
        setRecibos(recibosPendientes);

        if (facturasPendientes.length === 0 && recibosPendientes.length === 0) {
            toast({
                title: "Sin Pendientes",
                description: "Este cliente no tiene facturas ni recibos pendientes de aplicación.",
            });
        }
    } catch (error) {
        console.error("Error al obtener pendientes:", error)
        toast({ title: "Error", description: "No se pudieron obtener los documentos pendientes.", variant: "destructive" })
    } finally {
        setIsProcessing(false);
    }
  }, [allClientes, toast]);

  const handleSelectRecibo = (reciboId: string) => {
    const newSelection = new Set(selectedRecibos);
    if (newSelection.has(reciboId)) {
        newSelection.delete(reciboId);
    } else {
        newSelection.add(reciboId);
    }
    setSelectedRecibos(newSelection);
  }

  const handleSelectFactura = (facturaId: string) => {
      const newSelection = new Set(selectedFacturas);
      if(newSelection.has(facturaId)) {
          newSelection.delete(facturaId);
      } else {
          newSelection.add(facturaId);
      }
      setSelectedFacturas(newSelection);
  }
  
  const { totalRecibos, totalFacturas } = React.useMemo(() => {
    const totalRecibos = Array.from(selectedRecibos).reduce((sum, id) => {
        const recibo = recibos.find(r => r.id === id);
        return sum + (recibo ? recibo.importe - recibo.aplicacion : 0);
    }, 0);
    const totalFacturas = Array.from(selectedFacturas).reduce((sum, id) => {
        const factura = facturas.find(f => f.id === id);
        return sum + (factura ? factura.importe - factura.aplicacion : 0);
    }, 0);
    return { totalRecibos, totalFacturas };
  }, [selectedRecibos, selectedFacturas, recibos, facturas]);
  
  const handleAplicar = async () => {
      if (selectedRecibos.size === 0 || selectedFacturas.size === 0) {
          toast({ title: "Selección requerida", description: "Debe seleccionar al menos un recibo y una factura.", variant: "destructive" });
          return;
      }

      setIsProcessing(true);

      const recibosParaAplicar = recibos
        .filter(r => selectedRecibos.has(r.id))
        .map(r => ({ ...r, saldo: r.importe - r.aplicacion }));
        
      const facturasParaAplicar = facturas
        .filter(f => selectedFacturas.has(f.id))
        .map(f => ({ ...f, saldo: f.importe - f.aplicacion }));

      let saldoTotalRecibos = recibosParaAplicar.reduce((sum, r) => sum + r.saldo, 0);

      const aplicacionesAGuardar: Aplicacion[] = [];

      for (const factura of facturasParaAplicar) {
          if (saldoTotalRecibos <= 0) break;

          for (const recibo of recibosParaAplicar) {
              if (recibo.saldo <= 0) continue;
              if (factura.saldo <= 0) break;

              const montoAAplicar = Math.min(recibo.saldo, factura.saldo);

              if (montoAAplicar > 0) {
                  aplicacionesAGuardar.push({
                      reciboId: recibo.id,
                      facturaId: factura.id,
                      clienteId: selectedClienteId!,
                      fecha: new Date().toISOString(),
                      importe: montoAAplicar
                  });
                  
                  recibo.saldo -= montoAAplicar;
                  factura.saldo -= montoAAplicar;
                  saldoTotalRecibos -= montoAAplicar;
              }
          }
      }

      try {
          await addAplicacionesBatch(aplicacionesAGuardar);
          toast({
              title: "Aplicación Exitosa",
              description: `Se aplicaron ${formatCurrency(totalRecibos - saldoTotalRecibos)} correctamente.`,
          });
          // Refresh data
          fetchClientData(selectedClienteId);
      } catch (error) {
           console.error("Error al guardar aplicación:", error);
           toast({ title: "Error", description: "No se pudo guardar la aplicación.", variant: "destructive" });
      } finally {
          setIsProcessing(false);
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
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>Aplicar Recibos a Facturas</CardTitle>
          <CardDescription>
            Seleccione un cliente para ver sus comprobantes pendientes y aplicar pagos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Label htmlFor="cliente-select">Cliente</Label>
            <Combobox 
                options={clienteOptions}
                value={selectedClienteId}
                onValueChange={fetchClientData}
                placeholder="Seleccione un cliente..."
                searchPlaceholder="Buscar cliente..."
                notFoundMessage="No se encontraron clientes."
                disabled={isLoading || allClientes.length === 0}
            />
          </div>
        </CardContent>
      </Card>
      
      { selectedClienteId && (
        isProcessing ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            {/* Recibos */}
            <Card>
                <CardHeader>
                    <CardTitle>Recibos Pendientes de Aplicar</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10"></TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Número</TableHead>
                                <TableHead className="text-right">Saldo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recibos.length > 0 ? recibos.map(recibo => (
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
                                    <TableCell className="text-right font-medium">{formatCurrency(recibo.importe - recibo.aplicacion)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">No hay recibos pendientes.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Facturas */}
             <Card>
                <CardHeader>
                    <CardTitle>Facturas Pendientes de Pago</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10"></TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Número</TableHead>
                                <TableHead className="text-right">Saldo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {facturas.length > 0 ? facturas.map(factura => (
                                <TableRow key={factura.id}>
                                    <TableCell>
                                        <Checkbox 
                                            id={`factura-${factura.id}`}
                                            checked={selectedFacturas.has(factura.id)}
                                            onCheckedChange={() => handleSelectFactura(factura.id)}
                                        />
                                    </TableCell>
                                    <TableCell>{format(new Date(factura.fecha), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="font-mono">{`FC-${String(factura.numero).padStart(8, '0')}`}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(factura.importe - factura.aplicacion)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">No hay facturas pendientes.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Resumen y Acción */}
            <Card className="xl:col-span-2">
                <CardHeader>
                    <CardTitle>Resumen de Aplicación</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
                    <div className="rounded-lg border p-4 w-full md:w-auto">
                        <Label className="text-muted-foreground">Total Recibos Seleccionados</Label>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRecibos)}</p>
                    </div>
                    <ArrowRight className="h-8 w-8 text-muted-foreground hidden md:block" />
                     <div className="rounded-lg border p-4 w-full md:w-auto">
                        <Label className="text-muted-foreground">Total Facturas Seleccionadas</Label>
                        <p className="text-2xl font-bold text-destructive">{formatCurrency(totalFacturas)}</p>
                    </div>
                </CardContent>
                <CardFooter className="justify-center">
                     <Button 
                        size="lg" 
                        onClick={handleAplicar}
                        disabled={selectedRecibos.size === 0 || selectedFacturas.size === 0 || isProcessing}
                    >
                         {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                         Realizar Aplicación
                     </Button>
                </CardFooter>
            </Card>
        </div>
        )
      )}
    </div>
  )
}
