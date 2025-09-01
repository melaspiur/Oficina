
"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AsignacionClienteView } from "./asignacion-cliente-view"
import { AsignacionIndividualView } from "./asignacion-individual-view"
import { ListadoAsignacionesView } from "./listado-asignaciones-view"
import { EliminacionEventualesView } from "./eliminacion-eventuales-view"

export function AsignacionView() {
    return (
        <div className="p-6">
            <Tabs defaultValue="por-cliente">
                <TabsList className="grid w-full grid-cols-4 max-w-3xl">
                    <TabsTrigger value="por-cliente">Asignación por Cliente</TabsTrigger>
                    <TabsTrigger value="individual">Asignación Individual</TabsTrigger>
                    <TabsTrigger value="listado">Listado de Asignaciones</TabsTrigger>
                    <TabsTrigger value="eliminacion">Eliminación Eventuales</TabsTrigger>
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
                 <TabsContent value="eliminacion">
                    <EliminacionEventualesView />
                </TabsContent>
            </Tabs>
        </div>
    )
}
