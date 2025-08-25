"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { PlusCircle, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ClienteDialog } from "./cliente-dialog"
import type { Cliente } from "@/lib/types"

const sampleClientes: Cliente[] = [
    { codigo: 1, nombre: "Cliente Ejemplo 1", domicilio: "Calle Falsa 123", localidad: "Springfield", provincia: "Provincia Falsa", cuit: "20-12345678-9", tipo: "inscripto", categoria: 1 },
    { codigo: 2, nombre: "Cliente Ejemplo 2", domicilio: "Avenida Siempreviva 742", localidad: "Springfield", provincia: "Provincia Falsa", cuit: "27-87654321-0", tipo: "monotributo", categoria: 3 },
]

export function ClientesView() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [clientes, setClientes] = React.useState(sampleClientes)
  
  const handleSaveCliente = (cliente: Cliente) => {
    // Lógica para guardar o actualizar el cliente
    // Por ahora, solo lo añadimos a la lista de ejemplo
    setClientes(prev => [...prev, cliente])
    setIsDialogOpen(false)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Lista de Clientes</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2" />
          Nuevo Cliente
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>CUIT</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((cliente) => (
              <TableRow key={cliente.codigo}>
                <TableCell>{cliente.codigo}</TableCell>
                <TableCell className="font-medium">{cliente.nombre}</TableCell>
                <TableCell>{cliente.cuit}</TableCell>
                <TableCell>
                  <Badge variant={cliente.tipo === 'inscripto' ? "secondary" : "default"}>
                    {cliente.tipo}
                  </Badge>
                </TableCell>
                <TableCell>
                   <Badge variant="outline">Cat. {cliente.categoria}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ClienteDialog 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveCliente} 
      />
    </div>
  )
}
