// login-username: تسجيل الدخول باسم المستخدم دون كشف البريد الإلكتروني للمتصفح.
// كان المتصفح يسأل username_to_email (مفتوحة للعموم) فيمكن لأي أحد معرفة بريد أي معلم من اسم مستخدمه.
// الآن: الاسم وكلمة المرور يصلان هنا، ويُبحث عن البريد ويُسجَّل الدخول على الخادم، ويعود للمتصفح
// رمزا الجلسة فقط. الرد واحد لكل فشل («بيانات الدخول غير صحيحة») فلا يُعرف هل الاسم موجود.
// للحد من التخمين: ٨ محاولات فاشلة لكل اسم مستخدم خلال ١٥ دقيقة.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MAX_FAILS = 8;
const WINDOW_MIN = 15;

function reply(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return reply({ ok: false, code: "bad_request" });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply({ ok: false, code: "bad_request" }); }
  const username = typeof body.username === "string" ? body.username.trim().slice(0, 80) : "";
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  if (!username || !password) return reply({ ok: false, code: "invalid" });
  const ulc = username.toLowerCase();

  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const since = new Date(Date.now() - WINDOW_MIN * 60000).toISOString();
  const { count } = await db.from("login_attempts").select("id", { count: "exact", head: true }).eq("username_lc", ulc).gte("at", since);
  if ((count ?? 0) >= MAX_FAILS) return reply({ ok: false, code: "too_many" });

  const fail = async () => {
    await db.from("login_attempts").insert({ username_lc: ulc });
    return reply({ ok: false, code: "invalid" });
  };

  const { data: email } = await db.rpc("username_to_email", { p_username: username });
  if (!email || typeof email !== "string") return await fail();

  const auth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error || !data?.session) {
    if (error && /rate limit|too many/i.test(error.message || "")) return reply({ ok: false, code: "too_many" });
    return await fail();
  }
  // نجاح: تُمسح محاولات هذا الاسم الفاشلة
  await db.from("login_attempts").delete().eq("username_lc", ulc);
  return reply({ ok: true, session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token } });
});
