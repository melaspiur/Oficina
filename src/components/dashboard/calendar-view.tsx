"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import type { Event } from "@/lib/types"
import { BellRing } from "lucide-react"

const mockEvents: Event[] = [
  {
    time: "10:00 AM",
    title: "Reunión de Sincronización",
    description: "Reunión diaria del equipo.",
  },
  {
    time: "1:00 PM",
    title: "Almuerzo con el Cliente",
    description: "Discutir los próximos pasos del proyecto.",
  },
  {
    time: "3:30 PM",
    title: "Llamada de Revisión",
    description: "Revisión del sprint con el equipo de desarrollo.",
  },
]

export function CalendarView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendario y Eventos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={new Date()}
          className="rounded-md border"
        />
        <div className="space-y-4">
          <h3 className="text-md font-semibold">Próximos Eventos</h3>
          <ul className="space-y-4">
            {mockEvents.map((event, index) => (
              <li key={index} className="flex items-start gap-4">
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                  <BellRing className="h-4 w-4 text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.time} - {event.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
