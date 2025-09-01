
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { type Empresa } from '@/lib/empresas';
import { getEmpresas, initializePrimaryFirebase } from '@/lib/services/empresas';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BotMessageSquare, Loader2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmpresasAdminDialog } from '@/components/dashboard/empresas-admin-dialog';
import { AdminPasswordDialog } from '@/components/dashboard/admin-password-dialog';


export default function CompanySelectorPage() {
  const [cuit, setCuit] = React.useState('');
  const [empresas, setEmpresas] = React.useState<Empresa[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = React.useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  
  // Initialize the primary connection and fetch companies
  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        initializePrimaryFirebase();
        const empresasData = await getEmpresas();
        setEmpresas(empresasData);
      } catch (error) {
        console.error("Error loading companies:", error);
        toast({
          title: "Error de Carga",
          description: "No se pudo conectar a la base de datos principal de empresas.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [toast]);
  
  const handleContinue = () => {
    setIsProcessing(true);
    if (!cuit) {
      toast({
        title: "Error",
        description: "Por favor, ingrese un CUIT para continuar.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    const empresa = empresas.find(e => e.cuit === cuit);
    if (empresa) {
      localStorage.setItem('selectedFirebaseConfig', JSON.stringify(empresa.firebaseConfig));
      localStorage.setItem('selectedEmpresaNombre', empresa.nombre);
      localStorage.setItem('selectedEmpresaCuit', empresa.cuit);
      router.push('/login');
    } else {
       toast({
        title: "CUIT no encontrado",
        description: "No se encontró ninguna empresa con el CUIT ingresado. Verifique el número e intente de nuevo.",
        variant: "destructive",
      });
       setIsProcessing(false);
    }
  };
   
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleContinue();
    }
  }
  
  const onAdminDialogClose = async () => {
      setIsAdminDialogOpen(false);
      // Refresh the list of companies
      setIsLoading(true);
      const empresasData = await getEmpresas();
      setEmpresas(empresasData.sort((a,b) => a.nombre.localeCompare(b.nombre)));
      setIsLoading(false);
  }

  const handlePasswordSuccess = () => {
    setIsPasswordDialogOpen(false);
    setIsAdminDialogOpen(true);
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-lg relative">
        <div className="absolute top-2 right-2">
            <Button variant="ghost" size="icon" onClick={() => setIsPasswordDialogOpen(true)}>
                <Settings className="h-5 w-5" />
            </Button>
        </div>
        <CardHeader className="text-center pt-12">
          <div className="flex justify-center mb-2">
            <BotMessageSquare className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            Bienvenido al Sistema de Gestión de Oficinas Contables y Jurídicas
          </CardTitle>
          <CardDescription>Ingrese el CUIT de la oficina con la que desea trabajar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           {isLoading ? (
                <div className="flex justify-center items-center h-10">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : (
                <div className="space-y-2">
                    <Label htmlFor="cuit-input">CUIT</Label>
                    <Input 
                        id="cuit-input"
                        placeholder="Ingrese el número de CUIT sin guiones"
                        value={cuit}
                        onChange={(e) => setCuit(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isProcessing}
                        autoFocus
                    />
                </div>
            )}
          <Button onClick={handleContinue} className="w-full" disabled={!cuit || isLoading || isProcessing}>
             {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continuar
          </Button>
        </CardContent>
      </Card>
      
       {isPasswordDialogOpen && (
        <AdminPasswordDialog 
            isOpen={isPasswordDialogOpen}
            onOpenChange={setIsPasswordDialogOpen}
            onSuccess={handlePasswordSuccess}
        />
       )}

      {isAdminDialogOpen && (
          <EmpresasAdminDialog 
            isOpen={isAdminDialogOpen}
            onOpenChange={onAdminDialogClose}
          />
      )}
    </div>
  );
}
