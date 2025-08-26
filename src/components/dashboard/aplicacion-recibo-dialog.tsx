"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ClienteWithId, MovimientoWithId, FacturaConSaldo, Aplicacion } from "@/lib/types"

type AplicacionReciboDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSave: (aplicaciones: Aplicacion[]) => void
  cliente: ClienteWithId | null
  recibo: MovimientoWithId | null
  facturas: FacturaConSaldo[]
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
    }).format(value);
};

export function AplicacionReciboDialog({ 
    isOpen, 
    onOpenChange, 
    onSave, 
    cliente, 
    recibo, 
    facturas 
}: AplicacionReciboDialogProps) {
  const [aplicaciones, setAplicaciones] = React.useState<Map<string, number>>(new Map());
  const [saldoRecibo, setSaldoRecibo] = React.useState(recibo?.importe || 0);

  React.useEffect(() => {
    setSaldoRecibo(recibo?.importe || 0);
    setAplicaciones(new Map());
  }, [recibo]);

  const handleAplicacionChange = (facturaId: string, importeStr: string) => {
    const importe = parseFloat(importeStr.replace(',', '.')) || 0;
    const newAplicaciones = new Map(aplicaciones);

    const factura = facturas.find(f => f.id === facturaId);
    if (!factura) return;

    // Do not allow applying more than the invoice balance
    const importeValido = Math.min(importe, factura.saldo);

    newAplicaciones.set(facturaId, importeValido);

    const totalAplicado = Array.from(newAplicaciones.values()).reduce((sum, val) => sum + val, 0);
    const reciboTotal = recibo?.importe || 0;

    if (totalAplicado > reciboTotal) {
        // This should not happen if we cap individual applications, but as a safeguard
        const exceso = totalAplicado - reciboTotal;
        newAplicaciones.set(facturaId, importeValido - exceso);
    }
    
    setAplicaciones(newAplicaciones);
  };
  
  React.useEffect(() => {
      const totalAplicado = Array.from(aplicaciones.values()).reduce((sum, val) => sum + val, 0);
      setSaldoRecibo((recibo?.importe || 0) - totalAplicado);
  }, [aplicaciones, recibo]);


  const handleSave = () => {
    if (!recibo) return;
    const aplicacionesFinales: Aplicacion[] = [];
    aplicaciones.forEach((importe, facturaId) => {
        if (importe > 0) {
            aplicacionesFinales.push({
                reciboId: recibo.id,
                facturaId,
                clienteId: recibo.clienteId,
                fecha: recibo.fecha,
                importe: importe,
            });
        }
    });
    onSave(aplicacionesFinales);
  };
  
  if (!recibo || !cliente) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Aplicar Recibo a Facturas</DialogTitle>
          <DialogDescription>
            Aplique el importe del recibo N° {String(recibo.numero).padStart(8,'0')} a las facturas pendientes de {cliente.nombre}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-6 py-4">
            <div className="rounded-lg border p-4">
                <Label className="text-muted-foreground">Importe del Recibo</Label>
                <p className="text-2xl font-bold">{formatCurrency(recibo.importe)}</p>
            </div>
             <div className="rounded-lg border p-4">
                <Label className="text-muted-foreground">Total Aplicado</Label>
                <p className="text-2xl font-bold">{formatCurrency((recibo.importe || 0) - saldoRecibo)}</p>
            </div>
             <div className="rounded-lg border p-4">
                <Label className="text-muted-foreground">Saldo del Recibo</Label>
                <p className="text-2xl font-bold text-primary">{formatCurrency(saldoRecibo)}</p>
            </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto border rounded-lg">
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right w-[150px]">A Aplicar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturas.length > 0 ? facturas.map((factura) => (
                <TableRow key={factura.id}>
                  <TableCell>{format(new Date(factura.fecha), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="font-mono">{`FC-${String(factura.numero).padStart(8, '0')}`}</TableCell>
                  <TableCell className="text-right">{formatCurrency(factura.saldo)}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="text"
                      inputMode="decimal"
                      className="h-8 text-right"
                      value={String(aplicaciones.get(factura.id) || "").replace('.',',')}
                      onChange={(e) => handleAplicacionChange(factura.id, e.target.value)}
                      onFocus={(e) => e.target.select()}
                    />
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                        Este cliente no tiene facturas pendientes de pago.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={handleSave} disabled={facturas.length === 0}>Guardar Aplicación</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
