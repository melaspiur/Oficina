
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
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);
  
  const q = query(
    movimientosCollection,
    where("comprobante", "==", "FC"),
    // Firestore requires dates to be stored as Timestamps for range queries to work reliably.
    // We assume the `fecha` field is an ISO string and convert it on the client,
    // but for querying we must use Timestamps if the DB stores them as such.
    // Let's adjust the logic to query based on ISO strings if they are stored that way.
    // NOTE: This query might be slow on large datasets without an index.
    // Let's assume `fecha` is an ISO string for now as per previous implementation.
    where("fecha", ">=", startDate.toISOString()),
    where("fecha", "<=", endDate.toISOString())
  );

  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ ...doc.data() as Movimiento, id: doc.id }));
}

