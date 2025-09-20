"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2, Send, Upload } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

import { useToast } from "@/hooks/use-toast"
import { getClienteByCodigo } from "@/lib/services/clientes"
import { uploadFile } from "@/lib/services/storage"
import type { ClienteWithId } from "@/lib/types"

const currentYear = new Date().getFullYear()

const formSchema = z.object({
  mes: z.string().min(1, "Debe seleccionar un mes."),
  ano: z.string().min(4, "Debe seleccionar un año."),
})

type FormSchema = z.infer<typeof formSchema>

type FileToSend = {
    file: File;
    status: 'pending' | 'processing' | 'sent' | 'error';
    errorMessage?: string;
    cliente?: ClienteWithId;
}

export function InformeResumenWhatsappView() {
  const [filesToSend, setFilesToSend] = React.useState<FileToSend[]>([]);
  const { toast } = useToast()
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mes: String(new Date().getMonth() + 1),
      ano: String(currentYear),
    },
  })

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles: FileToSend[] = Array.from(files).map(file => ({
        file,
        status: 'pending'
    }));

    // Pre-process files to find clients
    for (const fts of newFiles) {
        try {
            const fileName = fts.file.name;
            const codigoStr = fileName.split('-')[0];
            const codigo = parseInt(codigoStr, 10);
            
            if (isNaN(codigo)) {
                throw new Error("El nombre del archivo no comienza con un código de cliente válido.");
            }

            const cliente = await getClienteByCodigo(codigo);
            if (!cliente) {
                throw new Error(`No se encontró un cliente con el código ${codigo}.`);
            }
             if (!cliente.celular) {
                throw new Error(`El cliente ${cliente.nombre} no tiene un número de celular.`);
            }

            fts.cliente = cliente;
        } catch (error: any) {
            fts.status = 'error';
            fts.errorMessage = error.message;
        }
    }
    
    setFilesToSend(newFiles);
  }

  const handleSend = async (fileWrapper: FileToSend) => {
    if (!fileWrapper.cliente || fileWrapper.status === 'processing') return;

     setFilesToSend(prev => prev.map(f => 
        f.file.name === fileWrapper.file.name ? { ...f, status: 'processing' } : f
    ));
    
    const { mes, ano } = form.getValues();
    const cliente = fileWrapper.cliente;

    try {
        const mesLabel = format(new Date(parseInt(ano, 10), parseInt(mes, 10) - 1), 'LLLL', { locale: es });
        const filePath = `resumenes/${cliente.cuit}/${ano}-${mesLabel}.pdf`;
        const downloadURL = await uploadFile(fileWrapper.file, filePath);
        
        const mensaje = encodeURIComponent(`Hola ${cliente.nombre}, te enviamos el resumen de cuenta del mes de ${mesLabel}. Puedes verlo en: ${downloadURL}`);
        const numeroLimpio = cliente.celular!.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${numeroLimpio}?text=${mensaje}`;
        window.open(whatsappUrl, '_blank');

        toast({
            title: "Listo para Enviar",
            description: `Se ha abierto WhatsApp para enviar el resumen a ${cliente.nombre}.`,
        });

        setFilesToSend(prev => prev.map(f => 
            f.file.name === fileWrapper.file.name ? { ...f, status: 'sent' } : f
        ));

    } catch (error) {
        console.error("Error al generar o enviar resumen:", error);
        toast({ title: "Error", description: "No se pudo completar el proceso de envío.", variant: "destructive" });
        setFilesToSend(prev => prev.map(f => 
            f.file.name === fileWrapper.file.name ? { ...f, status: 'error', errorMessage: "Error al subir o enviar." } : f
        ));
    }
  };


  const mesesOptions = Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: format(new Date(0, i), 'LLLL', { locale: es }),
  }));
  const anosOptions = Array.from({ length: 10 }, (_, i) => String(currentYear - i));

  return (
    <div className="p-6 space-y-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Envío de Resúmenes por WhatsApp desde Archivos</CardTitle>
          <CardDescription>
            Seleccione el período de los resúmenes y luego suba los archivos PDF para enviarlos.
            Puede seleccionar múltiples archivos a la vez (ej: usando Ctrl+A en la carpeta). El nombre de cada archivo debe comenzar con el código del cliente (ej: "101-Nombre...pdf").
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="flex flex-col sm:flex-row gap-4 items-end">
                <FormField
                    control={form.control}
                    name="mes"
                    render={({ field }) => (
                    <FormItem className="w-full sm:w-auto flex-grow">
                        <FormLabel>Mes del Resumen</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Seleccione un mes" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {mesesOptions.map((mes) => (
                            <SelectItem key={mes.value} value={mes.value} className="capitalize">{mes.label}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="ano"
                    render={({ field }) => (
                    <FormItem className="w-full sm:w-auto flex-grow">
                        <FormLabel>Año del Resumen</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Seleccione un año" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {anosOptions.map((ano) => (
                            <SelectItem key={ano} value={ano}>{ano}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <Input 
                    type="file" 
                    ref={fileInputRef} 
                    multiple 
                    accept="application/pdf"
                    className="hidden" 
                    onChange={handleFileSelect} 
                />
                <Button type="button" className="w-full sm:w-auto" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Seleccionar Archivos
                </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {filesToSend.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle>Archivos para Enviar</CardTitle>
                <CardDescription>
                    Se encontraron {filesToSend.length} archivos. Haga clic en "Enviar" para cada uno.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Archivo</TableHead>
                                <TableHead>Cliente Detectado</TableHead>
                                <TableHead>Celular</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filesToSend.map((fts, index) => (
                                <TableRow key={index} className={fts.status === 'error' ? 'bg-destructive/10' : ''}>
                                    <TableCell className="font-medium max-w-xs truncate">
                                        <p>{fts.file.name}</p>
                                        {fts.status === 'error' && <p className="text-destructive text-xs">{fts.errorMessage}</p>}
                                    </TableCell>
                                    <TableCell>{fts.cliente?.nombre || '---'}</TableCell>
                                    <TableCell className="font-mono">{fts.cliente?.celular || '---'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            size="sm"
                                            onClick={() => handleSend(fts)}
                                            disabled={fts.status !== 'pending'}
                                        >
                                            {fts.status === 'processing' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {fts.status === 'sent' ? 'Enviado' : 'Enviar'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      )}

    </div>
  )
}

    