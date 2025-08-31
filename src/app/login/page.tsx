
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirebaseClient } from '@/lib/firebase';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BotMessageSquare, Loader2 } from 'lucide-react';
import type { FirebaseConfig } from '@/lib/empresas';
import { LoginCredentialsAlert } from '@/components/dashboard/login-credentials-alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const router = useRouter();

  // This effect runs on component mount to initialize Firebase for the selected company
  useEffect(() => {
    const configStr = localStorage.getItem('selectedFirebaseConfig');
    const nombre = localStorage.getItem('selectedEmpresaNombre');
    const cuit = localStorage.getItem('selectedEmpresaCuit');


    if (!configStr || !nombre) {
      // If no company is selected, redirect to the company selection page
      router.replace('/');
    } else {
      try {
        const config: FirebaseConfig = JSON.parse(configStr);
        initializeFirebaseClient(config);
        setEmpresaNombre(nombre);
        
        // Pre-fill login credentials for the specific test company
        if (cuit === '20222222223') {
            setEmail('martin@laspiur.com.ar');
            setPassword('222222');
            setShowCredentials(true);
        }

        setIsLoading(false);
      } catch (e) {
        console.error("Failed to parse Firebase config or initialize app:", e);
        setError("Error al cargar la configuración de la empresa.");
        router.replace('/');
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // We need to re-initialize the auth instance from the client-side config
    const configStr = localStorage.getItem('selectedFirebaseConfig');
    if (!configStr) {
      setError("No se encontró la configuración de la empresa. Por favor, vuelva a seleccionarla.");
      return;
    }
    const config = JSON.parse(configStr);
    const { auth } = initializeFirebaseClient(config);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      let friendlyError = "Ocurrió un error. Por favor, revise sus credenciales.";
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        friendlyError = 'El correo electrónico o la contraseña son incorrectos.';
      }
       if (err.code === 'auth/invalid-email') {
        friendlyError = 'El formato del correo electrónico no es válido.';
      }
      setError(friendlyError);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <BotMessageSquare className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">{empresaNombre}</CardTitle>
          <CardDescription>Ingresa tus credenciales para continuar</CardDescription>
        </CardHeader>
        <CardContent>
           {showCredentials && (
            <LoginCredentialsAlert 
              email="martin@laspiur.com.ar"
              password="222222"
            />
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">Iniciar Sesión</Button>
            <Button variant="link" size="sm" className="w-full" onClick={() => router.push('/')}>Cambiar de empresa</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
