// supabase/functions/review-voice-fields/index.ts
//
// Lightweight AI pre-check for the voice-command report wizard: catches
// speech-recognition word-level mistakes on short technical/educational
// terms (e.g. the browser's Web Speech API hearing "نموذج" when the teacher
// actually said "نمذجة", because the recognizer's language model strongly
// favors the more common word). It does NOT replace generate-report's own
// call, and does NOT consume the account's report-generation usage quota --
// it is a cheap, optional accuracy helper the client only calls when a
// local heuristic flags at least one suspiciously short free-text field
// (see getVoiceReviewCandidates() client-side), or for the report title,
// which the client always sends here (no word-count gate) as soon as it is
// captured, before the field wizard even starts.
//
// Design intentionally avoids a fixed find/replace dictionary: a word like
// "نموذج" is itself a perfectly common, legitimate term (a template/form),
// so blindly substituting it everywhere would create new errors. Instead,
// the full report context (title/place/grade/subject/lesson/target/notes)
// is sent to Gemini, which judges per-field, in context, whether the
// captured text looks like a mis-hearing of a different intended word --
// and returns its best guess only when it believes something changed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// نفس حوض مفاتيح Gemini ومنطق المداورة/الفشل التلقائي المستخدم في
// generate-report (كل دالة Edge منشورة بملفها الخاص بدون استيراد مشترك بين
// الدالتين، فالمنطق مكرر هنا عمداً لا بالخطأ).
const GEMINI_KEYS = [
  Deno.env.get("GEMINI_API_KEY_1"),
  Deno.env.get("GEMINI_API_KEY_2"),
  Deno.env.get("GEMINI_API_KEY_3"),
  Deno.env.get("GEMINI_API_KEY_4"),
  Deno.env.get("GEMINI_API_KEY_5"),
  Deno.env.get("GEMINI_API_KEY_6"),
  Deno.env.get("GEMINI_API_KEY_7"),
  Deno.env.get("GEMINI_API_KEY_8"),
  Deno.env.get("GEMINI_API_KEY_9"),
  Deno.env.get("GEMINI_API_KEY_10"),
].filter((k): k is string => !!k);

// يبدأ كل طلب من مفتاح عشوائي (النسخ تُشغَّل من جديد كثيراً فكان العدّاد يبدأ دائماً من المفتاح الأول).
function shuffledKeyOrder(): string[] {
  const n = GEMINI_KEYS.length;
  if (n === 0) return [];
  const start = Math.floor(Math.random() * n);
  return Array.from({ length: n }, (_, i) => GEMINI_KEYS[(start + i) % n]);
}

// النموذج الأساسي 3.1 Flash-Lite (حصته المجانية ٥٠٠ طلب/يوم لكل مشروع)، و2.5 Flash-Lite احتياطاً.
const PRIMARY_MODEL = "gemini-3.1-flash-lite";
const ALL_MODELS = [PRIMARY_MODEL, "gemini-2.5-flash-lite"];
const FALLBACK_MODELS = ALL_MODELS.slice(1);
const PER_ATTEMPT_TIMEOUT_MS = 8000;
// بعد ردّين 503 (ضغط عالٍ لدى Google على النموذج نفسه) يُتجاوز الأساسي إلى الاحتياطي.
const PRIMARY_MAX_503 = 2;

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
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function callGeminiOnce(prompt: string, models: string[] = ALL_MODELS): Promise<string | null> {
  const keys = shuffledKeyOrder();
  const totalKeys = keys.length;
  for (const model of models) {
    let skipModel = false;
    let count503 = 0;
    for (let i = 0; i < totalKeys && !skipModel; i++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), PER_ATTEMPT_TIMEOUT_MS);
      try {
        const resp = await geminiFetch("review-voice-fields", keys[i], model, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            signal: controller.signal,
          },
        );
        if (!resp.ok) {
          console.error(`Gemini key #${i + 1}/${totalKeys} (${model}) failed (HTTP ${resp.status}), trying next...`);
          if (resp.status === 400 || resp.status === 404) skipModel = true;
          if (resp.status === 503 && model === PRIMARY_MODEL && ++count503 >= PRIMARY_MAX_503) skipModel = true;
          continue;
        }
        const json = await resp.json();
        const parts = json?.candidates?.[0]?.content?.parts ?? [];
        const text = parts.map((p: { text?: string }) => p.text || "").join("");
        if (text) {
          console.log(`gemini ok model=${model} key=${i + 1}`);
          return text;
        }
        console.error(`Gemini key #${i + 1}/${totalKeys} (${model}) returned empty content, trying next...`);
      } catch (e) {
        console.error(`Gemini key #${i + 1}/${totalKeys} (${model}) threw (${e instanceof Error ? e.message : String(e)}), trying next...`);
        if (model === PRIMARY_MODEL && e instanceof Error && e.name === "AbortError") skipModel = true;
      } finally {
        clearTimeout(timer);
      }
    }
  }
  return null;
}

function parseCorrections(raw: string): Record<string, { corrected?: string; changed?: boolean }> | null {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    const v = JSON.parse(cleaned);
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

// الحقول المسموح مراجعتها - حصراً الحقول النصية الحرة المعرّضة لهذا النوع من
// أخطاء الالتقاط (لا الحقول الرقمية/الاختيارية). أي اسم حقل آخر يُرسله العميل
// يُتجاهل بصمت دفاعاً عن نفسنا من مدخل غير متوقع. "title" مختلف عن بقية
// الحقول في طرف العميل فقط (لا قيد على عدد كلماته هناك، لأنه غالباً جملة
// كاملة لا كلمة واحدة، ويُراجَع مبكراً فور التقاطه قبل معالج الخانات) - هنا
// في الخادم تتم معاملته بالضبط كمعاملة أي حقل آخر.
const ALLOWED_FIELDS = new Set(["title", "subject", "lesson", "target", "extra_notes"]);
const FIELD_LABELS: Record<string, string> = {
  title: "عنوان التقرير",
  subject: "المادة",
  lesson: "الدرس",
  target: "المستهدفون",
  extra_notes: "ملاحظات إضافية",
};

interface ReviewRequest {
  candidate_fields?: string[];
  context?: Record<string, string>;
}

const handleRequest = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonResponse({ detail: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return jsonResponse({ detail: "يجب تسجيل الدخول" }, 401);

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: userData, error: userError } = await authClient.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return jsonResponse({ detail: "جلسة غير صالحة، يرجى تسجيل الدخول من جديد" }, 401);
  }
  const userId = userData.user.id;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // نفس شرط الأهلية المستخدم قبل أي استدعاء ذكاء اصطناعي في generate-report
  // (حساب نشط/غير منتهٍ) - لكن بخلافها، لا نستهلك أي رصيد استخدام هنا؛ هذه
  // مجرد مراجعة مساعِدة اختيارية رخيصة، لا "توليد تقرير" فعلي.
  const { error: accessError } = await supabase.rpc("check_report_access", { p_user_id: userId });
  if (accessError) return jsonResponse({ detail: accessError.message }, 403);

  let body: ReviewRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ detail: "طلب غير صالح" }, 400);
  }

  const candidateFields = (body.candidate_fields || []).filter((f) => ALLOWED_FIELDS.has(f));
  if (candidateFields.length === 0) return jsonResponse({ corrections: {} });

  if (GEMINI_KEYS.length === 0) return jsonResponse({ corrections: {} });

  const ctx = body.context || {};
  const contextLines = [
    ctx.title ? `العنوان: ${ctx.title}` : "",
    ctx.place ? `المكان: ${ctx.place}${ctx.detailed_place ? ` (${ctx.detailed_place})` : ""}` : "",
    ctx.grade ? `الصف: ${ctx.grade}` : "",
    ctx.subject ? `المادة: ${ctx.subject}` : "",
    ctx.lesson ? `الدرس: ${ctx.lesson}` : "",
    ctx.target ? `المستهدفون: ${ctx.target}` : "",
    ctx.extra_notes ? `ملاحظات إضافية: ${ctx.extra_notes}` : "",
  ].filter(Boolean).join("\n");

  const fieldsBlock = candidateFields
    .map((f) => `- ${f} (${FIELD_LABELS[f] || f}): "${(ctx[f] || "")}"`)
    .join("\n");

  const prompt = `أنت مدقق لغوي عربي متخصص في المصطلحات التربوية والتعليمية.
بعض بيانات التقرير المدرسي التالي أُدخلت عبر أمر صوتي، ومحرك التعرف على الصوت
يُخطئ أحياناً في التقاط كلمة تربوية أقل شيوعاً فيسمع بدلاً منها كلمة أخرى أكثر
شيوعاً تشبهها لفظاً (مثال: يسمع "نموذج" بينما المعلم قال فعلياً "نمذجة" لأنها
استراتيجية تدريس، أو يسمع كلمة مشابهة الجرس لكنها لا تناسب السياق إطلاقاً).
وقد يقطع آخر الكلمة أيضاً عند رفع المعلم إصبعه، خاصة في الكلمات الإنجليزية
(مثال: "Gramm" بدل "Grammar"، و"Readi" بدل "Reading")؛ أكمل الكلمة المبتورة
إن كانت مادة المعلم وسياق التقرير يوضحان المقصود.

سياق التقرير الكامل:
${contextLines || "(لا يوجد سياق إضافي)"}

راجع الحقول التالية فقط، كل حقل على حدة، واحكم: هل النص الملتقط فيه يبدو كخطأ
تعرّف صوتي على كلمة تربوية مشابهة لفظاً تناسب السياق أكثر؟ لا تغيّر أي حقل إلا
إن كنت واثقاً فعلاً أن هناك كلمة أخرى أنسب للسياق التربوي ولصوت الكلمة
الملتقطة معاً - لا تُجر أي تحسين أسلوبي أو تلخيص، فقط تصحيح كلمة مسموعة خطأ:

${fieldsBlock}

أعد إجابتك بصيغة JSON فقط بدون أي نص أو شرح إضافي، بالضبط بهذا الشكل (مفتاح
لكل حقل من الحقول المطلوبة أعلاه فقط):
{"اسم_الحقل": {"corrected": "النص بعد المراجعة", "changed": true أو false}}
ضع "changed": false و"corrected" مطابقاً للنص الأصلي تماماً إن كان صحيحاً كما هو.`;

  let raw = await callGeminiOnce(prompt);
  if (!raw) return jsonResponse({ corrections: {} });

  // تنظيف أي تغليف Markdown محتمل ثم التحليل بأمان. ردّ غير صالح من النموذج الأساسي
  // يُعاد مرة واحدة بالنموذج الاحتياطي؛ وأي فشل بعدها يعني ببساطة "لا تصحيحات"،
  // فهذه ميزة مساعِدة اختيارية ويجب ألا تُعطّل تدفق إصدار التقرير أبداً.
  let parsed = parseCorrections(raw);
  if (!parsed) {
    raw = await callGeminiOnce(prompt, FALLBACK_MODELS);
    parsed = raw ? parseCorrections(raw) : null;
  }
  if (!parsed) return jsonResponse({ corrections: {} });

  const corrections: Record<string, { corrected: string; changed: boolean }> = {};
  for (const field of candidateFields) {
    const entry = parsed[field];
    if (!entry || typeof entry.corrected !== "string") continue;
    corrections[field] = { corrected: entry.corrected, changed: !!entry.changed };
  }

  return jsonResponse({ corrections });
};

Deno.serve(async (req: Request) => {
  const res = await handleRequest(req);
  await scheduleCallLogFlush();
  return res;
});
