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
import { Trash2, PlusCircle } from "lucide-react"
import type { ClienteWithId, NovedadWithId, ServicioAsignado } from "@/lib/types"
import { getClientes, updateCliente } from "@/lib/services/clientes"
import { getNovedades } from "@/lib/services/novedades"
import { useToast } from "@/hooks/use-toast"

export function AsignacionView() {
  const [clientes, setClientes] = React.useState<ClienteWithId[]>([])
  const [novedades, setNovedades] = React.useState<NovedadWithId[]>([])
  const [selectedCliente, setSelectedCliente] = React.useState<ClienteWithId | null>(null)
  const [selectedNovedad, setSelectedNovedad] = React.useState<NovedadWithId | null>(null)
  const [serviciosAsignados, setServiciosAsignados] = React.useState<ServicioAsignado[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const { toast } = useToast()

  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [clientesData, novedadesData] = await Promise.all([getClientes(), getNovedades()])
        setClientes(clientesData)
        setNovedades(novedadesData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleClienteChange = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId) || null
    setSelectedCliente(cliente)
    setServiciosAsignados(cliente?.serviciosAsignados || [])
  }
  
  const handleAddServicio = () => {
    if (selectedNovedad) {
      const nuevoServicio: ServicioAsignado = {
        novedadId: selectedNovedad.id,
        nombre: selectedNovedad.nombre,
        cantidad: 1,
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

  const handleServicioChange = (index: number, field: keyof ServicioAsignado, value: string | number) => {
    const newServicios = [...serviciosAsignados];
    // @ts-ignore
    newServicios[index][field] = value;
    setServiciosAsignados(newServicios);
  }

  const handleSaveChanges = async () => {
    if (!selectedCliente) return;
    try {
      await updateCliente(selectedCliente.id, { serviciosAsignados: serviciosAsignados });
       // After saving, we also need to update the local state of the clientes array
      const updatedClientes = clientes.map(c => 
        c.id === selectedCliente.id ? { ...c, serviciosAsignados: serviciosAsignados } : c
      );
      setClientes(updatedClientes);
      toast({ title: "Cambios Guardados", description: "Los servicios asignados se actualizaron correctamente." });
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({ title: "Error", description: "No se pudieron guardar los cambios.", variant: "destructive" });
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Asignación de Novedades a Clientes</CardTitle>
          <CardDescription>Seleccione un cliente para ver o modificar sus servicios (novedades) asignados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="cliente-select">Cliente</Label>
          <Select onValueChange={handleClienteChange} disabled={isLoading}>
            <SelectTrigger id="cliente-select">
              <SelectValue placeholder={isLoading ? "Cargando clientes..." : "Seleccione un cliente"} />
            </SelectTrigger>
            <SelectContent>
              {clientes.map(cliente => (
                <SelectItem key={cliente.id} value={cliente.id}>{cliente.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                                <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>
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
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Importe</TableHead>
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
                                  type="number" 
                                  value={servicio.cantidad}
                                  onChange={(e) => handleServicioChange(index, 'cantidad', Number(e.target.value))}
                                  className="h-8"
                                />
                              </TableCell>
                              <TableCell>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  value={servicio.importe} 
                                  onChange={(e) => handleServicioChange(index, 'importe', Number(e.target.value))}
                                  className="h-8"
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
