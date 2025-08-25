"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getClientes, updateCliente } from "@/lib/services/clientes"
import { getNovedades } from "@/lib/services/novedades"
import type { ClienteWithId, NovedadWithId } from "@/lib/types"

type LogMessage = {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

// Type for the object that will be stored in Firestore
type ServicioToStore = {
  novedadId: string;
  cantidad: number;
}

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

    addLog({ type: 'info', message: 'Iniciando procesamiento...' });

    const lines = inputText.split('\n');
    let currentCliente: ClienteWithId | null = null;
    let serviciosParaCliente: ServicioToStore[] = [];
    let updatesCount = 0;
    const updatePromises: Promise<any>[] = [];
    let clienteParaActualizar: ClienteWithId | null = null;

    const processLastClient = async () => {
        if (clienteParaActualizar) {
            const updatePromise = updateCliente(clienteParaActualizar.id, { serviciosAsignados: serviciosParaCliente })
                .then(() => {
                    addLog({ type: 'success', message: `Cliente "${clienteParaActualizar!.nombre}": ${serviciosParaCliente.length} novedades asignadas correctamente.` });
                    updatesCount++;
                })
                .catch(() => {
                    addLog({ type: 'error', message: `Error al actualizar el cliente "${clienteParaActualizar!.nombre}".` });
                });
            updatePromises.push(updatePromise);
        }
    }

    for (const line of lines) {
      if (line.includes('; ---------------------------')) {
        await processLastClient(); // Process previous client
        
        // Start new client
        const nombreCliente = line.split(';')[0].trim();
        serviciosParaCliente = [];
        currentCliente = null;
        clienteParaActualizar = null;

        if (nombreCliente) {
            currentCliente = clientesDb.find(c => c.nombre.trim().toUpperCase() === nombreCliente.toUpperCase()) || null;
            if (!currentCliente) {
                addLog({ type: 'warning', message: `Cliente "${nombreCliente}" no encontrado. Se omitirá.` });
            } else {
                 addLog({ type: 'info', message: `Procesando cliente: "${currentCliente.nombre}"...` });
                 clienteParaActualizar = currentCliente;
                 serviciosParaCliente = [...(currentCliente.serviciosAsignados || [])] // Start with existing services
            }
        }

      } else if (currentCliente) {
        const parts = line.split(';').map(p => p.trim());
        if (parts.length === 3) {
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

          // Avoid duplicates
          if (!serviciosParaCliente.some(s => s.novedadId === novedad.id)) {
            serviciosParaCliente.push({
              novedadId: novedad.id,
              cantidad: cantidad,
            });
          }
        }
      }
    }

    await processLastClient(); // Process the very last client in the file

    await Promise.all(updatePromises);
    
    addLog({ type: 'info', message: `Proceso completado. Se actualizaron ${updatesCount} clientes.` });
    setIsProcessing(false)
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importar y Asignar Novedades</CardTitle>
          <CardDescription>
            Pegue el listado de texto para asignar masivamente las novedades a los clientes.
            El sistema buscará cada cliente por nombre y cada novedad por código para realizar la asignación.
            Las asignaciones existentes no se eliminarán, solo se agregarán las nuevas.
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
                <Alert key={index} variant={log.type === 'error' ? 'destructive' : 'default'}>
                    {log.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
                    {(log.type === 'warning' || log.type === 'error') && <AlertCircle className="h-4 w-4" />}
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
