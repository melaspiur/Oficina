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
import { Checkbox } from "@/components/ui/checkbox"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { Novedad, Meses } from "@/lib/types"

type NovedadDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSave: (novedad: Novedad) => void
  novedad?: Novedad | null
}

const mesesList: (keyof Meses)[] = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

const novedadSchema = z.object({
  codigo: z.coerce.number().min(1, "El código es requerido").max(99, "El código no puede ser mayor a 99"),
  nombre: z.string().min(1, "El nombre es requerido"),
  importe: z.coerce.number().min(0, "El importe no puede ser negativo"),
  meses: z.object({
    enero: z.boolean(),
    febrero: z.boolean(),
    marzo: z.boolean(),
    abril: z.boolean(),
    mayo: z.boolean(),
    junio: z.boolean(),
    julio: z.boolean(),
    agosto: z.boolean(),
    septiembre: z.boolean(),
    octubre: z.boolean(),
    noviembre: z.boolean(),
    diciembre: z.boolean(),
  }).refine(meses => Object.values(meses).some(Boolean), {
    message: "Debe seleccionar al menos un mes.",
    path: ["enero"], // Attach error to a specific field for display
  }),
});

const defaultMeses: Meses = {
  enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false,
  julio: false, agosto: false, septiembre: false, octubre: false, noviembre: false, diciembre: false
};

export function NovedadDialog({ isOpen, onOpenChange, onSave, novedad }: NovedadDialogProps) {
  const { register, handleSubmit, control, formState: { errors }, reset, setValue, watch } = useForm<Novedad>({
    resolver: zodResolver(novedadSchema),
    defaultValues: novedad || {
      codigo: Math.floor(Math.random() * 98) + 1,
      nombre: "",
      importe: 0,
      meses: defaultMeses
    }
  });

  const mesesWatch = watch("meses");

  React.useEffect(() => {
    if (isOpen) {
      reset(novedad || {
        codigo: Math.floor(Math.random() * 98) + 1,
        nombre: "",
        importe: 0,
        meses: defaultMeses
      });
    }
  }, [isOpen, novedad, reset]);
  
  const areAllMonthsSelected = React.useMemo(() => {
      return mesesList.every(mes => mesesWatch[mes]);
  }, [mesesWatch]);

  const handleSelectAll = () => {
    const shouldSelectAll = !areAllMonthsSelected;
    mesesList.forEach(mes => {
        setValue(`meses.${mes}`, shouldSelectAll, { shouldValidate: true, shouldDirty: true });
    });
  };

  const onSubmit = (data: Novedad) => {
    onSave(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{novedad ? 'Editar Novedad' : 'Nueva Novedad'}</DialogTitle>
          <DialogDescription>
            Completa los datos de la novedad. Los campos con * son requeridos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="codigo">Código *</Label>
              <Input id="codigo" {...register("codigo")} />
              {errors.codigo && <p className="text-sm text-destructive mt-1">{errors.codigo.message}</p>}
            </div>
             <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" {...register("nombre")} />
               {errors.nombre && <p className="text-sm text-destructive mt-1">{errors.nombre.message}</p>}
            </div>
             <div>
              <Label htmlFor="importe">Importe *</Label>
              <Input id="importe" type="number" step="0.01" {...register("importe")} />
              {errors.importe && <p className="text-sm text-destructive mt-1">{errors.importe.message}</p>}
            </div>
          </div>
          
          <div className="space-y-4 py-4">
            <Label>Meses de Facturación *</Label>
             <div className="flex items-center space-x-2">
                 <Checkbox 
                    id="select-all"
                    onCheckedChange={handleSelectAll}
                    checked={areAllMonthsSelected}
                 />
                <Label htmlFor="select-all" className="font-normal capitalize">
                  {areAllMonthsSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                </Label>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {mesesList.map((mes) => (
                <div key={mes} className="flex items-center space-x-2">
                  <Controller
                    name={`meses.${mes}`}
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id={mes}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor={mes} className="font-normal capitalize">{mes}</Label>
                </div>
              ))}
            </div>
            {errors.meses && <p className="text-sm text-destructive mt-1">{errors.meses.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Guardar Novedad</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
