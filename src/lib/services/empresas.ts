import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, type Firestore } from "firebase/firestore";
import { primaryEmpresaConfig, type Empresa, type EmpresaWithId, type FirebaseConfig } from "@/lib/empresas";

let primaryDb: Firestore | null = null;
const PRIMARY_APP_NAME = "primary-admin-app";
const EMPRESAS_COLLECTION = "empresas";

/**
 * Initializes a connection to the primary Firebase project (Oficina Laspiur)
 * which is used to manage the list of all companies.
 */
export function initializePrimaryFirebase() {
    if (primaryDb) return;

    const existingApp = getApps().find(app => app.name === PRIMARY_APP_NAME);
    let app: FirebaseApp;

    if (existingApp) {
        app = existingApp;
    } else {
        app = initializeApp(primaryEmpresaConfig.firebaseConfig, PRIMARY_APP_NAME);
    }
    
    primaryDb = getFirestore(app);
}

/**
 * Ensures the primary Firestore instance is available.
 */
function getPrimaryDb(): Firestore {
    if (!primaryDb) {
        initializePrimaryFirebase();
    }
    if (!primaryDb) {
        throw new Error("Primary Firestore database is not initialized.");
    }
    return primaryDb;
}


export async function getEmpresas(): Promise<EmpresaWithId[]> {
    const db = getPrimaryDb();
    const empresasCollection = collection(db, EMPRESAS_COLLECTION);
    const snapshot = await getDocs(empresasCollection);
    return snapshot.docs.map(doc => ({ ...doc.data() as Empresa, id: doc.id }));
}

export async function addEmpresa(empresa: Empresa): Promise<string> {
    const db = getPrimaryDb();
    const empresasCollection = collection(db, EMPRESAS_COLLECTION);
    const docRef = await addDoc(empresasCollection, empresa);
    return docRef.id;
}

export async function updateEmpresa(id: string, empresa: Partial<Empresa>): Promise<void> {
    const db = getPrimaryDb();
    const empresaDoc = doc(db, EMPRESAS_COLLECTION, id);
    await updateDoc(empresaDoc, empresa);
}

export async function deleteEmpresa(id: string): Promise<void> {
    const db = getPrimaryDb();
    const empresaDoc = doc(db, EMPRESAS_COLLECTION, id);
    await deleteDoc(empresaDoc);
}
