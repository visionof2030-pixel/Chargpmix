// infer-fields: يستنتج من عنوان التقرير وتخصص المعلم خانات يمكن استنتاجها بثقة
// (المكان، المجال، المدة، نوع الاستراتيجية، وقت الاستخدام، وسيلة التواصل...) لتقليل الأسئلة.
// لا يخترع حقائق لا يعرفها إلا المعلم (الأسماء، الأعداد، الصف): تلك تبقى أسئلة أو من ذاكرة الصفوف.
// المدخلات: { template: long|short|visit|strategy|tool|parents|remedial|enrichment|applied|initiative|program|auto, current?, title, subject?, gender?, notes? }
// template:"auto" (القوالب القصيرة): يختار النموذج القالب ويعبّئ خاناته معاً، والمخرجات { template, fields }.
// المخرجات: { fields: { <key>: <value> } } — مفاتيح القالب فقط، والقيمة الفارغة تعني «لا أعرف».
// لا يستهلك رصيد التقارير، لكنه يتحقق من check_report_access (الاشتراك المنتهي لا يُستنتج له).
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
const PRIMARY_MODEL = "gemini-3.1-flash-lite";
const ALL_MODELS = [PRIMARY_MODEL, "gemini-2.5-flash-lite"];

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

// لكل قالب: المفاتيح المسموح استنتاجها ووصفها للنموذج. choices = قيم مغلقة إن وُجدت.
interface Spec { key: string; desc: string; choices?: string[]; max: number }
const SPECS: Record<string, Spec[]> = {
  long: [
    { key: "place", desc: "مكان تنفيذ النشاط", choices: ["داخل الصف", "خارج الصف"], max: 20 },
    { key: "lesson", desc: "عنوان الدرس أو الوحدة — فقط إن كان مذكوراً صراحة في العنوان، وإلا فارغ", max: 80 },
  ],
  short: [
    { key: "domain", desc: "مجال النشاط بكلمة أو كلمتين (مثل: إثرائي، علاجي، توعوي، تربوي، مهني، اجتماعي، تحصيلي)", max: 30 },
    { key: "place", desc: "مكان التنفيذ المرجّح (مثل: داخل الصف، مصادر التعلم، فناء المدرسة، المسرح المدرسي، عن بُعد)", max: 40 },
    { key: "duration", desc: "مدة التنفيذ التقديرية المعقولة (مثل: حصة دراسية، حصتان، يوم دراسي، أسبوع)", max: 30 },
    { key: "participants", desc: "المشاركون المرجّحون غير المعلم المنفذ (مثل: رواد النشاط، معلمو القسم، الموجه الطلابي) — فارغ إن كان المعلم وحده", max: 60 },
  ],
  visit: [
    { key: "lesson", desc: "عنوان الدرس أو الوحدة — فقط إن كان مذكوراً صراحة في العنوان، وإلا فارغ", max: 80 },
  ],
  strategy: [
    { key: "strategy_type", desc: "نوع/تصنيف الاستراتيجية المذكورة في العنوان (مثل: تعلم نشط، تعلم تعاوني، تعلم ذاتي، تفكير ناقد، تعلم باللعب)", max: 40 },
    { key: "effectiveness", desc: "مدى فعاليتها؛ إن لم تذكر الملاحظات شيئاً اكتب: فعالة", choices: ["فعالة جداً", "فعالة", "فعالة إلى حد ما"], max: 20 },
  ],
  tool: [
    { key: "usage_time", desc: "وقت استخدام الأداة/التطبيق في الحصة أو الوحدة بحسب طبيعتها (مثل: أثناء الشرح، في التقويم الختامي، نهاية كل وحدة، في الواجبات المنزلية)", max: 50 },
  ],
  parents: [
    { key: "activity_type", desc: "نوع نشاط التواصل باختصار (مثل: التواصل عبر منصة مدرستي، اجتماع أولياء الأمور، رسائل متابعة)", max: 50 },
    { key: "medium", desc: "وسيلة التواصل؛ إن لم تُذكر في العنوان اكتب: منصة مدرستي", max: 40 },
    { key: "domain", desc: "مجال التواصل باختصار (مثل: متابعة وإرشاد، تحصيل دراسي، سلوك وانضباط، تعزيز وتحفيز)", max: 40 },
  ],
  remedial: [
    { key: "audience", desc: "الفئة المستهدفة بوصف عام دون ذكر صف (مثل: الطلاب المتعثرون في القراءة، الطلاب ذوو التحصيل المنخفض)", max: 50 },
    { key: "duration", desc: "مدة الخطة التقديرية المعقولة (مثل: أربعة أسابيع، شهر، الفصل الدراسي الأول)", max: 40 },
  ],
  enrichment: [
    { key: "audience", desc: "الفئة المستهدفة بوصف عام دون ذكر صف (مثل: الطلاب الموهوبون، الطلاب المتقدمون في الرياضيات)", max: 50 },
    { key: "duration", desc: "مدة الخطة التقديرية المعقولة (مثل: شهر، الفصل الدراسي الأول)", max: 40 },
  ],
  applied: [
    { key: "audience", desc: "الفئة المستهدفة بوصف عام دون ذكر صف (مثل: الطلاب، معلمو القسم)", max: 50 },
    { key: "duration", desc: "زمن الدرس (مثل: حصة دراسية (45 دقيقة)، حصتان)", max: 40 },
    { key: "lesson", desc: "عنوان الدرس أو الوحدة — فقط إن كان مذكوراً صراحة في العنوان، وإلا فارغ", max: 80 },
  ],
  initiative: [
    { key: "audience", desc: "الفئة المستهدفة بوصف عام دون ذكر صف (مثل: طلاب المدرسة، الطلاب، منسوبو المدرسة)", max: 50 },
    { key: "duration", desc: "مدة المبادرة التقديرية المعقولة (مثل: أسبوع، أسبوعان، شهر)", max: 40 },
  ],
  program: [
    { key: "audience", desc: "الفئة المستهدفة بوصف عام دون ذكر صف (مثل: طلاب الصفوف الأولية، الطلاب، طلاب المدرسة)", max: 50 },
    { key: "duration", desc: "مدة البرنامج التقديرية المعقولة (مثل: أسبوعان، شهر، الفصل الدراسي الأول)", max: 40 },
  ],
};

// القوالب القصيرة التي يختار النموذج بينها من العنوان (template: "auto").
const SHORT_KINDS: Record<string, string> = {
  short: "تقرير عام: نشاط أو فعالية أو مناسبة أو مسابقة أو إذاعة أو ورشة أو حصة أو أي شيء لا ينطبق عليه قالب أخص (هو الافتراضي)",
  visit: "تبادل الزيارات بين المعلمين أو حضور حصة لزميل",
  strategy: "تنفيذ استراتيجية تدريس محددة باسمها (مثل المقعد الساخن، الرؤوس المرقمة، التعلم التعاوني)",
  tool: "استخدام أداة أو وسيلة أو تطبيق أو منصة أو برنامج حاسوبي في التعليم",
  parents: "التواصل مع أولياء الأمور",
  remedial: "خطة أو برنامج علاجي للطلاب المتعثرين أو لعلاج ضعف مهارة",
  enrichment: "خطة أو برنامج إثرائي للطلاب الموهوبين أو المتقدمين",
  applied: "درس تطبيقي أو نموذجي يقدّمه المعلم",
  initiative: "مبادرة يطلقها المعلم أو المدرسة",
  program: "برنامج تربوي أو تعليمي ممتد له أهداف وفعاليات (وليس برنامجاً حاسوبياً)",
};

function buildPrompt(tpl: string, title: string, subject: string, female: boolean, notes: string): string {
  const specs = SPECS[tpl];
  const lines = specs.map((s) => `- "${s.key}": ${s.desc}${s.choices ? ` (اختر حرفياً واحدة من: ${s.choices.join("، ")})` : ""}`).join("\n");
  return `أنت مساعد لمعلم${female ? "ة" : ""} في مدرسة سعودية يعبّئ بيانات تقرير شواهد أداء وظيفي.
عنوان التقرير: «${title}»
التخصص/المادة: ${subject || "غير محدد"}
${notes ? "ملاحظات المعلم: " + notes + "\n" : ""}
استنتج من العنوان والتخصص قيم الخانات التالية فقط، بالعربية الفصحى وباختصار شديد كما تُكتب في خانة رسمية:
${lines}

قواعد:
- لا تخترع أسماء أشخاص أو أعداداً أو صفوفاً دراسية.
- إن لم يكن الاستنتاج معقولاً وواضحاً لخانة فاجعل قيمتها "".
${female ? "- استخدم صيغ المؤنث (الطالبات، المعلمات، رائدات النشاط...).\n" : ""}
أعد JSON فقط بالمفاتيح المذكورة أعلاه.`;
}

function buildAutoPrompt(title: string, subject: string, female: boolean, notes: string): string {
  const kinds = Object.entries(SHORT_KINDS).map(([k, d]) => `- "${k}": ${d}`).join("\n");
  const specs = Object.keys(SHORT_KINDS).map((k) => `«${k}»:\n` + SPECS[k].map((s) => `  - "${s.key}": ${s.desc}${s.choices ? ` (اختر حرفياً واحدة من: ${s.choices.join("، ")})` : ""}`).join("\n")).join("\n");
  return `أنت مساعد لمعلم${female ? "ة" : ""} في مدرسة سعودية يعبّئ بيانات تقرير شواهد أداء وظيفي.
عنوان التقرير: «${title}»
التخصص/المادة: ${subject || "غير محدد"}
${notes ? "ملاحظات المعلم: " + notes + "\n" : ""}
الخطوة ١: اختر نوع القالب الأنسب لهذا العنوان من القائمة:
${kinds}
لا تختر قالباً أخص إلا إذا كان العنوان عنه بوضوح؛ وإن تردّدت فاختر "short".

الخطوة ٢: استنتج من العنوان والتخصص قيم خانات القالب الذي اخترته فقط، بالعربية الفصحى وباختصار شديد كما تُكتب في خانة رسمية. خانات كل قالب:
${specs}

قواعد:
- لا تخترع أسماء أشخاص أو أعداداً أو صفوفاً دراسية.
- إن لم يكن الاستنتاج معقولاً وواضحاً لخانة فاجعل قيمتها "".
${female ? "- استخدم صيغ المؤنث (الطالبات، المعلمات، رائدات النشاط...).\n" : ""}
أعد JSON فقط بهذا الشكل: {"template": "<مفتاح القالب>", "fields": { <خانات ذلك القالب> }}`;
}

async function callGemini(prompt: string): Promise<string | null> {
  const n = GEMINI_KEYS.length;
  if (!n) return null;
  const start = Math.floor(Math.random() * n);
  const keys = Array.from({ length: n }, (_, i) => GEMINI_KEYS[(start + i) % n]);
  const deadline = Date.now() + 9000;
  for (const model of ALL_MODELS) {
    let skipModel = false;
    let count503 = 0;
    for (let i = 0; i < keys.length && !skipModel; i++) {
      const remaining = deadline - Date.now();
      if (remaining < 1200) return null;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(5000, remaining));
      try {
        const generationConfig: Record<string, unknown> = { responseMimeType: "application/json" };
        if (!model.startsWith("gemini-3")) generationConfig.temperature = 0.2;
        const resp = await geminiFetch("infer-fields", keys[i], model, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
          signal: controller.signal,
        });
        if (!resp.ok) {
          console.error("Gemini key " + (i + 1) + "/" + n + " (" + model + ") failed: HTTP " + resp.status);
          if (resp.status === 400 || resp.status === 404) skipModel = true;
          if (resp.status === 503 && model === PRIMARY_MODEL && ++count503 >= 2) skipModel = true;
          continue;
        }
        const data = await resp.json();
        const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text || "").join("");
        if (text) { console.log("gemini ok model=" + model + " key=" + (i + 1)); return text; }
      } catch (e) {
        console.error("Gemini key " + (i + 1) + "/" + n + " (" + model + ") threw: " + (e instanceof Error ? e.name : "error"));
        if (model === PRIMARY_MODEL && e instanceof Error && e.name === "AbortError") skipModel = true;
      } finally {
        clearTimeout(timer);
      }
    }
  }
  return null;
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
  const tpl = asText(body.template, 20);
  const title = asText(body.title, 200);
  const auto = tpl === "auto";
  if ((!auto && !SPECS[tpl]) || !title) return jsonResponse({ detail: "template and title are required", code: "bad_request" }, 400);
  const subject = asText(body.subject, 80);
  const notes = asText(body.notes, 300);
  const female = body.gender === "female";

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { error: accessError } = await supabase.rpc("check_report_access", { p_user_id: userData.user.id });
  if (accessError) return jsonResponse({ detail: accessError.message }, 403);
  if (!GEMINI_KEYS.length) return jsonResponse({ fields: {}, failed: true, reason: "not_configured" });

  const raw = await callGemini(auto ? buildAutoPrompt(title, subject, female, notes) : buildPrompt(tpl, title, subject, female, notes));
  if (!raw) return jsonResponse({ fields: {}, failed: true, reason: "no_answer" });
  let parsed: Record<string, unknown> = {};
  try {
    const c = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
    const v = JSON.parse(c.slice(c.indexOf("{"), c.lastIndexOf("}") + 1));
    parsed = v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch { return jsonResponse({ fields: {}, failed: true, reason: "unparsable" }); }

  let useTpl = tpl;
  if (auto) {
    const t = asText(parsed.template, 20);
    useTpl = Object.prototype.hasOwnProperty.call(SHORT_KINDS, t) ? t : (asText(body.current, 20) in SHORT_KINDS ? asText(body.current, 20) : "short");
    const f = parsed.fields;
    parsed = f && typeof f === "object" && !Array.isArray(f) ? f as Record<string, unknown> : {};
  }
  const fields: Record<string, string> = {};
  for (const s of SPECS[useTpl]) {
    let val = asText(parsed[s.key], s.max).replace(/[.،؛]+$/g, "").trim();
    if (!val) continue;
    if (s.choices && !s.choices.includes(val)) {
      const hit = s.choices.find((c) => val.includes(c) || c.includes(val));
      if (!hit) continue;
      val = hit;
    }
    fields[s.key] = val;
  }
  return jsonResponse(auto ? { template: useTpl, fields } : { fields });
};

Deno.serve(async (req: Request) => {
  const res = await handleRequest(req);
  await scheduleCallLogFlush();
  return res;
});
