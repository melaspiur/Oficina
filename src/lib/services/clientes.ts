import { getClientDb } from "@/lib/firebase";
import type { Cliente, ClienteWithId } from "@/lib/types";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch, query, where, limit } from "firebase/firestore";

export async function getClientes(): Promise<ClienteWithId[]> {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const clientesCollection = collection(db, "clientes");
    const snapshot = await getDocs(clientesCollection);
    return snapshot.docs.map(doc => ({ ...doc.data() as Cliente, id: doc.id }));
}

export async function getClienteByCodigo(codigo: number): Promise<ClienteWithId | null> {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const clientesCollection = collection(db, "clientes");
    const q = query(clientesCollection, where("codigo", "==", codigo), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }
    
    const docSnap = snapshot.docs[0];
    return { ...docSnap.data() as Cliente, id: docSnap.id };
}


export async function addCliente(cliente: Cliente) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const clientesCollection = collection(db, "clientes");
    const docRef = await addDoc(clientesCollection, cliente);
    return docRef.id;
}

export async function updateCliente(id: string, cliente: Partial<Cliente>) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const clienteDoc = doc(db, "clientes", id);
    await updateDoc(clienteDoc, cliente);
}

export async function deleteCliente(id: string) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const clienteDoc = doc(db, "clientes", id);
    await deleteDoc(clienteDoc);
}
