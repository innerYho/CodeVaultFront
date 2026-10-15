// Prepara dist/ para alojamiento estático (GitHub Pages).
import { copyFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dist = join(import.meta.dirname, "..", "dist");

// Pages sirve 404.html en cualquier ruta desconocida: con la SPA, eso permite abrir /ui/otp-input directamente.
copyFileSync(join(dist, "index.html"), join(dist, "404.html"));
// Sin esto, Pages (Jekyll) ignora carpetas que empiezan por guion bajo.
writeFileSync(join(dist, ".nojekyll"), "");
console.log("✓ dist/404.html y .nojekyll creados");
