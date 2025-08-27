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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { Cliente, ClienteWithId } from "@/lib/types"

type ClienteDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSave: (cliente: Cliente) => void
  cliente?: ClienteWithId | null
}

const clienteSchema = z.object({
  codigo: z.coerce.number().min(1).max(9999),
  nombre: z.string().min(1, "El nombre es requerido"),
  domicilio: z.string().optional(),
  localidad: z.string().optional(),
  provincia: z.string().optional(),
  cuit: z.string().min(1, "El CUIT es requerido"),
  tipo: z.enum(["inscripto", "monotributo"]),
  categoria: z.coerce.number().min(1).max(5),
  mail: z.string().email("El mail no es válido.").optional().or(z.literal('')),
  celular: z.string().optional(),
});


export function ClienteDialog({ isOpen, onOpenChange, onSave, cliente }: ClienteDialogProps) {
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<Cliente>({
    resolver: zodResolver(clienteSchema),
    defaultValues: cliente || {
      codigo: 0, // Initialize with a temporary value
      nombre: "",
      domicilio: "",
      localidad: "",
      provincia: "",
      cuit: "",
      tipo: "inscripto",
      categoria: 1,
      mail: "",
      celular: "",
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      if (cliente) {
        reset(cliente);
      } else {
        reset({
            codigo: Math.floor(Math.random() * 9998) + 1,
            nombre: "",
            domicilio: "",
            localidad: "",
            provincia: "",
            cuit: "",
            tipo: "inscripto",
            categoria: 1,
            mail: "",
            celular: "",
      });
      }
    }
  }, [isOpen, cliente, reset]);
  
  const onSubmit = (data: Cliente) => {
    onSave(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{cliente ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
          <DialogDescription>
            Completa los datos del cliente. Los campos con * son requeridos.
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
                <Label htmlFor="domicilio">Domicilio</Label>
                <Input id="domicilio" {...register("domicilio")} />
              </div>
              <div>
                <Label htmlFor="localidad">Localidad</Label>
                <Input id="localidad" {...register("localidad")} />
              </div>
              <div>
                <Label htmlFor="provincia">Provincia</Label>
                <Input id="provincia" {...register("provincia")} />
              </div>
              <div>
                <Label htmlFor="cuit">CUIT *</Label>
                <Input id="cuit" {...register("cuit")} />
                {errors.cuit && <p className="text-sm text-destructive mt-1">{errors.cuit.message}</p>}
              </div>
               <div>
                <Label htmlFor="mail">Mail</Label>
                <Input id="mail" type="email" {...register("mail")} />
                {errors.mail && <p className="text-sm text-destructive mt-1">{errors.mail.message}</p>}
              </div>
              <div>
                <Label htmlFor="celular">Celular</Label>
                <Input id="celular" {...register("celular")} />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="tipo">
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inscripto">Inscripto</SelectItem>
                        <SelectItem value="monotributo">Monotributo</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoría *</Label>
                <Controller
                  name="categoria"
                  control={control}
                  render={({ field }) => (
                      <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                      <SelectTrigger id="categoria">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Categoría 1</SelectItem>
                        <SelectItem value="2">Categoría 2</SelectItem>
                        <SelectItem value="3">Categoría 3</SelectItem>
                        <SelectItem value="4">Categoría 4</SelectItem>
                        <SelectItem value="5">Categoría 5</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Guardar Cliente</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
