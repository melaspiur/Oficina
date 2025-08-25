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
  LayoutGrid,
  Calendar,
  Mail,
  Settings,
  BotMessageSquare,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TaskSuggestions } from './task-suggestions';
import { EmailDrafter } from './email-drafter';
import { CalendarView } from './calendar-view';
import { SettingsDialog } from './settings-dialog';

export function MainLayout() {
  const [activeView, setActiveView] = React.useState('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TaskSuggestions />
            </div>
            <div className="lg:col-span-1">
              <CalendarView />
            </div>
          </div>
        );
      case 'email':
        return <EmailDrafter />;
      case 'calendar':
        return <CalendarView />;
      default:
        return (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TaskSuggestions />
            </div>
            <div className="lg:col-span-1">
              <CalendarView />
            </div>
          </div>
        );
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
              Asistente Virtual
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('dashboard')} isActive={activeView === 'dashboard'} tooltip="Dashboard">
                <LayoutGrid />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('email')} isActive={activeView === 'email'} tooltip="Redactar Correo">
                <Mail />
                <span>Redactar Correo</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('calendar')} isActive={activeView === 'calendar'} tooltip="Calendario">
                <Calendar />
                <span>Calendario</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://placehold.co/100x100" alt="User Avatar" />
                <AvatarFallback>AV</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Usuario</span>
                <span className="text-xs text-muted-foreground">
                  en linea
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} className="h-9 w-9">
              <Settings />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <h1 className="text-xl font-semibold font-headline capitalize">{activeView.replace('-', ' ')}</h1>
          <SidebarTrigger />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </SidebarInset>
      <SettingsDialog isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </SidebarProvider>
  );
}
