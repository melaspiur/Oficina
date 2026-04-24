
'use server';
/**
 * @fileOverview Flujo para generar la facturación mensual de todos los clientes.
 *
 * - generarFacturacion - Procesa las asignaciones y genera un resumen de facturación.
 * - GenerarFacturacionInput - El input para el flujo.
 * - GenerarFacturacionOutput - El output del flujo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { ClienteWithId } from '@/lib/services/clientes';
import type { NovedadWithId } from '@/lib/services/novedades';
import type { AsignacionWithId } from '@/lib/services/asignaciones';
import type { ClienteFacturado } from '@/lib/types';


// Esquema de datos que el flujo recibe
const ClienteSchema = z.object({
  id: z.string(),
  codigo: z.number(),
  nombre: z.string(),
  cuit: z.string(),
  tipo: z.enum(["inscripto", "monotributo"]),
  categoria: z.number(),
});
const NovedadSchema = z.object({
  id: z.string(),
  codigo: z.number(),
  nombre: z.string(),
  importe: z.number(),
  meses: z.record(z.boolean()),
});
const AsignacionSchema = z.object({
  id: z.string(),
  clienteId: z.string(),
  novedadId: z.string(),
  cantidad: z.number(),
  eventual: z.boolean().optional(), // Ahora es opcional para evitar errores con datos antiguos
});
const ConfigComprobantesSchema = z.object({
  ultimoFactura: z.number(),
  ultimoRecibo: z.number(),
  ultimoMesEventual: z.string().optional(),
})


// Esquema de entrada
const GenerarFacturacionInputSchema = z.object({
  mes: z.string().describe('El mes para el cual generar la facturación (e.g., "enero").'),
  fechaFacturacion: z.string().describe('La fecha de la factura en formato ISO.'),
  clientes: z.array(ClienteSchema),
  novedades: z.array(NovedadSchema),
  asignaciones: z.array(AsignacionSchema),
  config: ConfigComprobantesSchema,
});
export type GenerarFacturacionInput = z.infer<typeof GenerarFacturacionInputSchema>;

// Esquema de salida
const NovedadFacturadaSchema = z.object({
  novedadId: z.string(),
  novedadCodigo: z.number(),
  novedadNombre: z.string(),
  cantidad: z.number(),
  importe: z.number(),
  numeroFactura: z.number(),
});

const ClienteFacturadoSchema = z.object({
  clienteId: z.string(),
  clienteCodigo: z.number(),
  clienteNombre: z.string(),
  novedades: z.array(NovedadFacturadaSchema),
  totalFacturado: z.number(),
});

const GenerarFacturacionOutputSchema = z.object({
  mes: z.string(),
  fechaFacturacion: z.string(),
  clientes: z.array(ClienteFacturadoSchema),
  totalGeneral: z.number(),
  ultimoNumeroFactura: z.number(),
  asignacionesEventualesBorradas: z.array(z.string()).optional(),
});
export type GenerarFacturacionOutput = z.infer<typeof GenerarFacturacionOutputSchema>;


// Función exportada que llama al flujo
export async function generarFacturacion(input: GenerarFacturacionInput): Promise<GenerarFacturacionOutput> {
  return generarFacturacionFlow(input);
}


const generarFacturacionFlow = ai.defineFlow(
  {
    name: 'generarFacturacionFlow',
    inputSchema: GenerarFacturacionInputSchema,
    outputSchema: GenerarFacturacionOutputSchema,
  },
  async (input) => {
    const { mes, fechaFacturacion, clientes, novedades, asignaciones, config } = input;
    
    let ultimoNumeroFactura = config.ultimoFactura;

    const clientesMap = new Map(clientes.map(c => [c.id, c]));
    const novedadesMap = new Map(novedades.map(n => [n.id, n]));
    const asignacionesEventuales: any[] = [];

    // 2. Mapear las asignaciones a cada cliente
    const facturacionPorCliente = new Map<string, { cliente: any; novedades: any[] }>();

    for (const asignacion of asignaciones) {
      const novedad = novedadesMap.get(asignacion.novedadId);
      const mesValido = novedad && mes in novedad.meses && novedad.meses[mes];

      if (mesValido) {
        if (!facturacionPorCliente.has(asignacion.clienteId)) {
            const cliente = clientesMap.get(asignacion.clienteId);
            if (cliente) {
                 facturacionPorCliente.set(asignacion.clienteId, { cliente, novedades: [] });
            }
        }
        
        const clienteEntry = facturacionPorCliente.get(asignacion.clienteId);
        if (clienteEntry) {
            ultimoNumeroFactura++;
            clienteEntry.novedades.push({
                novedadId: novedad!.id,
                novedadCodigo: novedad!.codigo,
                novedadNombre: novedad!.nombre,
                cantidad: asignacion.cantidad,
                importe: asignacion.cantidad * novedad!.importe,
                numeroFactura: ultimoNumeroFactura,
            });
            
             if (asignacion.eventual) { 
                asignacionesEventuales.push(asignacion);
            }
        }
      }
    }
    
    // 3. Formatear la salida
    const clientesFacturados: ClienteFacturado[] = [];
    let totalGeneral = 0;

    for (const [clienteId, data] of facturacionPorCliente.entries()) {
      const totalCliente = data.novedades.reduce((sum, n) => sum + n.importe, 0);
      totalGeneral += totalCliente;

      clientesFacturados.push({
        clienteId: clienteId,
        clienteCodigo: data.cliente.codigo,
        clienteNombre: data.cliente.nombre,
        novedades: data.novedades,
        totalFacturado: totalCliente,
      });
    }

    return {
      mes,
      fechaFacturacion,
      clientes: clientesFacturados.sort((a,b) => a.clienteCodigo - b.clienteCodigo),
      totalGeneral,
      ultimoNumeroFactura: ultimoNumeroFactura,
      asignacionesEventualesBorradas: asignacionesEventuales.map(a => a.id),
    };
  }
);
