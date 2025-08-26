import { db } from "@/lib/firebase";
import type { ConfiguracionComprobantes } from "@/lib/types";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const CONFIGURACION_ID = "comprobantes";
const configuracionDocRef = doc(db, "configuracion", CONFIGURACION_ID);

export async function getConfiguracionComprobantes(): Promise<ConfiguracionComprobantes> {
    const docSnap = await getDoc(configuracionDocRef);

    if (docSnap.exists()) {
        const data = docSnap.data() as ConfiguracionComprobantes;
        // Ensure default for new fields if they don't exist
        return {
            ultimoRecibo: 0,
            ultimoFactura: 0,
            ultimoMesEventual: "",
            ...data
        };
    } else {
        // If the document doesn't exist, create it with default values
        const defaultConfig: ConfiguracionComprobantes = { ultimoRecibo: 0, ultimoFactura: 0, ultimoMesEventual: "" };
        await setDoc(configuracionDocRef, defaultConfig);
        return defaultConfig;
    }
}

export async function updateConfiguracionComprobantes(data: Partial<ConfiguracionComprobantes>) {
    await setDoc(configuracionDocRef, data, { merge: true });
}
