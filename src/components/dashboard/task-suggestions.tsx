"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { suggestTasksAction } from '@/lib/actions';
import type { Task } from '@/lib/types';

const priorityColors: Record<Task['priority'], string> = {
  High: "bg-red-500 hover:bg-red-500/90",
  Medium: "bg-yellow-500 hover:bg-yellow-500/90",
  Low: "bg-green-500 hover:bg-green-500/90",
};

export function TaskSuggestions() {
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState("Me interesa el marketing digital, la codificación y la escritura de contenido.");
  const [schedule, setSchedule] = useState("Tengo una reunión a las 2 PM. Estoy libre durante las próximas 2 horas.");
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();

  const handleSuggestTasks = async () => {
    setIsLoading(true);
    setTasks([]);
    try {
      const result = await suggestTasksAction({
        userPreferences: preferences,
        userSchedule: schedule,
      });

      const priorities: Array<Task['priority']> = ['High', 'Medium', 'Low'];
      const suggestedTasks = result.suggestedTasks.map((taskText, index) => ({
        id: `task-${Date.now()}-${index}`,
        text: taskText,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
      }));
      setTasks(suggestedTasks);
      
      toast({
        title: "Sugerencias generadas",
        description: "Aquí tienes algunas tareas que puedes hacer ahora.",
      });
    } catch (error) {
      console.error("Error suggesting tasks:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron generar sugerencias de tareas.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Sugerencias de Tareas Inteligentes</CardTitle>
        <CardDescription>
          La IA sugiere tareas basadas en tus preferencias y horario.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="preferences" className="block text-sm font-medium mb-1">Preferencias</label>
            <Textarea
              id="preferences"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="Ej: Me interesa el diseño, programar..."
            />
          </div>
          <div>
            <label htmlFor="schedule" className="block text-sm font-medium mb-1">Horario Actual</label>
            <Textarea
              id="schedule"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="Ej: Tengo 1 hora libre antes de mi próxima reunión..."
            />
          </div>
        </div>
        <Button onClick={handleSuggestTasks} disabled={isLoading}>
          <Lightbulb className="mr-2 h-4 w-4" />
          {isLoading ? "Generando..." : "Sugerir Tareas"}
        </Button>
        {isLoading && <Progress value={50} className="w-full h-2 animate-pulse" />}
        <div className="flex-grow space-y-4 pt-4">
          {tasks.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task) => (
                <Card key={task.id} className="flex flex-col">
                  <CardHeader className="flex-row items-center justify-between pb-2">
                     <CardTitle className="text-base font-medium">{task.text}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-xs text-muted-foreground">Prioridad de IA</p>
                  </CardContent>
                   <div className="p-4 pt-0">
                    <Badge className={`${priorityColors[task.priority]} text-white`}>{task.priority}</Badge>
                   </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
