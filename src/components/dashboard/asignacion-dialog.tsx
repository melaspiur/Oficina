"use client"

import * as React from "react"
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
import type { AsignacionViewModel } from "@/lib/types"
import { Checkbox } from "../ui/checkbox"

type AsignacionDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSave: (id: string, nuevaCantidad: number, nuevoEventual: boolean) => void
  asignacion: AsignacionViewModel | null
}

export function AsignacionDialog({ isOpen, onOpenChange, onSave, asignacion }: AsignacionDialogProps) {
  const [cantidad, setCantidad] = React.useState<number | string>("")
  const [isEventual, setIsEventual] = React.useState(false)

  React.useEffect(() => {
    if (asignacion) {
      setCantidad(asignacion.cantidad)
      setIsEventual(asignacion.eventual || false)
    }
  }, [asignacion])

  const handleSave = () => {
    if (!asignacion) return;
    const cantidadNum = typeof cantidad === 'string' ? parseFloat(cantidad.replace(',', '.')) : cantidad;
    if (!isNaN(cantidadNum) && cantidadNum > 0) {
      onSave(asignacion.id, cantidadNum, isEventual)
    }
  }

  if (!asignacion) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Asignación</DialogTitle>
          <DialogDescription>
            Modifique los datos para la novedad asignada.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>Cliente</Label>
            <p className="text-sm font-medium">{`${asignacion.clienteCodigo} - ${asignacion.clienteNombre}`}</p>
          </div>
          <div>
            <Label>Novedad</Label>
            <p className="text-sm font-medium">{`${asignacion.novedadCodigo} - ${asignacion.novedadNombre}`}</p>
          </div>
          <div>
            <Label htmlFor="cantidad-edit">Cantidad</Label>
            <Input
              id="cantidad-edit"
              type="text"
              inputMode="decimal"
              value={String(cantidad).replace('.', ',')}
              onChange={(e) => setCantidad(e.target.value)}
              className="mt-1"
            />
          </div>
           <div className="flex items-center space-x-2">
              <Checkbox id="eventual-edit" checked={isEventual} onCheckedChange={(checked) => setIsEventual(Boolean(checked))} />
              <Label htmlFor="eventual-edit">Es Eventual</Label>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={handleSave}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
