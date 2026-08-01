import { cookies } from "next/headers";

const DEFAULT_MAX_AGE = 60 * 60 * 24; // 1 día
const MIN_MAX_AGE = 60 * 60; // 1 hora
const MAX_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export async function POST(req: Request) {
  try {
    const { token, maxAge } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), { status: 400 });
    }

    // La cookie debe vivir al menos lo que vive el refresh token; si caduca antes,
    // el layout del servidor manda a /login-error con la sesión todavía válida.
    const requested = Number(maxAge);
    const resolvedMaxAge =
      Number.isFinite(requested) && requested > 0
        ? Math.min(Math.max(Math.floor(requested), MIN_MAX_AGE), MAX_MAX_AGE)
        : DEFAULT_MAX_AGE;

    const cookieStore = await cookies();

    cookieStore.set("mv_fo_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: resolvedMaxAge,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("Cookie error:", err);
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 500 });
  }
}
