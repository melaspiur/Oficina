# Registro de cambios

Historial de modificaciones hechas sobre el codigo generado por Firebase Studio.
Si Firebase Studio vuelve a generar codigo, verificar que estos cambios sigan
presentes: varios corrigen errores que venian del codigo original.

---

## 2026-10-30

### 1. Cuenta Corriente por Cliente: faltaba el saldo anterior

**Archivo:** `src/components/dashboard/informe-cuenta-corriente-view.tsx`

**Problema.** El informe mostraba un saldo final que no coincidia con el
Resumen de Cuenta del mismo cliente. Para Paso del Mojon S.A. daba
-$1.948.475,00 cuando el saldo real era $185.000,85.

**Causa.** El informe filtraba los movimientos del ultimo anio pero arrancaba
el saldo acumulado en cero (`let saldoAcumulado = 0`). La ventana de 12 meses
deja adentro los recibos pero afuera las facturas que esos recibos cancelaban,
asi que el saldo se iba a negativo y no se recuperaba nunca.

En el caso de Paso del Mojon, el recibo RE-00022112 del 11/11/2025 por
$2.133.475,00 pagaba honorarios facturados antes de octubre 2025, fuera de la
ventana. La diferencia cerraba exacto:

    Saldo que mostraba:        -$ 1.948.475,00
    Saldo anterior faltante:   +$ 2.133.475,85
                               ----------------
    Saldo correcto:             $   185.000,85

**Solucion.** Se trae la totalidad de los movimientos del cliente, se calcula
el arrastre de todo lo anterior al periodo (facturas suman, recibos restan) y
el saldo acumulado arranca desde ahi. Se agrego la fila SALDO ANTERIOR como
primera linea en pantalla, en el PDF y en el Excel.

**Criterio.** Todo listado cortado por periodo tiene que mostrar su saldo
anterior. Sin esa linea no se entiende de donde sale el saldo, y el total no
cierra contra el Resumen de Cuenta.

### 2. Dos funciones que no existian

**Archivo:** `src/lib/services/movimientos.ts`

El proyecto no compilaba. Dos funciones se importaban desde varias pantallas
pero nunca se habian creado:

- `getMovimientosFacturasPorCliente` - usada por Informe de Facturacion por
  Cliente y por Modificar Factura. Devuelve los comprobantes FC del cliente.
- `getMovimientosRecibosPorCliente` - usada por Desaplicar Recibo, Informe de
  Cobranzas por Cliente y Modificar Recibo. Devuelve los comprobantes RE.

Ambas se resuelven filtrando sobre `getMovimientosPorCliente`.

**Pendiente de prueba:** esas cinco pantallas probablemente nunca llegaron a
funcionar. Conviene probarlas una por una.

### 3. Import sin uso que rompia la compilacion

**Archivo:** `src/components/dashboard/clientes-view.tsx`

Importaba `updateClientesBatch`, que no existe en el servicio de clientes y no
se usaba en ninguna parte del archivo. Se quito del import.

### 4. Exportacion a Excel en Asignacion Individual

**Archivo:** `src/components/dashboard/asignacion-individual-view.tsx`

Se agrego el boton "Exportar a Excel" en la tarjeta de clientes asignados.
Exporta unicamente los clientes de la novedad seleccionada, ordenados por
codigo, con columnas Codigo, Cliente, Cantidad, Importe y Tipo (Fijo o
Eventual), y una fila TOTAL al pie. El importe se calcula igual que en
pantalla: importe de la novedad por cantidad asignada.

### 5. Paso a sitio estatico para publicar por FTP

**Archivos:** `next.config.ts` y `src/ai/flows/generar-facturacion-flow.ts`

El sistema no se publica en Firebase App Hosting sino en un hosting comun por
FTP, que solo sirve archivos estaticos y no ejecuta Node.js. Para eso hace
falta compilar con `output: 'export'`, lo que impide usar server actions.

La unica server action en uso era `generarFacturacion`, el calculo de la
facturacion mensual. Estaba envuelta en Genkit (`ai.defineFlow`) pero **no
hacia ninguna llamada a la IA**: era calculo puro. Se convirtio en una funcion
comun que corre en el navegador, sin tocar una sola linea de la logica.

`src/lib/actions.ts` (`draftEmail`, `suggestTasks`) si usa IA de verdad, pero
es codigo muerto del starter de Firebase Studio: no esta conectado a ninguna
pantalla. Si alguna vez se usa, deja de poder compilarse como sitio estatico.

En `next.config.ts` se agrego:

- `output: 'export'` - genera la carpeta `out` para subir por FTP
- `trailingSlash: true` - rutas con barra final, necesario en hosting comun
- `images.unoptimized: true` - sin optimizador de imagenes, que requiere servidor

---

## Como publicar

1. `npm run build` - genera la carpeta `out` (unos 3 MB)
2. Subir por FTP **el contenido** de `out`, no la carpeta `out`, a la raiz
   publica del servidor. Tienen que quedar `index.html`, `_next/`,
   `dashboard/`, `login/` y `404.html`.
3. Verificar que `_next/static` haya subido completo. Si queda a medias el
   sitio carga en blanco.
4. En la consola de Firebase, Authentication > Settings > Dominios
   autorizados, agregar el dominio del hosting. Sin eso el sitio carga pero el
   login falla.

Para desarrollo local: `npm run dev`, que levanta en el puerto 9002.

---

## Pendientes

- **Selector de periodo en Cuenta Corriente.** Hoy el periodo esta fijo en el
  ultimo anio. Con el saldo anterior ya resuelto, se puede dejar que el
  usuario elija 3, 4, 5 meses o lo que necesite.
- **Reglas de seguridad de Firestore.** El sistema esta publicado en internet
  y la unica proteccion real son las reglas de Firestore. Si estan en modo
  abierto (`allow read, write: if true`), cualquiera que encuentre la
  direccion puede leer o modificar los datos de los clientes. Revisar.
- **Repositorio publico.** `melaspiur/Oficina` es publico y
  `src/lib/empresas.ts` contiene las configuraciones de Firebase de cada
  empresa. Conviene pasarlo a privado.
- **Probar las cinco pantallas** que dependian de las funciones que faltaban
  (punto 2).
