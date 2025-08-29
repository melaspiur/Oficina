
"use client";

import * as React from 'react';
import Image from 'next/image';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Users,
  FileText,
  LineChart,
  Settings,
  BotMessageSquare,
  LogOut,
  ChevronDown,
  Newspaper,
  User,
  ClipboardSignature,
  FileKey,
  DollarSign,
  Calendar,
  Contact,
  Landmark,
  Wallet,
  Pencil,
  CheckSquare,
  FilePlus,
  FileArchive,
  KeyRound,
  Loader2,
  Undo2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { getAuth, signOut, onAuthStateChanged, type Auth } from 'firebase/auth';
import { initializeFirebaseClient, getClientAuth, getClientDb } from '@/lib/firebase';
import { ClientesView } from '@/components/dashboard/clientes-view';
import { NovedadesView } from './novedades-view';
import { FacturacionView } from './facturacion-view';
import { AsignacionView } from './asignacion-view';
import { ReciboView } from './recibo-view';
import { ComprobantesView } from './comprobantes-view';
import { InformeFacturacionMensualView } from './informe-facturacion-mensual-view';
import { InformeFacturacionClienteView } from './informe-facturacion-cliente-view';
import { ModificarReciboView } from './modificar-recibo-view';
import { AplicarReciboView } from './aplicar-recibo-view';
import { InformeCobranzasMensualView } from './informe-cobranzas-mensual-view';
import { InformeCobranzasClienteView } from './informe-cobranzas-cliente-view';
import { InformeCuentaCorrienteView } from './informe-cuenta-corriente-view';
import { InformeResumenesPdfView } from './informe-resumenes-pdf-view';
import { ChangePasswordDialog } from './change-password-dialog';
import { DesaplicarReciboView } from './desaplicar-recibo-view';
import { ModificarFacturaView } from './modificar-factura-view';
import type { FirebaseConfig } from '@/lib/empresas';

export function MainLayout() {
  const [activeView, setActiveView] = React.useState('home');
  const [isClientesOpen, setIsClientesOpen] = React.useState(false);
  const [isFacturacionOpen, setIsFacturacionOpen] = React.useState(false);
  const [isCobranzasOpen, setIsCobranzasOpen] = React.useState(false);
  const [isAjustesOpen, setIsAjustesOpen] = React.useState(false);
  const [isInformesOpen, setIsInformesOpen] = React.useState(false);
  const [isFacturacionInformeOpen, setIsFacturacionInformeOpen] = React.useState(false);
  const [isCobranzasInformeOpen, setIsCobranzasInformeOpen] = React.useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);
  const [authInstance, setAuthInstance] = React.useState<Auth | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    const configStr = localStorage.getItem('selectedFirebaseConfig');
    if (!configStr) {
      router.replace('/');
      return;
    }
    
    try {
        const config: FirebaseConfig = JSON.parse(configStr);
        const { auth } = initializeFirebaseClient(config);
        setAuthInstance(auth);

        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (!user) {
            router.replace('/login');
          } else {
            setIsLoadingAuth(false);
          }
        });
        
        return () => unsubscribe();
    } catch(e) {
        console.error("Failed to initialize Firebase in layout", e);
        router.replace('/');
    }
  }, [router]);

  const handleLogout = async () => {
    if (!authInstance) return;
    try {
      await signOut(authInstance);
      localStorage.removeItem('selectedFirebaseConfig');
      localStorage.removeItem('selectedEmpresaNombre');
      router.push('/');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleGoHome = () => {
    setActiveView('home');
    setIsClientesOpen(false);
    setIsFacturacionOpen(false);
    setIsCobranzasOpen(false);
    setIsAjustesOpen(false);
    setIsInformesOpen(false);
    setIsFacturacionInformeOpen(false);
    setIsCobranzasInformeOpen(false);
  }

  if (isLoadingAuth || !authInstance) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return (
          <div className="w-full h-full flex items-center justify-center p-6">
            <div className="relative w-full h-full max-w-5xl aspect-video rounded-lg overflow-hidden shadow-2xl">
                 <Image 
                    src="https://picsum.photos/1200/800" 
                    alt="Escritorio profesional" 
                    fill
                    style={{ objectFit: 'cover' }}
                    data-ai-hint="professional desk"
                    priority
                  />
            </div>
          </div>
        );
      case 'clientes-cliente':
        return <ClientesView />;
      case 'clientes-novedades':
        return <NovedadesView />;
      case 'clientes-asignaciones':
        return <AsignacionView />;
      case 'facturacion-generar':
        return <FacturacionView />;
      case 'facturacion-modificar':
        return <ModificarFacturaView />;
      case 'cobranzas-generar-recibo':
        return <ReciboView />;
      case 'cobranzas-modificar-recibo':
        return <ModificarReciboView />;
      case 'cobranzas-aplicar-recibo':
        return <AplicarReciboView />;
      case 'cobranzas-desaplicar-recibo':
        return <DesaplicarReciboView />;
      case 'ajustes-comprobantes':
        return <ComprobantesView />;
      case 'informes-facturacion-mensual':
        return <InformeFacturacionMensualView />;
      case 'informes-facturacion-cliente':
        return <InformeFacturacionClienteView />;
      case 'informes-cobranzas-mensual':
        return <InformeCobranzasMensualView />;
      case 'informes-cobranzas-cliente':
        return <InformeCobranzasClienteView />;
      case 'informes-cuenta-corriente':
        return <InformeCuentaCorrienteView />;
      case 'informes-resumenes-pdf':
        return <InformeResumenesPdfView />;
      default:
        return <ClientesView />;
    }
  };

  const getHeaderTitle = () => {
     if (activeView === 'home') {
        return "Inicio";
    }
    if (activeView.startsWith('clientes-')) {
      const title = activeView.split('-')[1];
       if (activeView === 'clientes-asignaciones') return "Asignaciones";
      return title.charAt(0).toUpperCase() + title.slice(1);
    }
     if (activeView.startsWith('facturacion-')) {
        if (activeView === 'facturacion-generar') return "Generar Facturación";
        if (activeView === 'facturacion-modificar') return "Modificar Factura";
     }
      if (activeView.startsWith('ajustes-')) {
        const title = activeView.split('-')[1];
        if (activeView === 'ajustes-comprobantes') return "Comprobantes";
     }
      if (activeView.startsWith('informes-')) {
        if (activeView === 'informes-facturacion-mensual') return "Informe de Facturación Mensual";
        if (activeView === 'informes-facturacion-cliente') return "Informe de Facturación por Cliente";
        if (activeView === 'informes-cobranzas-mensual') return "Informe de Cobranzas Mensual";
        if (activeView === 'informes-cobranzas-cliente') return "Informe de Cobranzas por Cliente";
        if (activeView === 'informes-cuenta-corriente') return "Cuenta Corriente";
        if (activeView === 'informes-resumenes-pdf') return "Resúmenes PDF";
     }
     if (activeView.startsWith('cobranzas-')) {
        if (activeView === 'cobranzas-generar-recibo') return "Generar Recibo";
        if (activeView === 'cobranzas-modificar-recibo') return "Modificar Recibo";
        if (activeView === 'cobranzas-aplicar-recibo') return "Aplicar Recibo";
        if (activeView === 'cobranzas-desaplicar-recibo') return "Desaplicar Recibo";
     }
     const viewName = activeView.charAt(0).toUpperCase() + activeView.slice(1);
     return viewName;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Button variant="ghost" className="h-auto p-0 justify-start" onClick={handleGoHome}>
            <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-9 w-9">
                    <BotMessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight font-headline">
                  Oficina Virtual
                </h2>
            </div>
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setIsClientesOpen(!isClientesOpen)}
                isActive={activeView.startsWith('clientes-')}
                tooltip="Clientes"
              >
                <Users />
                <span>Clientes</span>
                 <ChevronDown
                  className={`ml-auto h-5 w-5 transform transition-transform duration-200 ${
                    isClientesOpen ? 'rotate-180' : ''
                  }`}
                />
              </SidebarMenuButton>
              {isClientesOpen && (
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton 
                      onClick={() => setActiveView('clientes-cliente')} 
                      isActive={activeView === 'clientes-cliente'}>
                      <User/>
                      <span>Cliente</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton 
                      onClick={() => setActiveView('clientes-novedades')} 
                      isActive={activeView === 'clientes-novedades'}>
                      <Newspaper />
                      <span>Novedades</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                   <SidebarMenuSubItem>
                    <SidebarMenuSubButton 
                      onClick={() => setActiveView('clientes-asignaciones')} 
                      isActive={activeView === 'clientes-asignaciones'}>
                      <ClipboardSignature />
                      <span>Asignaciones</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setIsFacturacionOpen(!isFacturacionOpen)}
                isActive={activeView.startsWith('facturacion-')}
                tooltip="Facturación"
              >
                <FileText />
                <span>Facturación</span>
                <ChevronDown
                  className={`ml-auto h-5 w-5 transform transition-transform duration-200 ${
                    isFacturacionOpen ? 'rotate-180' : ''
                  }`}
                />
              </SidebarMenuButton>
              {isFacturacionOpen && (
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton 
                      onClick={() => setActiveView('facturacion-generar')} 
                      isActive={activeView === 'facturacion-generar'}>
                      <FilePlus />
                      <span>Generar Facturación</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton 
                      onClick={() => setActiveView('facturacion-modificar')} 
                      isActive={activeView === 'facturacion-modificar'}>
                      <Pencil />
                      <span>Modificar Factura</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => setIsCobranzasOpen(!isCobranzasOpen)} 
                isActive={activeView.startsWith('cobranzas-')}
                tooltip="Cobranzas">
                <DollarSign />
                <span>Cobranzas</span>
                <ChevronDown
                  className={`ml-auto h-5 w-5 transform transition-transform duration-200 ${
                    isCobranzasOpen ? 'rotate-180' : ''
                  }`}
                />
              </SidebarMenuButton>
              {isCobranzasOpen && (
                 <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={() => setActiveView('cobranzas-generar-recibo')} 
                        isActive={activeView === 'cobranzas-generar-recibo'}>
                        <FilePlus />
                        <span>Generar Recibo</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={() => setActiveView('cobranzas-modificar-recibo')} 
                        isActive={activeView === 'cobranzas-modificar-recibo'}>
                        <Pencil />
                        <span>Modificar Recibo</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={() => setActiveView('cobranzas-aplicar-recibo')} 
                        isActive={activeView === 'cobranzas-aplicar-recibo'}>
                        <CheckSquare />
                        <span>Aplicar Recibo</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={() => setActiveView('cobranzas-desaplicar-recibo')} 
                        isActive={activeView === 'cobranzas-desaplicar-recibo'}>
                        <Undo2 />
                        <span>Desaplicar Recibo</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                 </SidebarMenuSub>
              )}
            </SidebarMenuItem>
            <SidebarMenuItem>
                 <SidebarMenuButton
                    onClick={() => setIsInformesOpen(!isInformesOpen)}
                    isActive={activeView.startsWith('informes-')}
                    tooltip="Informes"
                >
                    <LineChart />
                    <span>Informes</span>
                    <ChevronDown
                    className={`ml-auto h-5 w-5 transform transition-transform duration-200 ${
                        isInformesOpen ? 'rotate-180' : ''
                    }`}
                    />
              </SidebarMenuButton>
               {isInformesOpen && (
                <SidebarMenuSub>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => setIsFacturacionInformeOpen(!isFacturacionInformeOpen)}
                            isActive={activeView.startsWith('informes-facturacion')}
                            className="h-8"
                        >
                            <FileText />
                            <span>Facturación</span>
                             <ChevronDown
                                className={`ml-auto h-5 w-5 transform transition-transform duration-200 ${
                                    isFacturacionInformeOpen ? 'rotate-180' : ''
                                }`}
                            />
                        </SidebarMenuButton>
                        {isFacturacionInformeOpen && (
                             <SidebarMenuSub>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton 
                                    onClick={() => setActiveView('informes-facturacion-mensual')} 
                                    isActive={activeView === 'informes-facturacion-mensual'}>
                                        <Calendar />
                                        <span>Mensual</span>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton 
                                    onClick={() => setActiveView('informes-facturacion-cliente')} 
                                    isActive={activeView === 'informes-facturacion-cliente'}>
                                        <Contact />
                                        <span>Cliente</span>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        )}
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => setIsCobranzasInformeOpen(!isCobranzasInformeOpen)}
                            isActive={activeView.startsWith('informes-cobranzas')}
                            className="h-8"
                        >
                            <Wallet />
                            <span>Cobranzas</span>
                             <ChevronDown
                                className={`ml-auto h-5 w-5 transform transition-transform duration-200 ${
                                    isCobranzasInformeOpen ? 'rotate-180' : ''
                                }`}
                            />
                        </SidebarMenuButton>
                        {isCobranzasInformeOpen && (
                             <SidebarMenuSub>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton 
                                    onClick={() => setActiveView('informes-cobranzas-mensual')} 
                                    isActive={activeView === 'informes-cobranzas-mensual'}>
                                        <Calendar />
                                        <span>Mensual</span>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton 
                                    onClick={() => setActiveView('informes-cobranzas-cliente')} 
                                    isActive={activeView === 'informes-cobranzas-cliente'}>
                                        <Contact />
                                        <span>Cliente</span>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        )}
                    </SidebarMenuItem>
                     <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                        onClick={() => setActiveView('informes-cuenta-corriente')} 
                        isActive={activeView === 'informes-cuenta-corriente'}>
                        <Landmark />
                        <span>Cuenta Corriente</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                        onClick={() => setActiveView('informes-resumenes-pdf')} 
                        isActive={activeView === 'informes-resumenes-pdf'}>
                        <FileArchive />
                        <span>Resúmenes PDF</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton
                    onClick={() => setIsAjustesOpen(!isAjustesOpen)}
                    isActive={activeView.startsWith('ajustes-')}
                    tooltip="Ajustes"
                >
                    <Settings />
                    <span>Ajustes</span>
                    <ChevronDown
                    className={`ml-auto h-5 w-5 transform transition-transform duration-200 ${
                        isAjustesOpen ? 'rotate-180' : ''
                    }`}
                    />
              </SidebarMenuButton>
               {isAjustesOpen && (
                <SidebarMenuSub>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                        onClick={() => setActiveView('ajustes-comprobantes')} 
                        isActive={activeView === 'ajustes-comprobantes'}>
                        <FileKey />
                        <span>Comprobantes</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start h-auto px-2 py-1.5">
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={authInstance.currentUser?.photoURL || 'https://placehold.co/100x100'} alt="User Avatar" />
                      <AvatarFallback>{authInstance.currentUser?.email?.substring(0,2).toUpperCase() || 'AV'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium">{authInstance.currentUser?.displayName || 'Usuario'}</span>
                      <span className="text-xs text-muted-foreground">
                        {authInstance.currentUser?.email}
                      </span>
                    </div>
                  </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] mb-2">
              <DropdownMenuItem onClick={() => setIsChangePasswordOpen(true)}>
                <KeyRound className="mr-2 h-4 w-4" />
                <span>Cambiar Contraseña</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <h1 className="text-xl font-semibold font-headline capitalize">{getHeaderTitle()}</h1>
          <SidebarTrigger />
        </header>
        <main className="flex-1 overflow-y-auto bg-background/95">
          {renderContent()}
        </main>
      </SidebarInset>
      <ChangePasswordDialog isOpen={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
    </SidebarProvider>
  );
}
