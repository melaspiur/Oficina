
"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FacturacionMensualView } from "./facturacion-mensual-view"
import { FacturacionEventualView } from "./facturacion-eventual-view"

export function FacturacionView() {
    return (
        <div className="p-6">
            <Tabs defaultValue="mensual">
                <TabsList className="grid w-full grid-cols-2 max-w-lg">
                    <TabsTrigger value="mensual">Facturación Mensual</TabsTrigger>
                    <TabsTrigger value="eventual">Facturación Eventual</TabsTrigger>
                </TabsList>
                <TabsContent value="mensual">
                     <FacturacionMensualView />
                </TabsContent>
                <TabsContent value="eventual">
                    <FacturacionEventualView />
                </TabsContent>
            </Tabs>
        </div>
    )
}
