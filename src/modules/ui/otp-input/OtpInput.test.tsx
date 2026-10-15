import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { OtpInput } from "./OtpInput";

function Harness({ onComplete }: { onComplete?: (v: string) => void }) {
  const [v, setV] = useState("");
  return <OtpInput value={v} onChange={setV} onComplete={onComplete} />;
}
const box = (n: number) =>
  screen.getByLabelText(new RegExp(`dígito ${n} de 6`)) as HTMLInputElement;

describe("OtpInput", () => {
  it("escribe dígitos, ignora letras y avanza", () => {
    render(<Harness />);
    fireEvent.change(box(1), { target: { value: "a" } });
    expect(box(1).value).toBe("");
    fireEvent.change(box(1), { target: { value: "4" } });
    fireEvent.change(box(2), { target: { value: "2" } });
    expect(box(1).value).toBe("4");
    expect(box(2).value).toBe("2");
  });

  it("pegar un código completo lo rellena y llama a onComplete una vez", () => {
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    fireEvent.paste(box(3), { clipboardData: { getData: () => "123 456" } });
    expect(box(6).value).toBe("6");
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("el autocompletado del SO (varios dígitos en la primera casilla) rellena todo", () => {
    render(<Harness />);
    fireEvent.change(box(1), { target: { value: "987654" } });
    expect(box(4).value).toBe("6");
  });

  it("Backspace borra el último dígito", () => {
    render(<Harness />);
    fireEvent.paste(box(1), { clipboardData: { getData: () => "12" } });
    fireEvent.keyDown(box(3), { key: "Backspace" });
    expect(box(2).value).toBe("");
    expect(box(1).value).toBe("1");
  });
});
