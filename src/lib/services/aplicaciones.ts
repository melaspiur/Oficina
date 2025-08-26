import { db } from "@/lib/firebase";
import type { Aplicacion } from "@/lib/types";
import { collection, writeBatch, doc } from "firebase/firestore";

const aplicacionesCollection = collection(db, "aplicaciones");

/**
 * Adds an array of application documents to the 'aplicaciones' collection using a batch write.
 * @param aplicaciones An array of Aplicacion objects to add.
 */
export async function addAplicacionesBatch(aplicaciones: Aplicacion[]) {
    if (!aplicaciones || aplicaciones.length === 0) {
        return;
    }

    const batch = writeBatch(db);

    aplicaciones.forEach(aplicacion => {
        // Firestore will auto-generate an ID for the new document
        const docRef = doc(aplicacionesCollection); 
        batch.set(docRef, aplicacion);
    });

    await batch.commit();
}
