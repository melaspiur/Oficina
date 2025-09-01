
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { type Empresa } from '@/lib/empresas';
import { getEmpresas, initializePrimaryFirebase } from '@/lib/services/empresas';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { BotMessageSquare, Loader2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmpresasAdminDialog } from '@/components/dashboard/empresas-admin-dialog';
import { AdminPasswordDialog } from '@/components/dashboard/admin-password-dialog';


export default function CompanySelectorPage() {
  const [selectedCuit, setSelectedCuit] = React.useState<string | null>(null);
  const [empresas, setEmpresas] = React.useState<Empresa[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
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
        setEmpresas(empresasData.sort((a,b) => a.nombre.localeCompare(b.nombre)));
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
  
  const empresaOptions = React.useMemo(() => {
    return empresas.map(e => ({ value: e.cuit, label: `${e.nombre} - CUIT: ${e.cuit}` }));
  }, [empresas]);

  const handleSelectEmpresa = (cuit: string) => {
    setSelectedCuit(cuit);
  };

  const handleContinue = () => {
    if (!selectedCuit) {
      toast({
        title: "Error",
        description: "Por favor, seleccione una empresa para continuar.",
        variant: "destructive",
      });
      return;
    }

    const empresa = empresas.find(e => e.cuit === selectedCuit);
    if (empresa) {
      localStorage.setItem('selectedFirebaseConfig', JSON.stringify(empresa.firebaseConfig));
      localStorage.setItem('selectedEmpresaNombre', empresa.nombre);
      localStorage.setItem('selectedEmpresaCuit', empresa.cuit);
      router.push('/login');
    } else {
       toast({
        title: "Error",
        description: "La configuración de la empresa seleccionada no se encontró.",
        variant: "destructive",
      });
    }
  };
  
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
            Bienvenido al Sistema de Gestión
          </CardTitle>
          <CardDescription>Seleccione la oficina con la que desea trabajar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           {isLoading ? (
                <div className="flex justify-center items-center h-10">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : (
                <Combobox 
                    options={empresaOptions}
                    value={selectedCuit}
                    onValueChange={handleSelectEmpresa}
                    placeholder="Seleccione una empresa..."
                    searchPlaceholder="Buscar por nombre o CUIT..."
                    notFoundMessage="No se encontraron empresas."
                />
            )}
          <Button onClick={handleContinue} className="w-full" disabled={!selectedCuit || isLoading}>
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
