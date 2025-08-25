"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getClientes } from "@/lib/services/clientes"
import { getNovedades } from "@/lib/services/novedades"
import { addAsignacion } from "@/lib/services/asignaciones"
import type { ClienteWithId, NovedadWithId } from "@/lib/types"

type LogMessage = {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

export function ImportacionView() {
  const [inputText, setInputText] = React.useState("")
  const [logs, setLogs] = React.useState<LogMessage[]>([])
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [clientesDb, setClientesDb] = React.useState<ClienteWithId[]>([])
  const [novedadesDb, setNovedadesDb] = React.useState<NovedadWithId[]>([])
  const { toast } = useToast()

  React.useEffect(() => {
    async function fetchData() {
        try {
            const [clientesData, novedadesData] = await Promise.all([getClientes(), getNovedades()]);
            setClientesDb(clientesData);
            setNovedadesDb(novedadesData);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error de carga',
                description: 'No se pudieron cargar los datos de clientes o novedades.',
            });
            console.error("Error fetching initial data:", error);
        }
    }
    fetchData();
  }, [toast]);

  const addLog = (log: LogMessage) => {
    setLogs(prev => [...prev, log]);
  }

  const parseAndProcess = async () => {
    setIsProcessing(true)
    setLogs([])

    if (!inputText.trim()) {
        addLog({ type: 'error', message: 'El área de texto está vacía.' });
        setIsProcessing(false);
        return;
    }

    if (clientesDb.length === 0 || novedadesDb.length === 0) {
        addLog({ type: 'error', message: 'Los datos de clientes o novedades no se han cargado. Intente de nuevo.' });
        setIsProcessing(false);
        return;
    }

    addLog({ type: 'info', message: 'Iniciando procesamiento de importación masiva...' });

    const lines = inputText.split('\n');
    let currentCliente: ClienteWithId | null = null;
    let assignmentPromises: Promise<any>[] = [];
    let processedCount = 0;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.includes('; ---------------------------')) {
            const nombreCliente = trimmedLine.split(';')[0].trim();
            if (nombreCliente) {
                // Find client by name, trimming and converting to upper case for better matching
                currentCliente = clientesDb.find(c => c.nombre.trim().toUpperCase() === nombreCliente.toUpperCase()) || null;
                if (!currentCliente) {
                    addLog({ type: 'warning', message: `Cliente "${nombreCliente}" no encontrado en la base de datos. Se omitirán sus novedades.` });
                }
            } else {
                currentCliente = null; 
            }
        } else if (currentCliente) { 
            const parts = trimmedLine.split(';').map(p => p.trim());
            if (parts.length >= 3) {
                const [codigoStr, , cantidadStr] = parts;
                const codigo = parseInt(codigoStr, 10);
                const cantidad = parseFloat(cantidadStr.replace(',', '.'));

                if (isNaN(codigo) || isNaN(cantidad)) {
                    addLog({ type: 'warning', message: `Línea de novedad inválida para "${currentCliente.nombre}": ${line}` });
                    continue;
                }

                const novedad = novedadesDb.find(n => n.codigo === codigo);
                if (!novedad) {
                    addLog({ type: 'warning', message: `Novedad con código ${codigo} no encontrada. Se omitirá para "${currentCliente.nombre}".` });
                    continue;
                }

                // Create a new assignment document
                const promise = addAsignacion({
                    clienteId: currentCliente.id,
                    novedadId: novedad.id,
                    cantidad: cantidad
                }).then(() => {
                    addLog({ type: 'success', message: `Asignación creada: Cliente "${currentCliente?.nombre}" -> Novedad "${novedad.nombre}" (Cant: ${cantidad}).` });
                    processedCount++;
                }).catch((error) => {
                    if (error.message.includes("ya ha sido asignada")) {
                         addLog({ type: 'warning', message: `Asignación OMITIDA (duplicada): Cliente "${currentCliente?.nombre}" -> Novedad "${novedad.nombre}".` });
                    } else {
                        addLog({ type: 'error', message: `Error al asignar novedad ${novedad.nombre} a ${currentCliente?.nombre}: ${error.message}` });
                    }
                });
                assignmentPromises.push(promise);
            }
        }
    }

    try {
        await Promise.all(assignmentPromises);
    } catch(e) {
        console.error("Error during batch processing:", e);
        addLog({ type: 'error', message: 'Ocurrió un error inesperado durante el procesamiento.' });
    }
    
    addLog({ type: 'info', message: `Proceso completado. Se intentaron procesar ${assignmentPromises.length} asignaciones. Creadas con éxito: ${processedCount}.` });
    setIsProcessing(false)
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importar y Asignar Novedades</CardTitle>
          <CardDescription>
            Pegue el listado de texto para crear masivamente las asignaciones.
            El sistema buscará cada cliente por nombre y cada novedad por código para crear un nuevo registro de asignación.
            Si una asignación para la misma novedad y cliente ya existe, se mostrará un aviso y se omitirá.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Pegue aquí el texto del listado..."
            className="min-h-[300px] font-mono text-xs"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
          />
          <Button onClick={parseAndProcess} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Procesar y Asignar Novedades"
            )}
          </Button>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registro del Proceso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
             {logs.map((log, index) => (
                <Alert key={index} variant={log.type === 'error' ? 'destructive' : 'default'} className={
                    log.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800/40 dark:text-yellow-300 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400' : ''
                }>
                    {log.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
                    {(log.type === 'warning' || log.type === 'error' || log.type === 'info') && <AlertCircle className="h-4 w-4" />}
                    <AlertTitle className="capitalize">{log.type}</AlertTitle>
                    <AlertDescription>{log.message}</AlertDescription>
                </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
