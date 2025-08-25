import { db } from "@/lib/firebase";
import type { Cliente, ClienteWithId } from "@/lib/types";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

const clientesCollection = collection(db, "clientes");

export async function getClientes(): Promise<ClienteWithId[]> {
    const snapshot = await getDocs(clientesCollection);
    return snapshot.docs.map(doc => ({ ...doc.data() as Cliente, id: doc.id }));
}

export async function addCliente(cliente: Cliente) {
    const docRef = await addDoc(clientesCollection, cliente);
    return docRef.id;
}

export async function updateCliente(id: string, cliente: Partial<Cliente>) {
    const clienteDoc = doc(db, "clientes", id);
    await updateDoc(clienteDoc, cliente);
}

export async function deleteCliente(id: string) {
    const clienteDoc = doc(db, "clientes", id);
    await deleteDoc(clienteDoc);
}
