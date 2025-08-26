
import { db } from "@/lib/firebase";
import type { Movimiento, MovimientoWithId } from "@/lib/types";
import { collection, writeBatch, doc, getDocs, query, where, Timestamp } from "firebase/firestore";

const movimientosCollection = collection(db, "movimientos");

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

