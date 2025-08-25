import { db } from "@/lib/firebase";
import type { Novedad, NovedadWithId } from "@/lib/types";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

const novedadesCollection = collection(db, "novedades");

export async function getNovedades(): Promise<NovedadWithId[]> {
    const snapshot = await getDocs(novedadesCollection);
    return snapshot.docs.map(doc => ({ ...doc.data() as Novedad, id: doc.id }));
}

export async function addNovedad(novedad: Novedad) {
    const docRef = await addDoc(novedadesCollection, novedad);
    return docRef.id;
}

export async function updateNovedad(id: string, novedad: Partial<Novedad>) {
    const novedadDoc = doc(db, "novedades", id);
    await updateDoc(novedadDoc, novedad);
}

export async function deleteNovedad(id: string) {
    const novedadDoc = doc(db, "novedades", id);
    await deleteDoc(novedadDoc);
}