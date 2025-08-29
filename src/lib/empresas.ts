// This file acts as a central registry for all companies (tenants) using the application.
// Each company has its own independent Firebase project configuration.

export type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
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
    nombre: "Oficina Laspiur",
    cuit: "20165475535",
    firebaseConfig: {
      apiKey: "AIzaSyBJTWFDM421pUDAjaR5c4wchlywO7Tu38E",
      authDomain: "oficina-72505.firebaseapp.com",
      projectId: "oficina-72505",
      storageBucket: "oficina-72505.appspot.com",
      messagingSenderId: "764425604004",
      appId: "1:764425604004:web:e2a3f3b4c5d6e7f8a9b0c1"
    }
};
