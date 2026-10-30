
import { getClientDb } from "@/lib/firebase";
import type { Movimiento, MovimientoWithId, Cliente, ClienteWithId } from "@/lib/types";
import { collection, writeBatch, doc, getDocs, query, where, addDoc, updateDoc } from "firebase/firestore";


/**
 * Adds a single movement document to the 'movimientos' collection.
 * @param movimiento The Movimiento object to add.
 * @returns The ID of the newly created document.
 */
export async function addMovimiento(movimiento: Movimiento): Promise<string> {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");

    if (!movimiento) {
        throw new Error("Movimiento data is required.");
    }
    const movimientosCollection = collection(db, "movimientos");
    const docRef = await addDoc(movimientosCollection, movimiento);
    return docRef.id;
}


/**
 * Adds an array of movement documents to the 'movimientos' collection using a batch write.
 * @param movimientos An array of Movimiento objects to add.
 */
export async function addMovimientosBatch(movimientos: Movimiento[]) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const movimientosCollection = collection(db, "movimientos");

    if (!movimientos || movimientos.length === 0) {
        return;
    }

    const batch = writeBatch(db);

    movimientos.forEach(movimiento => {
        const docRef = doc(movimientosCollection); 
        batch.set(docRef, movimiento);
    });

    await batch.commit();
}

/**
 * Updates a movement document in the 'movimientos' collection.
 * @param id The ID of the movement document to update.
 * @param data The partial data to update.
 */
export async function updateMovimiento(id: string, data: Partial<Movimiento>) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const movimientoDoc = doc(db, "movimientos", id);
    await updateDoc(movimientoDoc, data);
}

/**
 * Updates an array of movement documents in a single batch.
 * @param updates An array of objects, each with an 'id' and a 'changes' object.
 */
export async function updateMovimientosBatch(updates: { id: string; changes: Partial<Movimiento> }[]) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");

    if (!updates || updates.length === 0) {
        return;
    }
    
    const batch = writeBatch(db);

    updates.forEach(update => {
        const docRef = doc(db, "movimientos", update.id);
        batch.update(docRef, update.changes);
    });

    await batch.commit();
}


/**
 * Fetches all 'FC' (Factura) movements for a specific month and year.
 * @param year The full year (e.g., 2024).
 * @param month The month (1-12).
 * @returns A promise that resolves to an array of MovimientoWithId.
 */
export async function getMovimientosFacturasPorMes(year: number, month: number): Promise<MovimientoWithId[]> {
  const db = getClientDb();
  if (!db) throw new Error("Firestore is not initialized");
  const movimientosCollection = collection(db, "movimientos");
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const q = query(
    movimientosCollection,
    where("comprobante", "==", "FC")
  );

  const snapshot = await getDocs(q);
  
  const allFacturas = snapshot.docs.map(doc => ({ ...doc.data() as Movimiento, id: doc.id }));

  const filteredFacturas = allFacturas.filter(mov => {
      const movDate = new Date(mov.fecha);
      return movDate >= startDate && movDate < endDate;
  });

  return filteredFacturas;
}


/**
 * Fetches all 'RE' (Recibo) movements for a specific month and year.
 * @param year The full year (e.g., 2024).
 * @param month The month (1-12).
 * @returns A promise that resolves to an array of MovimientoWithId.
 */
export async function getMovimientosRecibosPorMes(year: number, month: number): Promise<MovimientoWithId[]> {
  const db = getClientDb();
  if (!db) throw new Error("Firestore is not initialized");
  const movimientosCollection = collection(db, "movimientos");

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const q = query(
    movimientosCollection,
    where("comprobante", "==", "RE")
  );

  const snapshot = await getDocs(q);
  
  const allRecibos = snapshot.docs.map(doc => ({ ...doc.data() as Movimiento, id: doc.id }));

  const filteredRecibos = allRecibos.filter(mov => {
      const movDate = new Date(mov.fecha);
      return movDate >= startDate && movDate < endDate;
  });

  return filteredRecibos;
}

/**
 * Fetches all movements for a specific client.
 * @param clienteId The ID of the client.
 * @returns A promise that resolves to an array of all movements for the client.
 */
export async function getMovimientosPorCliente(clienteId: string): Promise<MovimientoWithId[]> {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const movimientosCollection = collection(db, "movimientos");

    if (!clienteId) return [];

    const q = query(
        movimientosCollection,
        where("clienteId", "==", clienteId)
    );
    
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ ...(doc.data() as Movimiento), id: doc.id }));
}


/**
 * Fetches all invoice (FC) movements for a specific client.
 * @param clienteId The ID of the client.
 * @returns A promise that resolves to an array of the client's invoices.
 */
export async function getMovimientosFacturasPorCliente(clienteId: string): Promise<MovimientoWithId[]> {
    if (!clienteId) return [];

    const todosLosMovimientos = await getMovimientosPorCliente(clienteId);

    return todosLosMovimientos.filter(mov => mov.comprobante === 'FC');
}


/**
 * Fetches all receipt (RE) movements for a specific client.
 * @param clienteId The ID of the client.
 * @returns A promise that resolves to an array of the client's receipts.
 */
export async function getMovimientosRecibosPorCliente(clienteId: string): Promise<MovimientoWithId[]> {
    if (!clienteId) return [];

    const todosLosMovimientos = await getMovimientosPorCliente(clienteId);

    return todosLosMovimientos.filter(mov => mov.comprobante === 'RE');
}


/**
 * Fetches all movements for a specific client within the last year.
 * @param clienteId The ID of the client.
 * @returns A promise that resolves to an array of all movements for the client from the last year.
 */
export async function getMovimientosPorClienteLastYear(clienteId: string): Promise<MovimientoWithId[]> {
    if (!clienteId) return [];

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const allMovimientos = await getMovimientosPorCliente(clienteId);

    const filteredMovimientos = allMovimientos.filter(mov => new Date(mov.fecha) >= oneYearAgo);
    
    return filteredMovimientos;
}


/**
 * Fetches all pending movements (invoices and receipts with a balance) for a specific client.
 * @param clienteId The ID of the client.
 * @returns A promise that resolves to an object with pending invoices and receipts.
 */
export async function getMovimientosPendientesPorCliente(clienteId: string): Promise<{ facturas: MovimientoWithId[], recibos: MovimientoWithId[] }> {
    if (!clienteId) {
        return { facturas: [], recibos: [] };
    }
    const movimientosCliente = await getMovimientosPorCliente(clienteId);

    const facturasPendientes = movimientosCliente
        .filter(mov => mov.comprobante === 'FC' && (mov.importe - mov.aplicacion) > 0.01)
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    const recibosPendientes = movimientosCliente
        .filter(mov => mov.comprobante === 'RE' && (mov.importe - mov.aplicacion) > 0.01)
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    return {
        facturas: facturasPendientes,
        recibos: recibosPendientes
    };
}


/**
 * Gets a list of unique client IDs who had movements in a given month and year.
 */
export async function getClientesConMovimientosEnPeriodo(year: number, month: number): Promise<string[]> {
  const db = getClientDb();
  if (!db) throw new Error("Firestore is not initialized");
  const movimientosCollection = collection(db, "movimientos");
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const snapshot = await getDocs(movimientosCollection);
  
  const allMovements = snapshot.docs.map(doc => doc.data() as Movimiento);

  const clientIds = new Set<string>();

  allMovements.forEach(mov => {
    const movDate = new Date(mov.fecha);
    if (movDate >= startDate && movDate <= endDate) {
      clientIds.add(mov.clienteId);
    }
  });

  return Array.from(clientIds);
}

/**
 * Gets a list of unique client IDs with an outstanding balance up to a certain date.
 */
export async function getClientesConSaldoDeudor(fechaHasta: Date): Promise<ClienteWithId[]> {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");

    const clientesCollection = collection(db, "clientes");
    const clientesSnap = await getDocs(clientesCollection);
    const allClientes = clientesSnap.docs.map(doc => ({ ...doc.data() as Cliente, id: doc.id }));
    const clientesDeudores: ClienteWithId[] = [];

    for (const cliente of allClientes) {
        const movimientos = await getMovimientosPorCliente(cliente.id);
        const movimientosHastaFecha = movimientos.filter(m => new Date(m.fecha) <= fechaHasta);
        
        let saldo = 0;
        movimientosHastaFecha.forEach(m => {
            saldo += (m.comprobante === 'FC' ? m.importe : -m.importe);
        });

        if (saldo > 0.01) {
            clientesDeudores.push(cliente);
        }
    }

    return clientesDeudores;
}
