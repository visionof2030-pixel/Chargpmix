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

let keyIndex = 0;
function nextGeminiKey(): string | null {
  if (GEMINI_KEYS.length === 0) return null;
  const key = GEMINI_KEYS[keyIndex % GEMINI_KEYS.length];
  keyIndex++;
  return key;
}

const GEMINI_MODEL = "gemini-2.5-flash-lite";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function callGeminiOnce(prompt: string): Promise<string | null> {
  const totalKeys = GEMINI_KEYS.length;
  for (let i = 0; i < totalKeys; i++) {
    const apiKey = nextGeminiKey();
    if (!apiKey) break;
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        },
      );
      if (!resp.ok) {
        console.error(`Gemini key #${i + 1}/${totalKeys} failed (HTTP ${resp.status}), trying next key...`);
        continue;
      }
      const json = await resp.json();
      const parts = json?.candidates?.[0]?.content?.parts ?? [];
      const text = parts.map((p: { text?: string }) => p.text || "").join("");
      if (text) return text;
      console.error(`Gemini key #${i + 1}/${totalKeys} returned empty content, trying next key...`);
    } catch (e) {
      console.error(`Gemini key #${i + 1}/${totalKeys} threw (${e instanceof Error ? e.message : String(e)}), trying next key...`);
    }
  }
  return null;
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

Deno.serve(async (req: Request) => {
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

  const raw = await callGeminiOnce(prompt);
  if (!raw) return jsonResponse({ corrections: {} });

  // تنظيف أي تغليف Markdown محتمل (```json ... ```) ثم محاولة التحليل بأمان -
  // أي فشل هنا يعني ببساطة "لا تصحيحات"، لا خطأ يُرجع للعميل، فهذه ميزة
  // مساعِدة اختيارية ويجب ألا تُعطّل تدفق إصدار التقرير أبداً.
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  let parsed: Record<string, { corrected?: string; changed?: boolean }> = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return jsonResponse({ corrections: {} });
  }

  const corrections: Record<string, { corrected: string; changed: boolean }> = {};
  for (const field of candidateFields) {
    const entry = parsed[field];
    if (!entry || typeof entry.corrected !== "string") continue;
    corrections[field] = { corrected: entry.corrected, changed: !!entry.changed };
  }

  return jsonResponse({ corrections });
});
