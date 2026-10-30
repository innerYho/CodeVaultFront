# Ollama

## Qué es

Un programa que descarga y ejecuta modelos de lenguaje **en tu propia máquina** y los expone por una API HTTP local. Instalas Ollama, bajas un modelo con un comando y tu aplicación le habla a `http://localhost:11434` como si fuera un servicio en la nube, pero los datos no salen de tu equipo y no pagas por token.

| Pieza | Dato |
| --- | --- |
| Puerto y dirección por defecto | `127.0.0.1:11434` (solo accesible desde la propia máquina) |
| API nativa | `POST /api/chat` (y `/api/generate`) |
| API compatible con OpenAI | `http://localhost:11434/v1/` (`/chat/completions`, `/completions`, `/embeddings`, `/models`, `/responses`) |
| Librerías oficiales | `npm i ollama` (JavaScript) · `pip install ollama` (Python) |

Los modelos se descargan una vez y se guardan en disco (`~/.ollama/models` en macOS; `/usr/share/ollama/.ollama/models` en Linux con el instalador estándar; `C:\Users\<usuario>\.ollama\models` en Windows). Un modelo cargado se queda en memoria 5 minutos tras la última petición.

## Cuándo usarla

- **Privacidad:** datos que no pueden salir de tu red (clientes, historiales, código interno).
- **Desarrollo y pruebas:** iterar sin gastar créditos ni depender de internet, o probar en CI con un modelo pequeño.
- **Tareas acotadas** que un modelo pequeño resuelve bien: clasificar, extraer campos, resumir, embeddings.
- **Aprender:** cambiar de modelo y comparar resultados cuesta un comando.

## Cuándo no usarla

- Cuando necesitas la **máxima calidad de razonamiento** o ventanas de contexto enormes: los modelos que caben en un portátil suelen quedarse por debajo de los modelos de frontera alojados.
- Si la máquina no tiene memoria ni GPU suficientes: el modelo corre en CPU y responde despacio. `ollama ps` muestra el reparto (`100% GPU`, `100% CPU` o mixto).
- En producción con muchos usuarios simultáneos: tendrás que dimensionar hardware, cola y disponibilidad tú mismo.
- **No lo expongas a internet tal cual.** La API no tiene autenticación; si cambias `OLLAMA_HOST` a `0.0.0.0` queda abierta a toda la red. Ponle delante un proxy con autenticación o una VPN.

## Ejemplo

Instalación y primer uso:

```bash
# Linux y macOS
curl -fsSL https://ollama.com/install.sh | sh
# Windows (PowerShell)
irm https://ollama.com/install.ps1 | iex

ollama pull llama3.2     # descarga un modelo
ollama run llama3.2      # chat interactivo en la terminal
ollama ls                # modelos descargados
ollama ps                # modelos cargados ahora y si usan GPU o CPU
ollama stop llama3.2     # descargarlo de memoria
ollama rm llama3.2       # borrarlo del disco
ollama serve             # arrancar el servidor a mano (el instalador ya lo deja activo)
```

Los nombres de modelos cambian con el tiempo: consulta el catálogo en `ollama.com/library` y usa la etiqueta (`nombre:tag`) del tamaño que tu máquina soporte.

Desde TypeScript, con la librería oficial:

```ts
import ollama from "ollama";

const respuesta = await ollama.chat({
  model: "llama3.2",
  messages: [{ role: "user", content: "Resume este texto en una frase." }],
});
console.log(respuesta.message.content);

// Streaming: stream: true devuelve un AsyncGenerator
const flujo = await ollama.chat({
  model: "llama3.2",
  messages: [{ role: "user", content: "Cuenta hasta cinco." }],
  stream: true,
});
for await (const parte of flujo) process.stdout.write(parte.message.content);
```

Otro servidor distinto del local (`Ollama` con `host`; el predeterminado es `http://127.0.0.1:11434`):

```ts
import { Ollama } from "ollama";
const cliente = new Ollama({ host: "http://mi-servidor:11434" });
```

Con el SDK de OpenAI, apuntando a Ollama (la clave es obligatoria pero se ignora):

```ts
import OpenAI from "openai";

const openai = new OpenAI({ baseURL: "http://localhost:11434/v1/", apiKey: "ollama" });
const r = await openai.chat.completions.create({
  model: "llama3.2",
  messages: [{ role: "user", content: "Di «prueba»." }],
});
console.log(r.choices[0]?.message.content);
```

La compatibilidad con OpenAI cubre chat, *streaming*, modo JSON, herramientas (*tools*), visión con imágenes en base64 y *embeddings*. No admite `logprobs`, URLs de imagen ni los campos `tool_choice`, `logit_bias`, `user` y `n`.

Un modelo personalizado se describe en un `Modelfile` (aquí se fija el contexto y un mensaje de sistema):

```text
FROM llama3.2
PARAMETER temperature 0.2
PARAMETER num_ctx 4096
SYSTEM Eres un asistente que responde en español y de forma breve.
```

```bash
ollama create mi-asistente -f ./Modelfile
ollama run mi-asistente
```

`FROM` acepta un modelo de la biblioteca, un archivo GGUF (`FROM ./modelo.gguf`) o un directorio con pesos Safetensors. La API de OpenAI no tiene ajuste de contexto: si lo necesitas, se fija con `num_ctx` en un `Modelfile`.

Variables de entorno útiles: `OLLAMA_HOST` (dirección de escucha), `OLLAMA_MODELS` (dónde se guardan los modelos), `OLLAMA_KEEP_ALIVE` (cuánto se queda cargado: `10m`, segundos, negativo = siempre, `0` = descargar al terminar) y `OLLAMA_ORIGINS` (orígenes permitidos para llamadas desde el navegador).

## Alternativas

- **LM Studio, llama.cpp o vLLM:** otros servidores locales; vLLM está pensado para servir a muchos usuarios con GPU.
- **API de un proveedor alojado** (Claude, entre otros): mejor calidad y sin hardware propio, a cambio de enviar los datos fuera y pagar por uso. Ver [Agregar un modelo a tu proyecto](/ia/agregar-modelo).
- **Modelos en la nube de Ollama:** el mismo formato de API sobre `https://ollama.com/v1`, con una clave de tu cuenta.

## Referencias

- Documentación: [docs.ollama.com](https://docs.ollama.com) (CLI, API, `Modelfile`, preguntas frecuentes)
- Compatibilidad con OpenAI: [docs.ollama.com/api/openai-compatibility](https://docs.ollama.com/api/openai-compatibility)
- Librería JavaScript: [github.com/ollama/ollama-js](https://github.com/ollama/ollama-js)
- Catálogo de modelos: [ollama.com/library](https://ollama.com/library)
