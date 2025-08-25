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
