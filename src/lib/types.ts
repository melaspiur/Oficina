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
  // serviciosAsignados is now removed from here.
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