import { useState } from "react";
import { NumericInput } from "./index";

export default function Demo() {
  const [phone, setPhone] = useState("");
  const [price, setPrice] = useState("");
  return (
    <div className="grid max-w-md gap-4 text-sm">
      <NumericInput
        label="Teléfono"
        value={phone}
        onValueChange={setPhone}
        maxLength={10}
        invalid={phone.length > 0 && phone.length < 10}
        hint={
          phone.length < 10
            ? `${phone.length}/10 dígitos. Prueba a pegar «(300) 123-4567».`
            : "Listo"
        }
      />
      <NumericInput
        label="Valor del equipo con IVA"
        value={price}
        onValueChange={setPrice}
        decimal
        maxLength={12}
        hint="Acepta coma o punto decimal."
      />
    </div>
  );
}
