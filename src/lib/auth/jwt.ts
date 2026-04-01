import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

const COOKIE_NAME = "salao_session";

export { COOKIE_NAME };

function encoder() {
  const s = process.env.AUTH_SECRET?.trim();
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET must be set (min. 32 characters)");
  }
  return new TextEncoder().encode(s);
}

export async function signSession(sub: string, email: string) {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encoder());
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, encoder());
  return {
    sub: payload.sub as string,
    email: payload.email as string,
  };
}

export async function verifySessionEdge(
  token: string,
  secret: string
): Promise<{ sub: string; email: string } | null> {
  try {
    if (!secret || secret.length < 32) return null;
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
    return { sub: payload.sub as string, email: payload.email as string };
  } catch {
    return null;
  }
}
