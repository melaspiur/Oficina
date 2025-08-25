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
