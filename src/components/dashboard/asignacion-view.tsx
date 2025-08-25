"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, PlusCircle, Check, ChevronsUpDown } from "lucide-react"
import type { ClienteWithId, NovedadWithId, ServicioAsignado } from "@/lib/types"
import { getClientes, updateCliente } from "@/lib/services/clientes"
import { getNovedades } from "@/lib/services/novedades"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

export function AsignacionView() {
  const [clientes, setClientes] = React.useState<ClienteWithId[]>([])
  const [novedades, setNovedades] = React.useState<NovedadWithId[]>([])
  const [selectedCliente, setSelectedCliente] = React.useState<ClienteWithId | null>(null)
  const [selectedNovedad, setSelectedNovedad] = React.useState<NovedadWithId | null>(null)
  const [serviciosAsignados, setServiciosAsignados] = React.useState<ServicioAsignado[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [focusedInputIndex, setFocusedInputIndex] = React.useState<number | null>(null)
  const [openCombobox, setOpenCombobox] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [clientesData, novedadesData] = await Promise.all([getClientes(), getNovedades()])
        const sortedClientes = clientesData.sort((a, b) => a.codigo - b.codigo);
        setClientes(sortedClientes);
        const sortedNovedades = novedadesData.sort((a, b) => a.codigo - b.codigo)
        setNovedades(sortedNovedades)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [toast])

  const handleClienteChange = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId) || null
    setSelectedCliente(cliente)
    setServiciosAsignados(cliente?.serviciosAsignados || [])
  }
  
  const handleAddServicio = () => {
    if (selectedNovedad) {
      const servicioExistente = serviciosAsignados.find(s => s.novedadId === selectedNovedad.id);
      if (servicioExistente) {
        toast({ title: "Servicio Duplicado", description: "Esta novedad ya ha sido asignada a este cliente.", variant: "destructive" });
        return;
      }
      const nuevoServicio: ServicioAsignado = {
        novedadId: selectedNovedad.id,
        nombre: selectedNovedad.nombre,
        cantidad: 1.00,
        importe: selectedNovedad.importe,
      };
      setServiciosAsignados([...serviciosAsignados, nuevoServicio]);
      setSelectedNovedad(null);
    }
  };

  const handleRemoveServicio = (index: number) => {
    const newServicios = [...serviciosAsignados];
    newServicios.splice(index, 1);
    setServiciosAsignados(newServicios);
  }

 const handleServicioChange = (index: number, field: keyof ServicioAsignado, value: string) => {
    const newServicios = [...serviciosAsignados];
    const servicio = { ...newServicios[index] };
    
    if (field === 'cantidad') {
      const cleanedValue = value.replace(',', '.');
      const parsedValue = parseFloat(cleanedValue);
      
      (servicio as any)[field] = isNaN(parsedValue) ? value : parsedValue;

      if (!isNaN(parsedValue)) {
        const novedadOriginal = novedades.find(n => n.id === servicio.novedadId);
        if (novedadOriginal) {
          servicio.importe = novedadOriginal.importe * parsedValue;
        }
      } else if (value === '' || cleanedValue === '') {
        (servicio as any).cantidad = '';
      }
    }
    newServicios[index] = servicio;
    setServiciosAsignados(newServicios);
  };


  const handleSaveChanges = () => {
    if (!selectedCliente) return;

    const sanitizedServicios = serviciosAsignados.map(s => {
      const cantidad = parseFloat(String(s.cantidad).replace(',', '.'));
      return {
        ...s,
        cantidad: isNaN(cantidad) ? 0 : cantidad,
      };
    });

    try {
      updateCliente(selectedCliente.id, { serviciosAsignados: sanitizedServicios });
      const updatedClientes = clientes.map(c => 
        c.id === selectedCliente.id ? { ...c, serviciosAsignados: sanitizedServicios } : c
      );
      setClientes(updatedClientes);
      setServiciosAsignados(sanitizedServicios);
      toast({ title: "Cambios Guardados", description: "Los servicios asignados se actualizaron correctamente." });
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({ title: "Error", description: "No se pudieron guardar los cambios.", variant: "destructive" });
    }
  }

  const formatCurrency = (value: number | string) => {
      const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
      if (isNaN(numValue) || value === '' || value === null) {
        return '';
      }
      return new Intl.NumberFormat('es-AR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
      }).format(numValue);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Asignación de Novedades a Clientes</CardTitle>
          <CardDescription>Seleccione un cliente para ver o modificar sus servicios (novedades) asignados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="cliente-select">Cliente</Label>
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between"
                disabled={isLoading}
              >
                {selectedCliente
                  ? `${selectedCliente.codigo} - ${selectedCliente.nombre}`
                  : isLoading ? "Cargando clientes..." : "Seleccione un cliente"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Buscar cliente por código o nombre..." />
                <CommandList>
                  <CommandEmpty>No se encontró el cliente.</CommandEmpty>
                  <CommandGroup>
                    {clientes.map((cliente) => (
                      <CommandItem
                        key={cliente.id}
                        value={cliente.id}
                        onSelect={(currentValue) => {
                           handleClienteChange(currentValue);
                           setOpenCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCliente?.id === cliente.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {cliente.codigo} - {cliente.nombre}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {selectedCliente && (
        <Card>
          <CardHeader>
            <CardTitle>Servicios para: {selectedCliente.nombre}</CardTitle>
            <CardDescription>Añada, edite o elimine los servicios asignados para este cliente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-end gap-2 p-4 border rounded-lg">
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
                                <SelectItem key={n.id} value={n.id}>
                                  {`${n.codigo} - ${n.nombre}`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleAddServicio} disabled={!selectedNovedad}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar
                </Button>
            </div>
            
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50%]">Nombre del Servicio</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                            <TableHead className="text-right">Importe</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviciosAsignados.length > 0 ? (
                        serviciosAsignados.map((servicio, index) => (
                          <TableRow key={index}>
                              <TableCell className="font-medium">{servicio.nombre}</TableCell>
                              <TableCell>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    focusedInputIndex === index
                                      ? String(servicio.cantidad).replace(',', '.')
                                      : formatCurrency(servicio.cantidad)
                                  }
                                  onFocus={(e) => {
                                      setFocusedInputIndex(index)
                                      e.target.select()
                                  }}
                                  onBlur={(e) => {
                                      setFocusedInputIndex(null)
                                      handleServicioChange(index, 'cantidad', e.target.value)
                                      handleSaveChanges()
                                  }}
                                  onChange={(e) => handleServicioChange(index, 'cantidad', e.target.value)}
                                  className="h-8 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                 <Input 
                                  type="text"
                                  value={formatCurrency(servicio.importe)} 
                                  readOnly
                                  className="h-8 bg-muted/50 border-none text-right focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => handleRemoveServicio(index)}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                              </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center h-24">
                            Este cliente no tiene servicios asignados.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
