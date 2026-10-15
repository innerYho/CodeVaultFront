import { ToastProvider, useToast } from "./index";

function Buttons() {
  const { toast } = useToast();
  const btn =
    "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={btn}
        onClick={() => toast({ title: "Cliente guardado", kind: "success" })}
      >
        Éxito
      </button>
      <button
        type="button"
        className={btn}
        onClick={() =>
          toast({
            title: "Campo id cliente es requerido",
            description: "Revisa el formulario.",
            kind: "error",
          })
        }
      >
        Error (fijo)
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => toast({ title: "Sincronizando…", duration: 8000 })}
      >
        Info 8 s
      </button>
    </div>
  );
}

export default function Demo() {
  return (
    <ToastProvider>
      <div className="space-y-3 text-sm">
        <p>Pasa el cursor sobre un aviso (o enfócalo con Tab): el tiempo y la barra se detienen.</p>
        <Buttons />
      </div>
    </ToastProvider>
  );
}
