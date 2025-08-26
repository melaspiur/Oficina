import { db } from "@/lib/firebase";
import type { Aplicacion } from "@/lib/types";
import { collection, writeBatch, doc, increment } from "firebase/firestore";

const aplicacionesCollection = collection(db, "aplicaciones");
const movimientosCollection = collection(db, "movimientos");


/**
 * Adds an array of application documents to the 'aplicaciones' collection using a batch write.
 * Also updates the 'aplicacion' field on the original receipt and the corresponding invoices.
 * @param aplicaciones An array of Aplicacion objects to add.
 */
export async function addAplicacionesBatch(aplicaciones: Aplicacion[]) {
    if (!aplicaciones || aplicaciones.length === 0) {
        return;
    }

    const batch = writeBatch(db);
    const reciboId = aplicaciones[0].reciboId; // All applications in a batch belong to the same receipt

    let totalAplicadoEnEsteLote = 0;

    // 1. Add new application documents and update invoices
    aplicaciones.forEach(aplicacion => {
        // Create new application document
        const appDocRef = doc(aplicacionesCollection); 
        batch.set(appDocRef, aplicacion);

        // Increment the 'aplicacion' field on the invoice
        const facturaDocRef = doc(movimientosCollection, aplicacion.facturaId);
        batch.update(facturaDocRef, { aplicacion: increment(aplicacion.importe) });

        totalAplicadoEnEsteLote += aplicacion.importe;
    });


    // 2. Update the original receipt document in the 'movimientos' collection
    if (reciboId && totalAplicadoEnEsteLote > 0) {
        const reciboDocRef = doc(movimientosCollection, reciboId);
        // Increment the total applied amount on the receipt
        batch.update(reciboDocRef, { aplicacion: increment(totalAplicadoEnEsteLote) });
    }

    await batch.commit();
}
