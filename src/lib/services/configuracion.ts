import { db } from "@/lib/firebase";
import type { ConfiguracionComprobantes } from "@/lib/types";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const CONFIGURACION_ID = "comprobantes";
const configuracionDocRef = doc(db, "configuracion", CONFIGURACION_ID);

export async function getConfiguracionComprobantes(): Promise<ConfiguracionComprobantes> {
    const docSnap = await getDoc(configuracionDocRef);

    if (docSnap.exists()) {
        return docSnap.data() as ConfiguracionComprobantes;
    } else {
        // If the document doesn't exist, create it with default values
        const defaultConfig: ConfiguracionComprobantes = { ultimoRecibo: 0, ultimoFactura: 0 };
        await setDoc(configuracionDocRef, defaultConfig);
        return defaultConfig;
    }
}

export async function updateConfiguracionComprobantes(data: Partial<ConfiguracionComprobantes>) {
    await updateDoc(configuracionDocRef, data);
}
