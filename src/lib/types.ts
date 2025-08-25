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

export type Cliente = {
  codigo: number;
  nombre: string;
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

export type Novedad = {
  codigo: number;
  nombre: string;
  meses: Meses;
  importe: number;
};

export type NovedadWithId = Novedad & { id: string };