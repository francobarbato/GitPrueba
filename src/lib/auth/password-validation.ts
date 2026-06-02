// Validación de fortaleza de contraseña — usado en alta de usuarios,
// reset de contraseña, y donde sea que se cambie un password.

export interface PasswordCheck {
  valid:  boolean;
  errors: string[];
}

export const PASSWORD_RULES = {
  minLength:    8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber:    /[0-9]/,
  hasSpecial:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

export function validatePasswordStrength(password: string): PasswordCheck {
  const errors: string[] = [];

  if (password.length < PASSWORD_RULES.minLength)
    errors.push(`Debe tener al menos ${PASSWORD_RULES.minLength} caracteres.`);
  if (!PASSWORD_RULES.hasUppercase.test(password))
    errors.push("Debe contener al menos una letra mayúscula.");
  if (!PASSWORD_RULES.hasLowercase.test(password))
    errors.push("Debe contener al menos una letra minúscula.");
  if (!PASSWORD_RULES.hasNumber.test(password))
    errors.push("Debe contener al menos un número.");
  if (!PASSWORD_RULES.hasSpecial.test(password))
    errors.push("Debe contener al menos un carácter especial (!@#$%^&*...).");

  return { valid: errors.length === 0, errors };
}

// Útil para mostrar la fortaleza en UI en tiempo real
export function evaluatePasswordRules(password: string) {
  return {
    minLength:    password.length >= PASSWORD_RULES.minLength,
    hasUppercase: PASSWORD_RULES.hasUppercase.test(password),
    hasLowercase: PASSWORD_RULES.hasLowercase.test(password),
    hasNumber:    PASSWORD_RULES.hasNumber.test(password),
    hasSpecial:   PASSWORD_RULES.hasSpecial.test(password),
  };
}