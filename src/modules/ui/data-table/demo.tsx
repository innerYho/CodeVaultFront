import { type Column, DataTable } from "./index";

interface Cliente {
  id: number;
  name: string;
  city: string;
  date: Date;
}

const names = ["Ana", "Luis", "Marta", "Pedro", "Sofía", "Iván", "Elena", "Mateo"];
const cities = ["Bogotá", "Medellín", "Cali", "Barranquilla"];
const clientes: Cliente[] = Array.from({ length: 57 }, (_, i) => ({
  id: 1000 + i * 7,
  name: `${names[i % names.length]} ${String.fromCharCode(65 + (i % 26))}.`,
  city: cities[i % cities.length] as string,
  date: new Date(Date.UTC(2024, i % 12, 1 + (i % 28))),
}));

const fmt = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeZone: "UTC" });
const columns: Column<Cliente>[] = [
  { key: "id", header: "Id", sortValue: (c) => c.id, align: "right" },
  { key: "name", header: "Nombre", sortValue: (c) => c.name },
  { key: "city", header: "Ciudad", sortValue: (c) => c.city },
  { key: "date", header: "Alta", sortValue: (c) => c.date, render: (c) => fmt.format(c.date) },
];

export default function Demo() {
  return (
    <DataTable
      columns={columns}
      rows={clientes}
      getRowId={(c) => c.id}
      caption="Clientes de ejemplo"
      pageSize={8}
    />
  );
}
