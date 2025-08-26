




export type Task = {
  id: string;
  text: string;
  priority: 'High' | 'Medium' | 'Low';
};

export type Event = {
  time: string;
  title: string;
  description: string;
};

// This is a "view model" for display purposes, created by combining data.
export type AsignacionViewModel = {
  id: string; // The ID of the assignment document itself
  clienteId: string; 
  clienteCodigo: number;
  clienteNombre: string;
  novedadId: string;
  novedadCodigo: number; 
  novedadNombre: string;
  cantidad: number;
  importe: number;
};

export type Cliente = {
  codigo: number;
  nombre:string;
  domicilio?: string;
  localidad?: string;
  provincia?: string;
  cuit: string;
  tipo: 'inscripto' | 'monotributo';
  categoria: 1 | 2 | 3 | 4 | 5;
};

export type ClienteWithId = Cliente & { id: string };

export type Meses = {
  enero: boolean;
  febrero: boolean;
  marzo: boolean;
  abril: boolean;
  mayo: boolean;
  junio: boolean;
  julio: boolean;
  agosto: boolean;
  septiembre: boolean;
  octubre: boolean;
  noviembre: boolean;
  diciembre: boolean;
};

export const mesesList: { value: string; label: string }[] = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
];

export type Novedad = {
  codigo: number;
  nombre: string;
  meses: Meses;
  importe: number;
};

export type NovedadWithId = Novedad & { id: string };

// New type for the 'asignaciones' collection documents
export type Asignacion = {
    clienteId: string;
    novedadId: string;
    cantidad: number;
}

export type AsignacionWithId = Asignacion & { id: string };


export type ConfiguracionComprobantes = {
  ultimoRecibo: number;
  ultimoFactura: number;
  ultimoMesEventual?: string;
};


// Types for Billing Flow
export type NovedadFacturada = {
  novedadId: string;
  novedadCodigo: number;
  novedadNombre: string;
  cantidad: number;
  importe: number;
  numeroFactura: number;
};

export type ClienteFacturado = {
  clienteId: string;
  clienteCodigo: number;
  clienteNombre: string;
  novedades: NovedadFacturada[];
  totalFacturado: number;
};

// Type for movements collection
export type Movimiento = {
    clienteId: string;
    fecha: string; // ISO date string
    comprobante: 'FC' | 'RE'; // FC=Factura, RE=Recibo
    numero: number;
    novedadId?: string; // Optional, as a receipt might not have a novedad
    importe: number;
    aplicacion: number;
    descripcion?: string;
};

export type MovimientoWithId = Movimiento & { id: string };
