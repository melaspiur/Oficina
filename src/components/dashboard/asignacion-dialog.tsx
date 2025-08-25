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

type AsignacionDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSave: (nuevaCantidad: number) => void
  asignacion: AsignacionViewModel | null
}

export function AsignacionDialog({ isOpen, onOpenChange, onSave, asignacion }: AsignacionDialogProps) {
  const [cantidad, setCantidad] = React.useState<number | string>("")

  React.useEffect(() => {
    if (asignacion) {
      setCantidad(asignacion.cantidad)
    }
  }, [asignacion])

  const handleSave = () => {
    const cantidadNum = typeof cantidad === 'string' ? parseFloat(cantidad.replace(',', '.')) : cantidad;
    if (!isNaN(cantidadNum) && cantidadNum > 0) {
      onSave(cantidadNum)
    }
  }

  if (!asignacion) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Asignación</DialogTitle>
          <DialogDescription>
            Modifique la cantidad para la novedad asignada.
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
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={handleSave}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
