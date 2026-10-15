import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Sin `globals`, Testing Library no limpia el DOM solo entre pruebas.
afterEach(cleanup);

// jsdom no implementa showModal()/close() de <dialog>: simulación mínima para las pruebas.
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

// jsdom tampoco implementa scrollIntoView.
Element.prototype.scrollIntoView ??= () => {};
