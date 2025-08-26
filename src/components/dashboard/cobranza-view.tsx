
"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImportacionView } from "./importacion-view"
import { ReciboView } from "./recibo-view"

export function CobranzaView() {
    return (
        <div className="p-6">
            <Tabs defaultValue="importar">
                <TabsList className="grid w-full grid-cols-2 max-w-lg">
                    <TabsTrigger value="importar">Procesar Cobranzas</TabsTrigger>
                    <TabsTrigger value="recibo">Generar Recibo</TabsTrigger>
                </TabsList>
                <TabsContent value="importar">
                     <ImportacionView />
                </TabsContent>
                <TabsContent value="recibo">
                    <ReciboView />
                </TabsContent>
            </Tabs>
        </div>
    )
}

    