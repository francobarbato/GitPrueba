"use client";

import { Check, X } from "lucide-react";
import { evaluatePasswordRules } from "src/lib/auth/password-validation";

interface Props {
  password: string;
}

function strengthFromChecks(checks: ReturnType<typeof evaluatePasswordRules>) {
  const passed = Object.values(checks).filter(Boolean).length;
  if (passed <= 2) return { label: "Débil",   color: "bg-red-500",     width: "20%" };
  if (passed <= 3) return { label: "Regular", color: "bg-orange-500",  width: "40%" };
  if (passed <= 4) return { label: "Buena",   color: "bg-yellow-500",  width: "70%" };
  return                    { label: "Fuerte",  color: "bg-green-500",   width: "100%" };
}

export function PasswordRequirements({ password }: Props) {
  if (!password) return null;

  const checks   = evaluatePasswordRules(password);
  const strength = strengthFromChecks(checks);

  const items = [
    { ok: checks.minLength,    label: "Mínimo 8 caracteres" },
    { ok: checks.hasUppercase, label: "Al menos una mayúscula" },
    { ok: checks.hasLowercase, label: "Al menos una minúscula" },
    { ok: checks.hasNumber,    label: "Al menos un número" },
    { ok: checks.hasSpecial,   label: "Al menos un carácter especial (!@#$%...)" },
  ];

  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-600">Fortaleza:</span>
          <span
            className={`font-medium ${
              strength.label === "Fuerte"  ? "text-green-600"  :
              strength.label === "Buena"   ? "text-yellow-600" :
              strength.label === "Regular" ? "text-orange-600" : "text-red-600"
            }`}
          >
            {strength.label}
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${strength.color} transition-all duration-300`}
            style={{ width: strength.width }}
          />
        </div>
      </div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            {it.ok
              ? <Check className="w-3.5 h-3.5 text-green-600" />
              : <X     className="w-3.5 h-3.5 text-slate-400" />
            }
            <span className={it.ok ? "text-green-700" : "text-slate-500"}>
              {it.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}