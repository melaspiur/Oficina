import { getClientDb } from "@/lib/firebase";
import type { Novedad, NovedadWithId } from "@/lib/types";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

export async function getNovedades(): Promise<NovedadWithId[]> {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const novedadesCollection = collection(db, "novedades");
    const snapshot = await getDocs(novedadesCollection);
    return snapshot.docs.map(doc => ({ ...doc.data() as Novedad, id: doc.id }));
}

export async function addNovedad(novedad: Novedad) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const novedadesCollection = collection(db, "novedades");
    const docRef = await addDoc(novedadesCollection, novedad);
    return docRef.id;
}

export async function updateNovedad(id: string, novedad: Partial<Novedad>) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const novedadDoc = doc(db, "novedades", id);
    await updateDoc(novedadDoc, novedad);
}

export async function deleteNovedad(id: string) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const novedadDoc = doc(db, "novedades", id);
    await deleteDoc(novedadDoc);
}
