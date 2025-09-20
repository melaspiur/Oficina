// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import type { FirebaseConfig } from "./empresas";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

/**
 * Initializes a Firebase app instance for a specific company configuration.
 * This allows the application to dynamically connect to different Firebase projects.
 *
 * @param {FirebaseConfig} config - The Firebase configuration object for the company.
 * @returns {{app: FirebaseApp, auth: Auth, db: Firestore}} - The initialized Firebase services.
 */
export function initializeFirebaseClient(config: FirebaseConfig): { app: FirebaseApp, auth: Auth, db: Firestore, storage: FirebaseStorage } {
  // Check if an app with this name already exists to avoid re-initialization
  // We use the projectId as a unique name for the app instance.
  const appName = config.projectId;
  const existingApp = getApps().find(app => app.name === appName);

  if (existingApp) {
    app = existingApp;
  } else {
    app = initializeApp(config, appName);
  }
  
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  return { app, auth, db, storage };
}

// These functions allow other parts of the app to get the current Firebase instance.
// They will return null if Firebase hasn't been initialized for a company yet.
export const getClientApp = () => app;
export const getClientAuth = () => auth;
export const getClientDb = () => db;
export const getClientStorage = () => storage;
