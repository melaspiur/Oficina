"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AsignacionClienteView } from "./asignacion-cliente-view"
import { AsignacionIndividualView } from "./asignacion-individual-view"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AsignacionView() {
    return (
        <div className="p-6">
            <Tabs defaultValue="por-cliente">
                <TabsList className="grid w-full grid-cols-2 max-w-lg">
                    <TabsTrigger value="por-cliente">Asignación por Cliente</TabsTrigger>
                    <TabsTrigger value="individual">Asignación Individual</TabsTrigger>
                </TabsList>
                <TabsContent value="por-cliente">
                     <AsignacionClienteView />
                </TabsContent>
                <TabsContent value="individual">
                    <AsignacionIndividualView />
                </TabsContent>
            </Tabs>
        </div>
    )
}
