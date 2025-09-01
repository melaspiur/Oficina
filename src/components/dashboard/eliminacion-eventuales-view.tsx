
"use client"

import * as React from "react"
import { Loader2, Trash2, AlertTriangle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { deleteAllEventualAsignaciones } from "@/lib/services/asignaciones"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export function EliminacionEventualesView() {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  const { toast } = useToast()

  const handleEliminar = async () => {
    setIsProcessing(true);
    setIsConfirmOpen(false);
    
    try {
        const count = await deleteAllEventualAsignaciones();
        if (count > 0) {
             toast({
                title: "Eliminación Completada",
                description: `Se han eliminado ${count} asignaciones eventuales.`,
            });
        } else {
             toast({
                title: "Sin Cambios",
                description: "No se encontraron asignaciones eventuales para eliminar.",
            });
        }
    } catch (error) {
        console.error("Error al eliminar asignaciones eventuales:", error);
        toast({ title: "Error", description: "No se pudieron eliminar las asignaciones.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <>
        <div className="space-y-6 pt-6">
        <Card className="max-w-2xl">
            <CardHeader>
            <CardTitle>Eliminar Asignaciones Eventuales</CardTitle>
            <CardDescription>
                Esta herramienta eliminará de forma permanente todas las asignaciones que hayan sido marcadas como "Eventual". 
                Esta acción no se puede deshacer. Úsela con precaución.
            </CardDescription>
            </CardHeader>
            <CardFooter>
                 <Button 
                    variant="destructive"
                    onClick={() => setIsConfirmOpen(true)}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Eliminar Todas las Asignaciones Eventuales
                </Button>
            </CardFooter>
        </Card>
        </div>

        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                Esta acción es irreversible. Se eliminarán todas las asignaciones marcadas como eventuales.
                No podrá recuperar estos datos.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleEliminar} className="bg-destructive hover:bg-destructive/90">
                    Sí, eliminar todo
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
