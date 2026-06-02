import Mailgun from "mailgun.js";
import FormData from "form-data";

// Configurado sólo si están las tres variables; si falta alguna, dev-mock toma el control.
const isConfigured =
  !!process.env.MAILGUN_API_KEY &&
  !!process.env.MAILGUN_DOMAIN;

export const emailIsConfigured = isConfigured;

export const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || "";

export const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  `Sistema LegalTech <postmaster@${MAILGUN_DOMAIN}>`;

// Cliente de Mailgun. null si no está configurado (dev-mock).
// Si tu cuenta es EU, agregá: url: "https://api.eu.mailgun.net"
// (la cuenta de Franco es US, no hace falta)
export const mailgunClient = isConfigured
  ? new Mailgun(FormData).client({
      username: "api",
      key:      process.env.MAILGUN_API_KEY!,
    })
  : null;