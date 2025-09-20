import { getClientApp } from "@/lib/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Uploads a file to Firebase Storage and returns its public URL.
 * @param file The file Blob to upload.
 * @param path The full path in storage where the file will be saved (e.g., 'resumenes/cliente-123.pdf').
 * @returns A promise that resolves to the public download URL of the file.
 */
export async function uploadFile(file: Blob, path: string): Promise<string> {
    const app = getClientApp();
    if (!app) throw new Error("Firebase App is not initialized");

    try {
        const storage = getStorage(app);
        const storageRef = ref(storage, path);
        
        const snapshot = await uploadBytes(storageRef, file, {
             contentType: 'application/pdf',
             cacheControl: 'public,max-age=31536000', // Cache for 1 year
        });
        
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file to Firebase Storage:", error);
        throw new Error("No se pudo subir el archivo a Firebase Storage.");
    }
}
