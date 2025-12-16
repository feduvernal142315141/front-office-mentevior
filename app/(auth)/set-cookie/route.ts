import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), { status: 400 });
    }

    const cookieStore = await cookies();

    cookieStore.set("mv_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("Cookie error:", err);
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 500 });
  }
}
