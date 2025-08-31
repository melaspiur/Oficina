
"use client"

import * as React from "react"
import { AlertTriangle, FileUp, Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { getClientes } from "@/lib/services/clientes"
import { addMovimientosBatch } from "@/lib/services/movimientos"
import type { ClienteWithId, Movimiento } from "@/lib/types"

const saldosInicialesData = `
0000017;EL REENCUENTRO S.A.;3102400
0000036;INCHAUSPE HORACIO HECTOR;2423300
0000044;LACOMBE JOSE LUIS;1401999.99
0000045;LEIBOLD LUIS JUAN;5033
0000048;LIENAHRD ERNESTO DOMINGO;793000
0000049;LOPEZ OMAR FERNANDO;82826.82
0000056;MILLA HECTOR OSCAR;2455080
0000064;PAGGI NORBERTO RAUL;564000
0000075;ROSSO ARTEAGA MARIA MERCEDES;1479766.3
0000086;VILLORIA CARLOS MARIO;40000
0000094;HEIM RUBEN;1102000
0000097;MARTIN SERGIO DANIEL;157500
0000100;TRABUCCO GABRIELA;859700
0000103;LA CANAZAYA S.A.;347501
0000104;ITCHART RUBEN DANIEL;224999.62
0000108;CANERO JAQUELINA;650000
0000109;CANERO MARIO ALBERTO;822000
0000113;COSTANTINI ROBERTO FABIO;54830.5
0000119;INVERSORA TELEFONICA S.A.;130099.95
0000121;LANZILOTTA MARCELO RUBEN;120000
0000128;SAGASTI GUILLERMO RICARDO;80000
0000129;SARSUR JORGE SUC.;744500
0000135;ERMANTRAUT GLADYS INES;143430
0000136;CAMIO PABLO EDUARDO;944984.34
0000142;CANERO ALEJANDRA;597480
0000143;FERNANDEZ HUGO JOSE;58379.39
0000145;LACOMBE JULIO OSVALDO;120000
0000149;INCHAUSPE OSCAR PEDRO;785000
0000150;DURAN SUSANA CRISTINA;155000
0000154;BLACHET ARIEL VICTOR;315000
0000156;LASPIUR JUAN CARLOS;1122500
0000159;PISCHEL DANIEL OMAR;3895
0000161;FARMACIA SARSUR S.C.S.;4572867.82
0000164;ROBILOTTE BETTINA;465000
0000166;VOLPE LAURA MARIA CRISTINA;218980
0000169;FERNANDEZ PATRICIA LEONOR;120000
0000173;FRANCISCO SEXTO S.R.L.;1000
0000182;MELONI ADRIAN ALFREDO;955350
0000184;PICHI PUL S.A.;9160751
0000187;PAGGI GUILLERMO ARIEL;1207000
0000188;ROBILOTTE EMANUEL;825000
0000190;PATTHAUER GUSTAVO ALFREDO;729999.9
0000192;MONZA NEUMATICOS S.A.;110000
0000193;GOMERIAS MONZA S.A.;130000
0000204;KREDER CRISTIAN LUIS;465000
0000207;OTERO MATIAS JOSE;36820
0000209;MILLA LAUTARO HECTOR;1040400
0000212;LAUMANN RICARDO RAUL;1060000
0000213;LAUMANN EDUARDO MARCELINO;1060000
0000215;ARGUELLO CORRADINI LEONEL NICO;10957
0000217;YEREGUI MARIA CRISTINA;1147100
0000220;SARSUR YANIRA;374860
0000221;MONTENEGRO CAROLINA;951500
0000224;ROSTA LUCIA LOURDES;960
0000225;FERRANDO ROSANA NORA;1521500
0000228;PASO DEL MOJON S.A.;1275000.93
0000230;FERREIRA ELIANA BEATRIZ;31500
0000231;RAGGI CARLOS ARIEL;1008282.74
0000232;SUC. FERNANDEZ RUBEN ANGEL;363334
000-0233;FERNANDEZ ARIAS GREGORIO;18620
0000235;HEIM LIDIA IRENE;40000
0000236;MANZANARES PATRICIA ROSA;223000
0000237;ROSSO CRISTINA;749900
0000238;ACTIS GORETTA GUSTAVO DANIEL;643000
0000239;MILCAM AGROPECUARIA S.A.;700000
0000243;DON PACHO AGROSER.AGROP. S.R.L;975000.32
0000245;MELONI MATIAS;80000
0000249;VIDAL MAURICIO ARIEL;80000
0000250;DI SALVO LUIS IGNACIO;66760
0000254;SAGASTI ELSIE NORA;147700
0000255;PAGGI DEMES ALBERTO RAUL;285000
0000257;PENNA GUSTAVO RAUL;8050
`.trim().split('\n');

export function SaldosInicialesView() {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [isDone, setIsDone] = React.useState(false);
  const [clientesNoEncontrados, setClientesNoEncontrados] = React.useState<string[]>([]);
  const { toast } = useToast();

  const handleCargarSaldos = async () => {
    setIsConfirmOpen(false);
    setIsProcessing(true);
    setClientesNoEncontrados([]);
    
    try {
        const clientes = await getClientes();
        const clientesMap = new Map(clientes.map(c => [c.codigo, c.id]));
        
        const movimientos: Movimiento[] = [];
        let numeroFactura = 0;
        const fechaFactura = new Date('2025-07-31T12:00:00Z').toISOString();
        const noEncontrados: string[] = [];

        for (const line of saldosInicialesData) {
            const [codigoStr, _nombre, importeStr] = line.split(';');
            const codigo = parseInt(codigoStr.replace(/-/g, ''), 10);
            const importe = parseFloat(importeStr);

            const clienteId = clientesMap.get(codigo);

            if (clienteId) {
                numeroFactura++;
                movimientos.push({
                    clienteId,
                    fecha: fechaFactura,
                    comprobante: 'FC',
                    numero: numeroFactura,
                    importe: importe,
                    aplicacion: 0,
                    descripcion: 'Saldos Iniciales'
                });
            } else {
                noEncontrados.push(`${String(codigo).padStart(7,'0')} - ${_nombre.trim()}`);
            }
        }

        if (noEncontrados.length > 0) {
            setClientesNoEncontrados(noEncontrados);
        }
        
        if (movimientos.length > 0) {
            await addMovimientosBatch(movimientos);
            toast({
                title: "Saldos Iniciales Cargados",
                description: `Se han cargado exitosamente ${movimientos.length} facturas como saldos iniciales.`,
            });
            setIsDone(true);
        } else {
             toast({
                title: "No se cargó nada",
                description: "No se encontraron clientes coincidentes para cargar saldos.",
                variant: "destructive"
            });
        }

    } catch (error) {
        console.error("Error cargando saldos iniciales:", error);
        toast({
            title: "Error en la Carga",
            description: "Ocurrió un error al intentar cargar los saldos. Revise la consola para más detalles.",
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
          <CardTitle>Carga de Saldos Iniciales</CardTitle>
          <CardDescription>
            Este proceso cargará una factura inicial para cada cliente con su saldo pendiente.
            Esta es una operación delicada que solo debe ejecutarse una vez.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 pt-10">
          <FileUp className="h-16 w-16 text-muted-foreground" />
          <p className="text-center text-muted-foreground max-w-md">
            Al hacer clic en el botón, se procesarán los saldos iniciales de los clientes especificados
            y se crearán las facturas correspondientes en la colección de movimientos.
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
            ) : isDone ? "Proceso Completado" : "Cargar Saldos Iniciales"}
          </Button>
          {isDone && (
              <p className="text-sm text-green-600 font-medium">La carga de saldos ya fue realizada. No es necesario volver a ejecutarla.</p>
          )}
        </CardContent>
      </Card>
      
      {clientesNoEncontrados.length > 0 && (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Clientes No Encontrados</AlertTitle>
            <AlertDescription>
                Los siguientes clientes de la lista de saldos no fueron encontrados en la base de datos y sus saldos no fueron cargados. Por favor, verifique los códigos.
                <ul className="list-disc pl-5 mt-2 text-xs font-mono">
                    {clientesNoEncontrados.map(cliente => <li key={cliente}>{cliente}</li>)}
                </ul>
            </AlertDescription>
         </Alert>
      )}

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
             <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
             </div>
            <AlertDialogDescription>
              Esta acción es irreversible. Se crearán facturas de saldo inicial para
              los clientes. Ejecutar este proceso más de una vez duplicará los saldos.
              Por favor, confirme que desea continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCargarSaldos} className="bg-destructive hover:bg-destructive/90">
                Sí, cargar saldos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
