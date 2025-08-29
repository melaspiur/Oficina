"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { empresas, type Empresa } from '@/lib/empresas';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { BotMessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CompanySelectorPage() {
  const [selectedCuit, setSelectedCuit] = React.useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const empresaOptions = React.useMemo(() => {
    return empresas.map(e => ({ value: e.cuit, label: `${e.nombre} - CUIT: ${e.cuit}` }));
  }, []);

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
      // Store the selected company's config in localStorage to be picked up by the login page
      localStorage.setItem('selectedFirebaseConfig', JSON.stringify(empresa.firebaseConfig));
      localStorage.setItem('selectedEmpresaNombre', empresa.nombre);
      router.push('/login');
    } else {
       toast({
        title: "Error",
        description: "La configuración de la empresa seleccionada no se encontró.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <BotMessageSquare className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Bienvenido al Sistema de Gestión</CardTitle>
          <CardDescription>Seleccione la oficina con la que desea trabajar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <Combobox 
                options={empresaOptions}
                value={selectedCuit}
                onValueChange={handleSelectEmpresa}
                placeholder="Seleccione una empresa..."
                searchPlaceholder="Buscar por nombre o CUIT..."
                notFoundMessage="No se encontraron empresas."
            />
          <Button onClick={handleContinue} className="w-full" disabled={!selectedCuit}>
            Continuar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
