
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
  ClipboardList,
  Upload,
  UserCheck,
  FileClock,
  FileKey,
  DollarSign,
  BookUser,
  CalendarClock,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { ClientesView } from '@/components/dashboard/clientes-view';
import { NovedadesView } from './novedades-view';
import { FacturacionMensualView } from './facturacion-mensual-view';
import { AsignacionIndividualView } from './asignacion-individual-view';
import { AsignacionClienteView } from './asignacion-cliente-view';
import { ImportacionView } from './importacion-view';
import { ComprobantesView } from './comprobantes-view';

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
  const [isAjustesOpen, setIsAjustesOpen] = React.useState(false);
  const [isInformesOpen, setIsInformesOpen] = React.useState(false);
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
      case 'clientes-asignacion-individual':
        return <AsignacionIndividualView />;
       case 'clientes-asignacion-cliente':
        return <AsignacionClienteView />;
      case 'facturacion-mensual':
        return <FacturacionMensualView />;
      case 'facturacion-eventual':
        return <PlaceholderView title="Factura Eventual" />;
      case 'cobranza':
        return <ImportacionView />;
      case 'ajustes-comprobantes':
        return <ComprobantesView />;
      case 'informes-mensual':
        return <PlaceholderView title="Informe de Facturación Mensual" />;
      case 'informes-cliente':
        return <PlaceholderView title="Informe de Facturación por Cliente" />;
      default:
        return <ClientesView />;
    }
  };

  const getHeaderTitle = () => {
    if (activeView.startsWith('clientes-')) {
      const title = activeView.split('-')[1];
      if (activeView === 'clientes-asignacion-individual') return "Asignación Individual";
      if (activeView === 'clientes-asignacion-cliente') return "Asignación por Cliente";
      return title.charAt(0).toUpperCase() + title.slice(1);
    }
     if (activeView.startsWith('facturacion-')) {
        const title = activeView.split('-')[1];
        if (activeView === 'facturacion-mensual') return "Factura Mensual";
        if (activeView === 'facturacion-eventual') return "Factura Eventual";
     }
      if (activeView.startsWith('ajustes-')) {
        const title = activeView.split('-')[1];
        if (activeView === 'ajustes-comprobantes') return "Comprobantes";
     }
      if (activeView.startsWith('informes-')) {
        const title = activeView.split('-')[1];
        if (activeView === 'informes-mensual') return "Informe Mensual";
        if (activeView === 'informes-cliente') return "Informe por Cliente";
     }
     if (activeView === 'cobranza') {
      return "Cobranza";
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
                      onClick={() => setActiveView('clientes-asignacion-individual')} 
                      isActive={activeView === 'clientes-asignacion-individual'}>
                      <ClipboardList />
                      <span>Asig. Individual</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton 
                      onClick={() => setActiveView('clientes-asignacion-cliente')} 
                      isActive={activeView === 'clientes-asignacion-cliente'}>
                      <UserCheck />
                      <span>Asig. por Cliente</span>
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
                        onClick={() => setActiveView('facturacion-mensual')} 
                        isActive={activeView === 'facturacion-mensual'}>
                        <FileClock />
                        <span>Factura Mensual</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                        onClick={() => setActiveView('facturacion-eventual')} 
                        isActive={activeView === 'facturacion-eventual'}>
                        <FileText />
                        <span>Factura Eventual</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('cobranza')} isActive={activeView === 'cobranza'} tooltip="Cobranza">
                <DollarSign />
                <span>Cobranza</span>
              </SidebarMenuButton>
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
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                        onClick={() => setActiveView('informes-mensual')} 
                        isActive={activeView === 'informes-mensual'}>
                        <CalendarClock />
                        <span>Informe Mensual</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                        onClick={() => setActiveView('informes-cliente')} 
                        isActive={activeView === 'informes-cliente'}>
                        <BookUser />
                        <span>Informe por Cliente</span>
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
