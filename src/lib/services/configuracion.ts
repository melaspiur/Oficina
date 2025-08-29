import { getClientDb } from "@/lib/firebase";
import type { ConfiguracionComprobantes } from "@/lib/types";
import { doc, getDoc, setDoc } from "firebase/firestore";

const CONFIGURACION_ID = "comprobantes";

export async function getConfiguracionComprobantes(): Promise<ConfiguracionComprobantes> {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");

    const configuracionDocRef = doc(db, "configuracion", CONFIGURACION_ID);
    const docSnap = await getDoc(configuracionDocRef);

    if (docSnap.exists()) {
        const data = docSnap.data() as ConfiguracionComprobantes;
        return {
            ultimoRecibo: 0,
            ultimoFactura: 0,
            ultimoMesEventual: "",
            ...data
        };
    } else {
        const defaultConfig: ConfiguracionComprobantes = { ultimoRecibo: 0, ultimoFactura: 0, ultimoMesEventual: "" };
        await setDoc(configuracionDocRef, defaultConfig);
        return defaultConfig;
    }
}

export async function updateConfiguracionComprobantes(data: Partial<ConfiguracionComprobantes>) {
    const db = getClientDb();
    if (!db) throw new Error("Firestore is not initialized");
    const configuracionDocRef = doc(db, "configuracion", CONFIGURACION_ID);
    await setDoc(configuracionDocRef, data, { merge: true });
}
