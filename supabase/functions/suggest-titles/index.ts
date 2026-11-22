// suggest-titles: عناوين تقارير جديدة يولّدها الذكاء الاصطناعي لمعيار محدد وتخصص المعلم.
// المدخلات: { criterion_id, subject, avoid: [عناوين استخدمها المعلم], count? }
// المخرجات: { titles: [{ title, subcategory_id, subcategory_name }] } — كل عنوان من ٤ إلى ٦ كلمات،
// مرتبط ببند من بنود المعيار (يتحقق الخادم من البند وطول العنوان ويستبعد المكرر).
// نفس نمط suggest-criterion: التحقق من الجلسة، check_report_access، ومفاتيح GEMINI_API_KEY_n.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GEMINI_KEYS: string[] = [];
for (let n = 1; n <= 10; n++) {
  const k = Deno.env.get("GEMINI_API_KEY_" + n);
  if (k) GEMINI_KEYS.push(k);
}
// النموذج الأساسي 3.1 Flash-Lite (حصته المجانية ٥٠٠ طلب/يوم لكل مشروع)، ثم 2.5 احتياطاً.
// المرور: النموذج الأساسي على كل المفاتيح أولاً، ثم الاحتياطي — حتى لا تُستهلك حصة 2.5 الصغيرة
// ما دام في أي مفتاح حصة من 3.1.
const PRIMARY_MODEL = "gemini-3.1-flash-lite";
const ALL_MODELS = [PRIMARY_MODEL, "gemini-2.5-flash-lite", "gemini-2.5-flash"];
const FALLBACK_MODELS = ALL_MODELS.slice(1);
const STRUCTURE_TTL_MS = 10 * 60 * 1000;

// ===== سجل استهلاك مفاتيح Gemini (لوحة المالك): رقم خانة المفتاح فقط، لا المفتاح نفسه =====
const KEY_SLOT = new Map<string, number>();
for (let n = 1; n <= 10; n++) {
  const k = Deno.env.get("GEMINI_API_KEY_" + n);
  if (k && !KEY_SLOT.has(k)) KEY_SLOT.set(k, n);
}
const CALL_LOG: Array<Record<string, unknown>> = [];
const CALL_LOG_PENDING: Promise<unknown>[] = [];
async function geminiFetch(fn: string, key: string, model: string, init: RequestInit): Promise<Response> {
  const t0 = Date.now();
  const slot = KEY_SLOT.get(key) ?? null;
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + key, init);
    const base = { fn, key_slot: slot, model, http_status: r.status, ms: Date.now() - t0 };
    if (r.ok) {
      CALL_LOG_PENDING.push(r.clone().json().then((j) => {
        const u = j?.usageMetadata || {};
        CALL_LOG.push({ ...base, status: "ok", prompt_tokens: u.promptTokenCount ?? null, output_tokens: u.candidatesTokenCount ?? null, total_tokens: u.totalTokenCount ?? null });
      }).catch(() => { CALL_LOG.push({ ...base, status: "ok" }); }));
    } else {
      CALL_LOG.push({ ...base, status: "http_" + r.status });
    }
    return r;
  } catch (e) {
    CALL_LOG.push({ fn, key_slot: slot, model, http_status: null, ms: Date.now() - t0, status: e instanceof Error && e.name === "AbortError" ? "timeout" : "error" });
    throw e;
  }
}
async function flushCallLog(): Promise<void> {
  try {
    await Promise.race([Promise.allSettled(CALL_LOG_PENDING.splice(0)), new Promise((r) => setTimeout(r, 1500))]);
    const rows = CALL_LOG.splice(0);
    if (!rows.length) return;
    const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { error } = await db.from("ai_call_log").insert(rows);
    if (error) console.error("ai_call_log insert failed: " + error.message);
  } catch (_e) {
    console.error("ai_call_log flush failed");
  }
}
function scheduleCallLogFlush(): Promise<void> | void {
  // يُكتب السجل بعد إرسال الرد (EdgeRuntime.waitUntil) فلا ينتظره المستخدم.
  const er = (globalThis as unknown as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
  if (er && typeof er.waitUntil === "function") { er.waitUntil(flushCallLog()); return; }
  return flushCallLog();
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}
function asText(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
function normAr(t: string): string {
  return t.replace(/[\u064B-\u0670\u065F\u0640]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ").trim();
}

let lastIssue = "";
async function callGemini(prompt: string, perAttemptMs: number, overallMs: number, models: string[] = ALL_MODELS): Promise<string | null> {
  const n = GEMINI_KEYS.length;
  if (!n) return null;
  const start = Math.floor(Math.random() * n);
  const keys = Array.from({ length: n }, (_, i) => GEMINI_KEYS[(start + i) % n]);
  const deadline = Date.now() + overallMs;
  lastIssue = "";
  for (const model of models) {
    let skipModel = false;
    let count503 = 0;
    for (let i = 0; i < keys.length && !skipModel; i++) {
      const remaining = deadline - Date.now();
      if (remaining < 1500) { lastIssue = "deadline"; return null; }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(perAttemptMs, remaining));
      try {
        const generationConfig: Record<string, unknown> = { responseMimeType: "application/json" };
        // نماذج الجيل الثالث: تُترك الحرارة والتفكير على الافتراضي (توصية Google).
        if (!model.startsWith("gemini-3")) generationConfig.temperature = 0.9;
        if (model === "gemini-2.5-flash") generationConfig.thinkingConfig = { thinkingBudget: 0 };
        const resp = await geminiFetch("suggest-titles", keys[i], model, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }), signal: controller.signal },
        );
        if (!resp.ok) {
          lastIssue = model + " HTTP " + resp.status;
          console.error("Gemini key " + (i + 1) + "/" + n + " (" + model + ") failed: HTTP " + resp.status);
          // 400/404: النموذج نفسه غير متاح أو الطلب لا يناسبه — لا فائدة من بقية المفاتيح عليه.
          if (resp.status === 400 || resp.status === 404) skipModel = true;
          // بعد ردّين 503 (ضغط عالٍ لدى Google على النموذج نفسه) يُتجاوز الأساسي.
          if (resp.status === 503 && model === PRIMARY_MODEL && ++count503 >= 2) skipModel = true;
          continue;
        }
        const data = await resp.json();
        const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text || "").join("");
        if (text) { console.log("gemini ok model=" + model + " key=" + (i + 1)); return text; }
        lastIssue = model + " empty";
      } catch (e) {
        lastIssue = model + " " + (e instanceof Error ? e.name : "error");
        console.error("Gemini key " + (i + 1) + "/" + n + " (" + model + ") threw: " + lastIssue);
        // بطء النموذج الأساسي عام لا يخص مفتاحاً بعينه: انتقل للاحتياطي مباشرة.
        if (model === PRIMARY_MODEL && e instanceof Error && e.name === "AbortError") skipModel = true;
      } finally {
        clearTimeout(timer);
      }
    }
  }
  return null;
}

interface Sub { n: number; id: string; name: string; examples: string[] }
interface Crit { id: string; name: string; subs: Sub[] }
const structureCache = new Map<string, { at: number; crits: Map<string, Crit> }>();
async function loadCriterion(supabase: ReturnType<typeof createClient>, role: string, critId: string): Promise<Crit | null> {
  let hit = structureCache.get(role);
  if (!hit || Date.now() - hit.at > STRUCTURE_TTL_MS) {
    const { data, error } = await supabase.rpc("get_full_structure", { p_role: role });
    if (error) { console.error("get_full_structure failed: " + error.message); return null; }
    const crits = new Map<string, Crit>();
    for (const c of ((data as { structure?: Array<Record<string, unknown>> })?.structure ?? [])) {
      const subs = ((c.subcategories as Array<Record<string, unknown>> | undefined) ?? []).map((s, i) => ({
        n: i + 1, id: String(s.id), name: String(s.name),
        examples: ((s.reports as Array<Record<string, unknown>> | undefined) ?? []).map((r) => String(r.name)).slice(0, 4),
      }));
      crits.set(String(c.id), { id: String(c.id), name: String(c.name), subs });
    }
    hit = { at: Date.now(), crits };
    structureCache.set(role, hit);
  }
  return hit.crits.get(critId) || null;
}

function buildPrompt(crit: Crit, subject: string, avoid: string[], count: number, female = false): string {
  const subsText = crit.subs.map((s) => `[${s.n}] ${s.name}${s.examples.length ? " — أمثلة على الأسلوب فقط: " + s.examples.join("؛ ") : ""}`).join("\n");
  return `أنت مساعد تربوي لمعلم في المملكة العربية السعودية يوثّق شواهد الأداء الوظيفي.
اقترح ${count} عناوين تقارير تربوية جديدة لمعيار الأداء: «${crit.name}».
تخصص المعلم: ${subject || "غير محدد"}.
${female ? "المعلمة أنثى في مدرسة بنات: استخدم صيغ المؤنث في العناوين (الطالبات، المتعلمات، المتفوقات، أولياء أمور الطالبات).\n" : ""}
بنود المعيار (اختر لكل عنوان بنداً مناسباً، ونوّع بين البنود قدر الإمكان):
${subsText}

الشروط:
- كل عنوان من ٤ إلى ٦ كلمات بالضبط، بالعربية الفصحى، دون علامات ترقيم في آخره.
- يناسب تخصص المعلم «${subject || "عام"}» تحديداً؛ لا تذكر مادة أخرى ولا مفاهيم تخص مادة أخرى.
- عنوان عملي واقعي لنشاط ينفذه المعلم فعلاً، وليس عنواناً عاماً مبهماً.
- لا تنسخ أمثلة البنود حرفياً (هي للأسلوب فقط)، ولا تكرر أي عنوان من هذه القائمة: ${avoid.length ? avoid.slice(0, 40).join("؛ ") : "لا يوجد"}.

أعد JSON فقط بهذا الشكل:
{"titles":[{"title":"...","n":رقم_البند}]}`;
}

const handleRequest = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonResponse({ detail: "Method not allowed" }, 405);

  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return jsonResponse({ detail: "Login required", code: "auth" }, 401);
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: userData, error: userError } = await authClient.auth.getUser(jwt);
  if (userError || !userData?.user) return jsonResponse({ detail: "Invalid session", code: "auth" }, 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return jsonResponse({ detail: "Bad request", code: "bad_request" }, 400); }
  const critId = asText(body.criterion_id, 80);
  if (!critId) return jsonResponse({ detail: "criterion_id is required", code: "bad_request" }, 400);
  const subject = asText(body.subject, 80);
  const avoid = (Array.isArray(body.avoid) ? body.avoid : []).map((x) => asText(x, 160)).filter(Boolean).slice(0, 60);
  const count = Math.max(1, Math.min(5, Math.floor(Number(body.count) || 3)));
  const roleRaw = asText(body.role, 40);
  const role = /^[a-z_]+$/.test(roleRaw) ? roleRaw : "teacher";

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { error: accessError } = await supabase.rpc("check_report_access", { p_user_id: userData.user.id });
  if (accessError) return jsonResponse({ detail: accessError.message }, 403);
  if (!GEMINI_KEYS.length) return jsonResponse({ titles: [], failed: true, reason: "not_configured" });

  const crit = await loadCriterion(supabase, role, critId);
  if (!crit || !crit.subs.length) return jsonResponse({ titles: [], failed: true, reason: "unknown_criterion" });

  const prompt = buildPrompt(crit, subject, avoid, count + 2, body.gender === "female");
  const parseTitles = (raw: string): { titles?: Array<Record<string, unknown>> } | null => {
    try {
      const c = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
      const v = JSON.parse(c.slice(c.indexOf("{"), c.lastIndexOf("}") + 1));
      return v && typeof v === "object" && Array.isArray(v.titles) ? v : null;
    } catch { return null; }
  };
  let raw = await callGemini(prompt, 9000, 16000);
  if (!raw) return jsonResponse({ titles: [], failed: true, reason: lastIssue || "no_answer" });
  let parsed = parseTitles(raw);
  if (!parsed) {
    // ردّ غير صالح: محاولة واحدة بالنموذج الاحتياطي قبل الاستسلام.
    console.error("suggest-titles: unparsable answer, retrying with fallback model");
    raw = await callGemini(prompt, 7000, 9000, FALLBACK_MODELS);
    parsed = raw ? parseTitles(raw) : null;
  }
  if (!parsed || !Array.isArray(parsed.titles)) return jsonResponse({ titles: [], failed: true, reason: "unparsable" });

  const avoidN = new Set(avoid.map(normAr));
  const seen = new Set<string>();
  const titles: Array<Record<string, string>> = [];
  for (const t of parsed.titles) {
    const title = asText(t?.title, 120).replace(/[.،؛:!؟?"«»]+$/g, "").replace(/\s+/g, " ").trim();
    const words = title.split(" ").filter(Boolean).length;
    if (words < 4 || words > 6) continue;
    if (!/[؀-ۿ]/.test(title)) continue;
    const key = normAr(title);
    if (seen.has(key) || avoidN.has(key)) continue;
    const sub = crit.subs.find((s) => s.n === Number(t?.n)) || crit.subs[0];
    seen.add(key);
    titles.push({ title, subcategory_id: sub.id, subcategory_name: sub.name });
    if (titles.length >= count) break;
  }
  return jsonResponse({ titles });
};

Deno.serve(async (req: Request) => {
  const res = await handleRequest(req);
  await scheduleCallLogFlush();
  return res;
});
