import { db } from "@/lib/firebase";
import type { Asignacion, AsignacionWithId } from "@/lib/types";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, writeBatch } from "firebase/firestore";

const asignacionesCollection = collection(db, "asignaciones");

export async function getAsignaciones(): Promise<AsignacionWithId[]> {
    const snapshot = await getDocs(asignacionesCollection);
    return snapshot.docs.map(doc => ({ ...doc.data() as Asignacion, id: doc.id }));
}

export async function getAsignacionesByClienteId(clienteId: string): Promise<AsignacionWithId[]> {
    const q = query(asignacionesCollection, where("clienteId", "==", clienteId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data() as Asignacion, id: doc.id }));
}

export async function addAsignacion(asignacion: Asignacion) {
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

export async function updateAsignacion(id: string, asignacion: Partial<Asignacion>) {
    const asignacionDoc = doc(db, "asignaciones", id);
    await updateDoc(asignacionDoc, asignacion);
}

export async function deleteAsignacion(id: string) {
    const asignacionDoc = doc(db, "asignaciones", id);
await deleteDoc(asignacionDoc);
}

export async function deleteAsignacionesByClienteId(clienteId: string) {
    const q = query(asignacionesCollection, where("clienteId", "==", clienteId));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
        batch.delete(d.ref);
    });
    await batch.commit();
}
