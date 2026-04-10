/** Mensagens para códigos retornados pelo RPC em cadastro de cliente. */
export function clientFieldErrorMessage(code: string): string {
  const map: Record<string, string> = {
    invalid_client_full_name: "Informe o nome completo.",
    invalid_client_phone: "Informe o telefone.",
    invalid_client_cpf: "CPF inválido. Confira os números.",
    invalid_client_birth_date: "Data de nascimento inválida ou futura.",
  };
  return map[code] ?? "Não foi possível salvar o cliente.";
}
