const MIN_LEN = 10;

export function isPasswordStrongEnough(password: string): boolean {
  if (password.length < MIN_LEN) return false;
  if (!/[a-zA-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

export function passwordPolicyMessage(): string {
  return "A senha deve ter pelo menos 10 caracteres, incluindo letras e números.";
}

export { MIN_LEN as MIN_PASSWORD_LENGTH };
