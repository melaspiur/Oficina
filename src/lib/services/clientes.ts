import { getClientDb } from "@/lib/firebase";
import type { Cliente, ClienteWithId } from "@/lib/types";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";

export async function getClientes(): Promise<ClienteWithId[]> {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const clientesCollection = collection(db, "clientes");
    const snapshot = await getDocs(clientesCollection);
    return snapshot.docs.map(doc => ({ ...doc.data() as Cliente, id: doc.id }));
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

export async function updateClientesBatch(updates: { id: string; changes: Partial<Cliente> }[]) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");

    if (!updates || updates.length === 0) {
        return;
    }
    
    const batch = writeBatch(db);

    updates.forEach(update => {
        const docRef = doc(db, "clientes", update.id);
        batch.update(docRef, update.changes);
    });

    await batch.commit();
}

export async function deleteCliente(id: string) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const clienteDoc = doc(db, "clientes", id);
    await deleteDoc(clienteDoc);
}
