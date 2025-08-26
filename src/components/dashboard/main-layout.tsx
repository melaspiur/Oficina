
"use client";

import * as React from 'react';
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
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { ClientesView } from '@/components/dashboard/clientes-view';
import { NovedadesView } from './novedades-view';
import { FacturacionView } from './facturacion-view';
import { AsignacionView } from './asignacion-view';
import { ReciboView } from './recibo-view';
import { ComprobantesView } from './comprobantes-view';
import { InformeFacturacionMensualView } from './informe-facturacion-mensual-view';
import { InformeFacturacionClienteView } from './informe-facturacion-cliente-view';


// Vistas dinámicas
const PlaceholderView = ({ title }: { title: string }) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold">{title}</h2>
    <p>Contenido para {title} irá aquí.</p>
  </div>
);

export function MainLayout() {
  const [activeView, setActiveView] = React.useState('clientes-cliente');
  const [isClientesOpen, setIsClientesOpen] = React.useState(true);
  const [isFacturacionOpen, setIsFacturacionOpen] = React.useState(false);
  const [isCobranzasOpen, setIsCobranzasOpen] = React.useState(false);
  const [isAjustesOpen, setIsAjustesOpen] = React.useState(false);
  const [isInformesOpen, setIsInformesOpen] = React.useState(false);
  const [isFacturacionInformeOpen, setIsFacturacionInformeOpen] = React.useState(false);
  const router = useRouter();
  const auth = getAuth(app);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'clientes-cliente':
        return <ClientesView />;
      case 'clientes-novedades':
        return <NovedadesView />;
      case 'clientes-asignaciones':
        return <AsignacionView />;
      case 'facturacion':
        return <FacturacionView />;
      case 'cobranzas-generar-recibo':
        return <ReciboView />;
      case 'cobranzas-modificar-recibo':
        return <PlaceholderView title="Modificar Recibo" />;
      case 'cobranzas-aplicar-recibo':
        return <PlaceholderView title="Aplicar Recibo" />;
      case 'ajustes-comprobantes':
        return <ComprobantesView />;
      case 'informes-facturacion-mensual':
        return <InformeFacturacionMensualView />;
      case 'informes-facturacion-cliente':
        return <InformeFacturacionClienteView />;
      case 'informes-cobranzas':
        return <PlaceholderView title="Informe de Cobranzas" />;
      case 'informes-cuenta-corriente':
        return <PlaceholderView title="Informe de Cuenta Corriente" />;
      default:
        return <ClientesView />;
    }
  };

  const getHeaderTitle = () => {
    if (activeView.startsWith('clientes-')) {
      const title = activeView.split('-')[1];
       if (activeView === 'clientes-asignaciones') return "Asignaciones";
      return title.charAt(0).toUpperCase() + title.slice(1);
    }
     if (activeView === 'facturacion') {
        return "Facturación";
     }
      if (activeView.startsWith('ajustes-')) {
        const title = activeView.split('-')[1];
        if (activeView === 'ajustes-comprobantes') return "Comprobantes";
     }
      if (activeView.startsWith('informes-')) {
        if (activeView === 'informes-facturacion-mensual') return "Informe de Facturación Mensual";
        if (activeView === 'informes-facturacion-cliente') return "Informe de Facturación por Cliente";
        if (activeView === 'informes-cobranzas') return "Informe de Cobranzas";
        if (activeView === 'informes-cuenta-corriente') return "Cuenta Corriente";
     }
     if (activeView.startsWith('cobranzas-')) {
        if (activeView === 'cobranzas-generar-recibo') return "Generar Recibo";
        if (activeView === 'cobranzas-modificar-recibo') return "Modificar Recibo";
        if (activeView === 'cobranzas-aplicar-recibo') return "Aplicar Recibo";
     }
     const viewName = activeView.charAt(0).toUpperCase() + activeView.slice(1);
     return viewName;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <BotMessageSquare className="h-6 w-6 text-primary" />
            </Button>
            <h2 className="text-lg font-semibold tracking-tight font-headline">
              Oficina Virtual
            </h2>
          </div>
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
                    onClick={() => setActiveView('facturacion')}
                    isActive={activeView === 'facturacion'}
                    tooltip="Facturación"
                >
                    <FileText />
                    <span>Facturación</span>
              </SidebarMenuButton>
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
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                        onClick={() => setActiveView('informes-cobranzas')} 
                        isActive={activeView === 'informes-cobranzas'}>
                        <Wallet />
                        <span>Cobranzas</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                        onClick={() => setActiveView('informes-cuenta-corriente')} 
                        isActive={activeView === 'informes-cuenta-corriente'}>
                        <Landmark />
                        <span>Cuenta Corriente</span>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={auth.currentUser?.photoURL || 'https://placehold.co/100x100'} alt="User Avatar" />
                <AvatarFallback>{auth.currentUser?.email?.substring(0,2).toUpperCase() || 'AV'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{auth.currentUser?.displayName || 'Usuario'}</span>
                <span className="text-xs text-muted-foreground">
                  {auth.currentUser?.email}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9" tooltip="Cerrar Sesión">
              <LogOut />
            </Button>
          </div>
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
    </SidebarProvider>
  );
}
