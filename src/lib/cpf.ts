/** Apenas dígitos do CPF (11 caracteres quando válido). */
export function normalizeCpf(input: string): string {
  return input.replace(/\D/g, "").slice(0, 11);
}

/** Valida dígitos verificadores do CPF brasileiro. */
export function isValidCpf(digits: string): boolean {
  const c = digits.replace(/\D/g, "");
  if (c.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(c)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(c[i]!, 10) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(c[9]!, 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(c[i]!, 10) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(c[10]!, 10);
}

/** Máscara visual; enquanto não tem 11 dígitos, mostra só os números digitados. */
export function formatCpfDisplay(digits: string): string {
  const c = normalizeCpf(digits);
  if (c.length !== 11) return c;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}
