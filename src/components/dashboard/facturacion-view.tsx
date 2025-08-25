"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function FacturacionView() {
  return (
    <div className="p-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Facturación Recurrente</CardTitle>
            <CardDescription>
              Genera facturas mensuales para todos los clientes basadas en sus servicios asignados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Esta acción procesará todos los clientes y creará las facturas correspondientes para el mes actual.
            </p>
            <Button>Generar Facturación Mensual</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Facturación Eventual</CardTitle>
            <CardDescription>
              Crea una factura para un trabajo o servicio específico no recurrente.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground mb-4">
              Selecciona un cliente y agrega los conceptos para generar una factura única.
            </p>
            <Button>Crear Factura Eventual</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
