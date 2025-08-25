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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { Cliente, ClienteWithId, NovedadWithId, ServicioAsignado } from "@/lib/types"
import { getNovedades } from "@/lib/services/novedades"
import { Trash2 } from "lucide-react"

type ClienteDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSave: (cliente: Cliente) => void
  cliente?: ClienteWithId | null
}

const servicioAsignadoSchema = z.object({
  novedadId: z.string(),
  nombre: z.string(),
  cantidad: z.coerce.number().min(0),
  importe: z.coerce.number().min(0),
});

const clienteSchema = z.object({
  codigo: z.coerce.number().min(1).max(9999),
  nombre: z.string().min(1, "El nombre es requerido"),
  domicilio: z.string().optional(),
  localidad: z.string().optional(),
  provincia: z.string().optional(),
  cuit: z.string().min(1, "El CUIT es requerido"),
  tipo: z.enum(["inscripto", "monotributo"]),
  categoria: z.coerce.number().min(1).max(5),
  serviciosAsignados: z.array(servicioAsignadoSchema).optional(),
});


export function ClienteDialog({ isOpen, onOpenChange, onSave, cliente }: ClienteDialogProps) {
  const [novedades, setNovedades] = React.useState<NovedadWithId[]>([]);
  const [selectedNovedad, setSelectedNovedad] = React.useState<NovedadWithId | null>(null);

  const { register, handleSubmit, control, formState: { errors }, reset, watch } = useForm<Cliente>({
    resolver: zodResolver(clienteSchema),
    defaultValues: cliente || {
      codigo: Math.floor(Math.random() * 9998) + 1,
      domicilio: "",
      localidad: "",
      provincia: "",
      tipo: "inscripto",
      categoria: 1,
      serviciosAsignados: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "serviciosAsignados",
  });

  React.useEffect(() => {
    async function fetchNovedades() {
      const data = await getNovedades();
      setNovedades(data);
    }
    fetchNovedades();
  }, []);
  
  React.useEffect(() => {
    if (isOpen) {
        reset(cliente || {
            codigo: Math.floor(Math.random() * 9998) + 1,
            nombre: "",
            domicilio: "",
            localidad: "",
            provincia: "",
            cuit: "",
            tipo: "inscripto",
            categoria: 1,
            serviciosAsignados: []
      });
    }
  }, [isOpen, cliente, reset]);
  
  const handleAddServicio = () => {
    if (selectedNovedad) {
      append({
        novedadId: selectedNovedad.id,
        nombre: selectedNovedad.nombre,
        cantidad: 1,
        importe: selectedNovedad.importe,
      });
      setSelectedNovedad(null);
    }
  };


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
        <Tabs defaultValue="datos">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="datos">Datos Personales</TabsTrigger>
            <TabsTrigger value="servicios">Servicios Asignados</TabsTrigger>
          </TabsList>
          <TabsContent value="datos">
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
          </TabsContent>
          <TabsContent value="servicios">
             <div className="py-4 space-y-4">
                <div className="flex items-end gap-2">
                    <div className="flex-grow">
                        <Label>Agregar Novedad</Label>
                        <Select
                            onValueChange={(novedadId) => {
                                const novedad = novedades.find(n => n.id === novedadId) || null;
                                setSelectedNovedad(novedad);
                            }}
                            value={selectedNovedad?.id || ""}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione una novedad para agregar" />
                            </SelectTrigger>
                            <SelectContent>
                                {novedades.map(n => (
                                    <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="button" onClick={handleAddServicio} disabled={!selectedNovedad}>Agregar</Button>
                </div>
                <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-2 items-center p-2 border rounded-md">
                          <p className="col-span-5 text-sm font-medium">{field.nombre}</p>
                           <div className="col-span-3">
                               <Label className="text-xs">Cantidad</Label>
                               <Input type="number" {...register(`serviciosAsignados.${index}.cantidad`)} />
                           </div>
                           <div className="col-span-3">
                               <Label className="text-xs">Importe</Label>
                               <Input type="number" step="0.01" {...register(`serviciosAsignados.${index}.importe`)} />
                           </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="col-span-1">
                              <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                      </div>
                    ))}
                    {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay servicios asignados.</p>}
                </div>
             </div>
          </TabsContent>
        </Tabs>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Guardar Cliente</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
