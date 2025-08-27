import { db } from "@/lib/firebase";
import type { Aplicacion, AplicacionWithId } from "@/lib/types";
import { collection, writeBatch, doc, increment, query, where, getDocs, deleteDoc } from "firebase/firestore";

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


/**
 * Fetches all application documents for a given receipt ID.
 * @param reciboId The ID of the receipt.
 * @returns A promise that resolves to an array of AplicacionWithId.
 */
export async function getAplicacionesPorRecibo(reciboId: string): Promise<AplicacionWithId[]> {
    if (!reciboId) return [];

    const q = query(aplicacionesCollection, where("reciboId", "==", reciboId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ ...(doc.data() as Aplicacion), id: doc.id }));
}

/**
 * Deletes all applications related to a list of receipt IDs and reverses the applied amounts
 * on both the receipts and the corresponding invoices in a single batch operation.
 * @param reciboIds An array of receipt IDs to unapply.
 */
export async function deleteAplicacionesBatch(reciboIds: string[]) {
    if (!reciboIds || reciboIds.length === 0) return;

    const batch = writeBatch(db);

    for (const reciboId of reciboIds) {
        const aplicaciones = await getAplicacionesPorRecibo(reciboId);

        if (aplicaciones.length > 0) {
            let totalDesaplicadoDelRecibo = 0;

            for (const aplicacion of aplicaciones) {
                // 1. Decrement the 'aplicacion' on the invoice
                const facturaDocRef = doc(movimientosCollection, aplicacion.facturaId);
                batch.update(facturaDocRef, { aplicacion: increment(-aplicacion.importe) });

                // 2. Delete the application document itself
                const appDocRef = doc(aplicacionesCollection, aplicacion.id);
                batch.delete(appDocRef);

                totalDesaplicadoDelRecibo += aplicacion.importe;
            }

            // 3. Decrement the 'aplicacion' on the receipt
            const reciboDocRef = doc(movimientosCollection, reciboId);
            batch.update(reciboDocRef, { aplicacion: increment(-totalDesaplicadoDelRecibo) });
        }
    }

    await batch.commit();
}
