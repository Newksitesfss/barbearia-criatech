import { randomBytes, scrypt as _scrypt } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt);

/**
 * Gera um salt aleatório.
 * @returns O salt gerado.
 */
export function generateSalt(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Gera o hash da senha usando scrypt.
 * @param password A senha em texto puro.
 * @param salt O salt a ser usado.
 * @returns O hash da senha.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return derivedKey.toString("hex");
}

/**
 * Verifica se a senha fornecida corresponde ao hash armazenado.
 * @param password A senha em texto puro.
 * @param salt O salt armazenado.
 * @param storedHash O hash armazenado.
 * @returns True se a senha for válida, False caso contrário.
 */
export async function verifyPassword(
  password: string,
  salt: string,
  storedHash: string
): Promise<boolean> {
  const hash = await hashPassword(password, salt);
  return hash === storedHash;
}
