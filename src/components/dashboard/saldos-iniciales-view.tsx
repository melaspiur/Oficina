"use client"

import * as React from "react"
import { AlertTriangle, FileUp, Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { getNovedades, addNovedad } from "@/lib/services/novedades"
import { getMovimientosPorDescripcion, updateMovimientosBatch } from "@/lib/services/movimientos"
import type { Novedad, NovedadWithId, MovimientoWithId } from "@/lib/types"

const SALDO_INICIAL_CODIGO = 14;
const SALDO_INICIAL_NOMBRE = "SALDO INICIAL";

export function SaldosInicialesView() {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [isDone, setIsDone] = React.useState(false);
  const { toast } = useToast();

  const handleProcesarSaldos = async () => {
    setIsConfirmOpen(false);
    setIsProcessing(true);
    
    try {
        // 1. Find or create the "SALDO INICIAL" novedad
        const novedades = await getNovedades();
        let saldoInicialNovedad = novedades.find(n => n.codigo === SALDO_INICIAL_CODIGO);

        if (!saldoInicialNovedad) {
            toast({ title: "Creando Novedad...", description: `No se encontró la novedad '${SALDO_INICIAL_NOMBRE}', se creará automáticamente.` });
            const nuevaNovedad: Novedad = {
                codigo: SALDO_INICIAL_CODIGO,
                nombre: SALDO_INICIAL_NOMBRE,
                importe: 0,
                meses: { enero: false, febrero: false, marzo: false, abril: false, mayo: false, junio: false, julio: false, agosto: false, septiembre: false, octubre: false, noviembre: false, diciembre: false }
            };
            const newId = await addNovedad(nuevaNovedad);
            saldoInicialNovedad = { ...nuevaNovedad, id: newId };
        }

        // 2. Find all movements with the description "Saldos Iniciales" that don't have a novedadId yet
        const movimientos = await getMovimientosPorDescripcion("Saldos Iniciales");
        const movimientosAActualizar = movimientos.filter(m => !m.novedadId);

        if (movimientosAActualizar.length === 0) {
            toast({
                title: "No hay nada que actualizar",
                description: "Todas las facturas de saldo inicial ya están vinculadas a una novedad.",
            });
            setIsDone(true);
            setIsProcessing(false);
            return;
        }

        // 3. Prepare the updates
        const updates = movimientosAActualizar.map(mov => ({
            id: mov.id,
            changes: { novedadId: saldoInicialNovedad!.id }
        }));
        
        // 4. Batch update the movements
        await updateMovimientosBatch(updates);

        toast({
            title: "Vinculación Exitosa",
            description: `Se han actualizado y vinculado ${updates.length} facturas de saldo inicial.`,
        });
        setIsDone(true);

    } catch (error) {
        console.error("Error procesando saldos iniciales:", error);
        toast({
            title: "Error en el Proceso",
            description: "Ocurrió un error al intentar vincular los saldos. Revise la consola para más detalles.",
            variant: "destructive",
        });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Vincular Saldos Iniciales</CardTitle>
          <CardDescription>
            Este proceso busca todas las facturas de "Saldos Iniciales" y las vincula a la novedad correspondiente (código 14).
            Es una operación segura de ejecutar varias veces, ya que solo afectará a las facturas que no estén vinculadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 pt-10">
          <FileUp className="h-16 w-16 text-muted-foreground" />
          <p className="text-center text-muted-foreground max-w-md">
            Al hacer clic, el sistema creará la novedad "SALDO INICIAL" si no existe y luego
            actualizará todas las facturas de saldo para vincularlas a ella.
          </p>
          <Button
            size="lg"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isProcessing || isDone}
          >
            {isProcessing ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                </>
            ) : isDone ? "Proceso Completado" : "Vincular Saldos Iniciales"}
          </Button>
          {isDone && (
              <p className="text-sm text-green-600 font-medium">El proceso de vinculación ha finalizado.</p>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
             <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
             </div>
            <AlertDialogDescription>
              Esta acción modificará las facturas existentes que fueron cargadas como saldos iniciales
              para vincularlas a una novedad específica. Es una operación segura pero irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleProcesarSaldos} className="bg-destructive hover:bg-destructive/90">
                Sí, vincular saldos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
