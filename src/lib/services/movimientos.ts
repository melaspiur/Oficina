
import { db } from "@/lib/firebase";
import type { Movimiento, MovimientoWithId } from "@/lib/types";
import { collection, writeBatch, doc, getDocs, query, where, addDoc, updateDoc } from "firebase/firestore";

const movimientosCollection = collection(db, "movimientos");

/**
 * Adds a single movement document to the 'movimientos' collection.
 * @param movimiento The Movimiento object to add.
 * @returns The ID of the newly created document.
 */
export async function addMovimiento(movimiento: Movimiento): Promise<string> {
    if (!movimiento) {
        throw new Error("Movimiento data is required.");
    }
    const docRef = await addDoc(movimientosCollection, movimiento);
    return docRef.id;
}


/**
 * Adds an array of movement documents to the 'movimientos' collection using a batch write.
 * @param movimientos An array of Movimiento objects to add.
 */
export async function addMovimientosBatch(movimientos: Movimiento[]) {
    if (!movimientos || movimientos.length === 0) {
        return;
    }

    const batch = writeBatch(db);

    movimientos.forEach(movimiento => {
        // Firestore will auto-generate an ID for the new document
        const docRef = doc(movimientosCollection); 
        batch.set(docRef, movimiento);
    });

    await batch.commit();
}

/**
 * Updates a movement document in the 'movimientos' collection.
 * @param id The ID of the movement document to update.
 * @param data The partial data to update.
 */
export async function updateMovimiento(id: string, data: Partial<Movimiento>) {
    const movimientoDoc = doc(db, "movimientos", id);
    await updateDoc(movimientoDoc, data);
}


/**
 * Fetches all 'FC' (Factura) movements for a specific month and year.
 * @param year The full year (e.g., 2024).
 * @param month The month (1-12).
 * @returns A promise that resolves to an array of MovimientoWithId.
 */
export async function getMovimientosFacturasPorMes(year: number, month: number): Promise<MovimientoWithId[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1); // First day of next month

  const q = query(
    movimientosCollection,
    where("comprobante", "==", "FC")
  );

  const snapshot = await getDocs(q);
  
  const allFacturas = snapshot.docs.map(doc => ({ ...doc.data() as Movimiento, id: doc.id }));

  // Filter by date in the client-side code
  const filteredFacturas = allFacturas.filter(mov => {
      const movDate = new Date(mov.fecha);
      return movDate >= startDate && movDate < endDate;
  });

  return filteredFacturas;
}

/**
 * Fetches all movements for a specific client.
 * @param clienteId The ID of the client.
 * @returns A promise that resolves to an array of all movements for the client.
 */
export async function getMovimientosPorCliente(clienteId: string): Promise<MovimientoWithId[]> {
    if (!clienteId) return [];

    const q = query(
        movimientosCollection,
        where("clienteId", "==", clienteId)
    );
    
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ ...(doc.data() as Movimiento), id: doc.id }));
}

/**
 * Fetches all pending movements (invoices and receipts with a balance) for a specific client.
 * @param clienteId The ID of the client.
 * @returns A promise that resolves to an object with pending invoices and receipts.
 */
export async function getMovimientosPendientesPorCliente(clienteId: string): Promise<{ facturas: MovimientoWithId[], recibos: MovimientoWithId[] }> {
    if (!clienteId) {
        return { facturas: [], recibos: [] };
    }
    const movimientosCliente = await getMovimientosPorCliente(clienteId);

    const facturasPendientes = movimientosCliente
        .filter(mov => mov.comprobante === 'FC' && mov.importe > mov.aplicacion)
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    const recibosPendientes = movimientosCliente
        .filter(mov => mov.comprobante === 'RE' && mov.importe > mov.aplicacion)
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    return {
        facturas: facturasPendientes,
        recibos: recibosPendientes
    };
}


/**
 * Fetches all 'FC' (Factura) movements for a specific client.
 * @param clienteId The ID of the client.
 * @returns A promise that resolves to an array of MovimientoWithId.
 */
export async function getMovimientosFacturasPorCliente(clienteId: string): Promise<MovimientoWithId[]> {
  if (!clienteId) return [];

  const q = query(
    movimientosCollection,
    where("comprobante", "==", "FC"),
    where("clienteId", "==", clienteId)
  );
  
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({ ...doc.data() as Movimiento, id: doc.id }));
}

/**
 * Fetches all 'RE' (Recibo) movements for a specific client.
 * @param clienteId The ID of the client.
 * @returns A promise that resolves to an array of MovimientoWithId.
 */
export async function getMovimientosRecibosPorCliente(clienteId: string): Promise<MovimientoWithId[]> {
  if (!clienteId) return [];

  const q = query(
    movimientosCollection,
    where("comprobante", "==", "RE"),
    where("clienteId", "==", clienteId)
  );
  
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({ ...doc.data() as Movimiento, id: doc.id }));
}
