import { useState } from "react";
import { OtpInput } from "./index";

export default function Demo() {
  const [value, setValue] = useState("");
  const [done, setDone] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <OtpInput
        value={value}
        onChange={(v) => {
          setValue(v);
          setDone(null);
        }}
        onComplete={setDone}
        invalid={done === "000000"}
      />
      <p className="text-sm text-zinc-500">
        Prueba a escribir, borrar, mover con las flechas o pegar un código. Valor:{" "}
        <code>{value || "—"}</code>
        {done && (
          <>
            {" "}
            · completado: <code>{done}</code>
          </>
        )}
      </p>
    </div>
  );
}
