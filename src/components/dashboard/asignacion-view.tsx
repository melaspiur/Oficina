
"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AsignacionClienteView } from "./asignacion-cliente-view"
import { AsignacionIndividualView } from "./asignacion-individual-view"
import { ListadoAsignacionesView } from "./listado-asignaciones-view"

export function AsignacionView() {
    return (
        <div className="p-6">
            <Tabs defaultValue="por-cliente">
                <TabsList className="grid w-full grid-cols-3 max-w-2xl">
                    <TabsTrigger value="por-cliente">Asignación por Cliente</TabsTrigger>
                    <TabsTrigger value="individual">Asignación Individual</TabsTrigger>
                    <TabsTrigger value="listado">Listado de Asignaciones</TabsTrigger>
                </TabsList>
                <TabsContent value="por-cliente">
                     <AsignacionClienteView />
                </TabsContent>
                <TabsContent value="individual">
                    <AsignacionIndividualView />
                </TabsContent>
                <TabsContent value="listado">
                    <ListadoAsignacionesView />
                </TabsContent>
            </Tabs>
        </div>
    )
}
