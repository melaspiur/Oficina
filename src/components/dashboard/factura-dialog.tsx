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
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format as formatDate } from "date-fns"

import { cn } from "@/lib/utils"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Combobox } from "@/components/ui/combobox"
import type { MovimientoWithId, ClienteWithId, NovedadWithId } from "@/lib/types"

// Helper to parse dd/mm/yyyy string to Date
const parseDate = (dateStr: string): Date | undefined => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return undefined;
  const [day, month, year] = dateStr.split('/').map(Number);
  if (!day || !month || !year) return undefined;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
    return date;
  }
  return undefined;
};


const formSchema = z.object({
  fecha: z.string().refine((val) => /^\d{2}\/\d{2}\/\d{4}$/.test(val), {
    message: "El formato de fecha debe ser dd/mm/yyyy",
  }).refine((val) => parseDate(val) !== undefined, {
    message: "La fecha ingresada no es válida."
  }),
  descripcion: z.string().max(40, "La descripción no puede tener más de 40 caracteres.").optional(),
  importe: z.coerce.number().min(0.01, "El importe debe ser mayor a cero."),
  novedadId: z.string().min(1, "Debe seleccionar una novedad."),
})

type FormSchema = z.infer<typeof formSchema>;

type FacturaDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSave: (facturaId: string, data: FormSchema) => void
  factura: MovimientoWithId | null
  cliente: ClienteWithId | null
  novedades: NovedadWithId[]
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function FacturaDialog({ isOpen, onOpenChange, onSave, factura, cliente, novedades }: FacturaDialogProps) {
    const [displayImporte, setDisplayImporte] = React.useState("0,00");

    const novedadOptions = React.useMemo(() => 
        novedades.map(n => ({ value: n.id, label: `${n.codigo} - ${n.nombre}` })),
    [novedades]);

    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            importe: 0,
            descripcion: "",
            fecha: "",
            novedadId: "",
        }
    });

  React.useEffect(() => {
    if (isOpen && factura) {
        form.reset({
            fecha: formatDate(new Date(factura.fecha), "dd/MM/yyyy"),
            descripcion: factura.descripcion || "",
            importe: factura.importe,
            novedadId: factura.novedadId || "",
        });
    }
  }, [isOpen, factura, form]);

  React.useEffect(() => {
    if (factura) {
      setDisplayImporte(formatNumber(factura.importe));
    }
  }, [factura]);


  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove all non-digit characters
    if (value.length > 8) {
      value = value.slice(0, 8);
    }
    if (value.length > 4) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    } else if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    form.setValue('fecha', value, { shouldValidate: true });
  };
  
  const handleImporteFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = form.getValues('importe');
    setDisplayImporte(String(value || '').replace('.', ','));
  };

  const handleImporteBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = form.getValues('importe');
    if (value) {
      setDisplayImporte(formatNumber(value));
    } else {
      setDisplayImporte("0,00");
    }
  };

  const onSubmit = (data: FormSchema) => {
    if (factura) {
        onSave(factura.id, data)
    }
  }
  
  if (!factura || !cliente) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Modificar Factura</DialogTitle>
          <DialogDescription>
            Factura N° {String(factura.numero).padStart(8, '0')} para el cliente {cliente.nombre}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-6 pt-4">
                     <FormField
                        control={form.control}
                        name="fecha"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fecha de la Factura *</FormLabel>
                            <div className="relative">
                                <FormControl>
                                <Input 
                                    placeholder="dd/mm/yyyy" 
                                    value={field.value}
                                    onChange={handleDateChange}
                                />
                                </FormControl>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span className="sr-only">Abrir calendario</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={parseDate(field.value)}
                                        onSelect={(date) => {
                                            if (date) {
                                                field.onChange(formatDate(date, "dd/MM/yyyy"))
                                            }
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                                </Popover>
                            </div>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="novedadId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Novedad *</FormLabel>
                            <Combobox
                                options={novedadOptions}
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Seleccione una novedad..."
                                searchPlaceholder="Buscar novedad..."
                                notFoundMessage="No se encontraron novedades."
                            />
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="importe"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Importe *</FormLabel>
                            <FormControl>
                            <Input 
                                type="text" 
                                inputMode="decimal"
                                className="text-right"
                                value={displayImporte}
                                onFocus={handleImporteFocus}
                                onBlur={handleImporteBlur}
                                onChange={(e) => {
                                    const rawValue = e.target.value;
                                    setDisplayImporte(rawValue);
                                    const parsedValue = parseFloat(rawValue.replace(',', '.'));
                                    field.onChange(isNaN(parsedValue) ? 0 : parsedValue);
                                }}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="descripcion"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripción (Opcional)</FormLabel>
                            <FormControl>
                            <Input maxLength={40} placeholder="Ej: Honorarios profesionales..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
