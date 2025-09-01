import { getClientDb } from "@/lib/firebase";
import type { Asignacion, AsignacionWithId } from "@/lib/types";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, writeBatch } from "firebase/firestore";

export async function getAsignaciones(): Promise<AsignacionWithId[]> {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const asignacionesCollection = collection(db, "asignaciones");
    const snapshot = await getDocs(asignacionesCollection);
    return snapshot.docs.map(doc => ({ ...doc.data() as Asignacion, id: doc.id }));
}

export async function getAsignacionesByClienteId(clienteId: string): Promise<AsignacionWithId[]> {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const asignacionesCollection = collection(db, "asignaciones");
    const q = query(asignacionesCollection, where("clienteId", "==", clienteId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data() as Asignacion, id: doc.id }));
}

export async function getAsignacionesByNovedadId(novedadId: string): Promise<AsignacionWithId[]> {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const asignacionesCollection = collection(db, "asignaciones");
    const q = query(asignacionesCollection, where("novedadId", "==", novedadId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data() as Asignacion, id: doc.id }));
}


export async function addAsignacion(asignacion: Asignacion) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const asignacionesCollection = collection(db, "asignaciones");
    // Check for duplicates before adding
    const q = query(asignacionesCollection, 
        where("clienteId", "==", asignacion.clienteId),
        where("novedadId", "==", asignacion.novedadId)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        throw new Error("Esta novedad ya ha sido asignada a este cliente.");
    }
    const docRef = await addDoc(asignacionesCollection, asignacion);
    return docRef.id;
}

export async function addAsignacionesBatch(asignaciones: Asignacion[]) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const asignacionesCollection = collection(db, "asignaciones");
    const batch = writeBatch(db);

    asignaciones.forEach(asignacion => {
        const docRef = doc(asignacionesCollection);
        batch.set(docRef, asignacion);
    });

    await batch.commit();
}

export async function updateAsignacion(id: string, asignacion: Partial<Asignacion>) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const asignacionDoc = doc(db, "asignaciones", id);
    await updateDoc(asignacionDoc, asignacion);
}

export async function deleteAsignacion(id: string) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const asignacionDoc = doc(db, "asignaciones", id);
    await deleteDoc(asignacionDoc);
}

export async function deleteAsignacionesByClienteId(clienteId: string) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const asignacionesCollection = collection(db, "asignaciones");
    const q = query(asignacionesCollection, where("clienteId", "==", clienteId));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
        batch.delete(d.ref);
    });
    await batch.commit();
}

export async function deleteAsignacionesBatch(ids: string[]) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const batch = writeBatch(db);
    ids.forEach(id => {
        const docRef = doc(db, "asignaciones", id);
        batch.delete(docRef);
    });
    await batch.commit();
}


/**
 * Deletes all documents from the 'asignaciones' collection.
 * USE WITH CAUTION.
 */
export async function deleteAllAsignaciones() {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const asignacionesCollection = collection(db, "asignaciones");
    const snapshot = await getDocs(asignacionesCollection);
    
    if (snapshot.empty) {
        return; // Nothing to delete
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
        batch.delete(d.ref);
    });
    await batch.commit();
}

export async function deleteAsignacionesEventuales(asignaciones: AsignacionWithId[]) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const batch = writeBatch(db);
    asignaciones.forEach(a => {
        if (a.eventual) {
            const docRef = doc(db, "asignaciones", a.id);
            batch.delete(docRef);
        }
    });
    await batch.commit();
}

/**
 * Deletes all assignments marked as 'eventual'.
 * @returns The number of deleted assignments.
 */
export async function deleteAllEventualAsignaciones(): Promise<number> {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const asignacionesCollection = collection(db, "asignaciones");
    const q = query(asignacionesCollection, where("eventual", "==", true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return 0; // Nothing to delete
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
        batch.delete(d.ref);
    });
    await batch.commit();
    return snapshot.size;
}
