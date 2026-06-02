import crypto from "crypto";

// Genera un token opaco de 64 caracteres hex (32 bytes random).
// Suficiente entropía para que no se pueda adivinar por fuerza bruta.
export function generarToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Vencimientos estándar de cada tipo de token
export const TOKEN_TTL = {
  PASSWORD_RESET:       60 * 60 * 1000,             // 1 hora
  ACCOUNT_ACTIVATION:   48 * 60 * 60 * 1000,        // 48 horas
} as const;

export function fechaDeVencimiento(ttlMs: number): Date {
  return new Date(Date.now() + ttlMs);
}