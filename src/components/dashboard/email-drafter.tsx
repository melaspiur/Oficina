"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { draftEmailAction } from '@/lib/actions';
import { Wand2 } from 'lucide-react';

const formSchema = z.object({
  recipient: z.string().email("Debe ser un correo electrónico válido."),
  topic: z.string().min(5, "El tema debe tener al menos 5 caracteres."),
  context: z.string().min(10, "El contexto debe tener al menos 10 caracteres."),
});

export function EmailDrafter() {
  const [isLoading, setIsLoading] = useState(false);
  const [draftedEmail, setDraftedEmail] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient: "",
      topic: "",
      context: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setDraftedEmail("");
    try {
      const result = await draftEmailAction(values);
      setDraftedEmail(result.emailDraft);
      toast({
        title: "Borrador de Correo Generado",
        description: "Tu correo electrónico está listo para ser revisado.",
      });
    } catch (error) {
      console.error("Error drafting email:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar el borrador del correo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Redactor de Correos con IA</CardTitle>
          <CardDescription>Genera borradores de correo electrónico basados en tus indicaciones.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="recipient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destinatario</FormLabel>
                    <FormControl>
                      <Input placeholder="nombre@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tema</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Seguimiento de la reunión" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contexto</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Escribe los puntos principales o el contexto para el correo electrónico..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                <Wand2 className="mr-2 h-4 w-4" />
                {isLoading ? "Generando Borrador..." : "Generar Borrador"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Borrador Generado</CardTitle>
          <CardDescription>Revisa y copia el correo electrónico generado a continuación.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {isLoading && <Progress value={50} className="w-full h-2 animate-pulse mb-4" />}
          <Textarea
            value={draftedEmail}
            readOnly
            placeholder="El borrador de tu correo aparecerá aquí..."
            className="flex-1 text-base"
          />
           <Button variant="outline" className="mt-4" onClick={() => navigator.clipboard.writeText(draftedEmail)} disabled={!draftedEmail}>Copiar Texto</Button>
        </CardContent>
      </Card>
    </div>
  );
}
