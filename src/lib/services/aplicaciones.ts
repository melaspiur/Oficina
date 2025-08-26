import { db } from "@/lib/firebase";
import type { Aplicacion } from "@/lib/types";
import { collection, writeBatch, doc } from "firebase/firestore";

const aplicacionesCollection = collection(db, "aplicaciones");
const movimientosCollection = collection(db, "movimientos");


/**
 * Adds an array of application documents to the 'aplicaciones' collection using a batch write.
 * Also updates the 'aplicacion' field on the original receipt document in the 'movimientos' collection.
 * @param aplicaciones An array of Aplicacion objects to add.
 */
export async function addAplicacionesBatch(aplicaciones: Aplicacion[]) {
    if (!aplicaciones || aplicaciones.length === 0) {
        return;
    }

    const batch = writeBatch(db);
    const reciboId = aplicaciones[0].reciboId; // All applications in a batch belong to the same receipt

    // 1. Add new application documents
    aplicaciones.forEach(aplicacion => {
        const docRef = doc(aplicacionesCollection); 
        batch.set(docRef, aplicacion);
    });

    // 2. Calculate total applied amount
    const totalAplicado = aplicaciones.reduce((sum, app) => sum + app.importe, 0);

    // 3. Update the original receipt document in the 'movimientos' collection
    if (reciboId && totalAplicado > 0) {
        const reciboDocRef = doc(movimientosCollection, reciboId);
        // Using `update` with dot notation is safer if other fields exist.
        // We are setting the total applied amount.
        batch.update(reciboDocRef, { aplicacion: totalAplicado });
    }

    await batch.commit();
}
