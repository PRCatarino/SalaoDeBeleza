import { randomBytes } from "crypto";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export type SniffedImage = { ext: "jpg" | "png" | "gif" | "webp"; mime: string };

/** Gera nome de ficheiro imprevisível. */
export function randomAvatarFilename(ext: string): string {
  return `${randomBytes(24).toString("hex")}.${ext}`;
}

/**
 * Valida tamanho e assinatura mágica (não confia só na extensão/MIME).
 */
export function sniffAvatarImage(buf: Buffer): SniffedImage | null {
  if (buf.length < 12 || buf.length > MAX_AVATAR_BYTES) return null;

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return { ext: "png", mime: "image/png" };
  }
  if (
    buf.subarray(0, 6).toString("ascii") === "GIF87a" ||
    buf.subarray(0, 6).toString("ascii") === "GIF89a"
  ) {
    return { ext: "gif", mime: "image/gif" };
  }
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { ext: "webp", mime: "image/webp" };
  }

  return null;
}

export { MAX_AVATAR_BYTES };
