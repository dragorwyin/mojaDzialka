import { createServer } from "node:net";
import { URL } from "node:url";
import { preview } from "astro";

// Astro's Cloudflare preview adapter does not forward Vite strictPort.
// Refuse an occupied port first and verify the actual listening address afterward.
const url = new URL(process.env.E2E_BASE_URL ?? "http://127.0.0.1:4323");
if (url.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(url.hostname) || url.port !== "4323") {
  throw new Error("The local e2e preview must use loopback port4323.");
}
const port = Number(url.port);
const probe = createServer();
await new Promise((resolve, reject) => {
  probe.once("error", reject);
  probe.listen(port, url.hostname, resolve);
});
await new Promise((resolve, reject) => probe.close((error) => (error ? reject(error) : resolve())));
const server = await preview({ server: { host: url.hostname, port, open: false } });
const address = server.server?.address();
if (!address || typeof address === "string" || address.port !== port) {
  await server.stop();
  throw new Error("Preview changed its port; refusing to run e2e against a fallback server.");
}
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await server.stop();
  process.exit(0);
}
process.once("SIGINT", () => void stop());
process.once("SIGTERM", () => void stop());
await server.closed();
