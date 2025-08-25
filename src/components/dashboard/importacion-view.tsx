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
import type { ClienteWithId, NovedadWithId, ServicioAsignado } from "@/lib/types"

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
    // Cargar clientes y novedades una sola vez al montar el componente
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
    let serviciosParaCliente: ServicioAsignado[] = [];
    let updatesCount = 0;

    for (const line of lines) {
      if (line.includes('; ---------------------------')) {
        // Es una línea de cliente, procesar el anterior si existe
        if (currentCliente) {
          try {
            await updateCliente(currentCliente.id, { serviciosAsignados: serviciosParaCliente });
            addLog({ type: 'success', message: `Cliente "${currentCliente.nombre}": ${serviciosParaCliente.length} novedades asignadas correctamente.` });
            updatesCount++;
          } catch(e) {
            addLog({ type: 'error', message: `Error al actualizar el cliente "${currentCliente.nombre}".` });
          }
        }
        
        // Empezar nuevo cliente
        const nombreCliente = line.split(';')[0].trim();
        serviciosParaCliente = [];
        currentCliente = null;

        if (nombreCliente) {
            currentCliente = clientesDb.find(c => c.nombre.trim().toUpperCase() === nombreCliente.toUpperCase()) || null;
            if (!currentCliente) {
                addLog({ type: 'warning', message: `Cliente "${nombreCliente}" no encontrado en la base de datos. Se omitirá.` });
            } else {
                 addLog({ type: 'info', message: `Procesando cliente: "${currentCliente.nombre}"...` });
            }
        }

      } else if (currentCliente) {
        // Es una línea de novedad para el cliente actual
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
            addLog({ type: 'warning', message: `Novedad con código ${codigo} no encontrada. Se omitirá para el cliente "${currentCliente.nombre}".` });
            continue;
          }

          serviciosParaCliente.push({
            novedadId: novedad.id,
            nombre: novedad.nombre,
            cantidad: cantidad,
            importe: novedad.importe * cantidad,
          });
        }
      }
    }

    // Procesar el último cliente del archivo
    if (currentCliente) {
         try {
            await updateCliente(currentCliente.id, { serviciosAsignados: serviciosParaCliente });
            addLog({ type: 'success', message: `Cliente "${currentCliente.nombre}": ${serviciosParaCliente.length} novedades asignadas correctamente.` });
            updatesCount++;
          } catch(e) {
            addLog({ type: 'error', message: `Error al actualizar el cliente "${currentCliente.nombre}".` });
          }
    }
    
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
