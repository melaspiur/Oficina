
import { db } from "@/lib/firebase";
import type { Movimiento } from "@/lib/types";
import { collection, writeBatch, doc } from "firebase/firestore";

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
