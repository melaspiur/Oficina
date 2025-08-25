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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Users,
  FileText,
  LineChart,
  Settings,
  BotMessageSquare,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';

// Vistas dinámicas
const PlaceholderView = ({ title }: { title: string }) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold">{title}</h2>
    <p>Contenido para {title} irá aquí.</p>
  </div>
);

export function MainLayout() {
  const [activeView, setActiveView] = React.useState('clientes');
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
      case 'clientes':
        return <PlaceholderView title="Clientes" />;
      case 'facturacion':
        return <PlaceholderView title="Facturación" />;
      case 'informes':
        return <PlaceholderView title="Informes" />;
      case 'ajustes':
        return <PlaceholderView title="Ajustes" />;
      default:
        return <PlaceholderView title="Clientes" />;
    }
  };

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
              <SidebarMenuButton onClick={() => setActiveView('clientes')} isActive={activeView === 'clientes'} tooltip="Clientes">
                <Users />
                <span>Clientes</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('facturacion')} isActive={activeView === 'facturacion'} tooltip="Facturación">
                <FileText />
                <span>Facturación</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('informes')} isActive={activeView === 'informes'} tooltip="Informes">
                <LineChart />
                <span>Informes</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('ajustes')} isActive={activeView === 'ajustes'} tooltip="Ajustes">
                <Settings />
                <span>Ajustes</span>
              </SidebarMenuButton>
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
          <h1 className="text-xl font-semibold font-headline capitalize">{activeView}</h1>
          <SidebarTrigger />
        </header>
        <main className="flex-1 overflow-y-auto bg-background/95">
          {renderContent()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
