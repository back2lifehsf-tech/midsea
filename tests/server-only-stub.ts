// Stub que Vitest usa en lugar del paquete `server-only`. El paquete real
// existe sólo para fallar a build-time si una pieza server-side se importa
// desde el cliente; en tests Node-only ese guard no aplica.
export {};
