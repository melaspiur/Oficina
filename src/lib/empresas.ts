// This file acts as a central registry for all companies (tenants) using the application.
// Each company has its own independent Firebase project configuration.

export type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

export type Empresa = {
  nombre: string;
  cuit: string;
  firebaseConfig: FirebaseConfig;
};

export type EmpresaWithId = Empresa & { id: string };


// Configuration for the primary company, which holds the list of all other companies.
// This is the bootstrap configuration.
export const primaryEmpresaConfig: Empresa = {
    nombre: "Directorio de Oficinas",
    cuit: "00000000000", // CUIT for the central directory itself
    firebaseConfig: {
      apiKey: "AIzaSyCPiMgTcPgJJVCVc9UtUZ7C5U4ECIFkDI8",
      authDomain: "agromenu-ccb11.firebaseapp.com",
      projectId: "agromenu-ccb11",
      storageBucket: "agromenu-ccb11.appspot.com",
      messagingSenderId: "1058404932388",
      appId: "1:1058404932388:web:5f796a1d19ef455b3b31b1",
      measurementId: "G-V40ZLJL490"
    }
};