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

const GEMINI_KEYS: string[] = [];
for (let n = 1; n <= 10; n++) {
  const k = Deno.env.get("GEMINI_API_KEY_" + n);
  if (k) GEMINI_KEYS.push(k);
}

// النموذج الأساسي 3.1 Flash-Lite (حصته المجانية ٥٠٠ طلب/يوم لكل مشروع)، ثم 2.5 احتياطاً.
// المرور: الأساسي على كل المفاتيح أولاً، ثم الاحتياطي.
const PRIMARY_MODEL = "gemini-3.1-flash-lite";
const ALL_MODELS = [PRIMARY_MODEL, "gemini-2.5-flash-lite", "gemini-2.5-flash"];
const FALLBACK_MODELS = ALL_MODELS.slice(1);
// مهلة أقصر للنموذج الأساسي، وتجاوزه بعد ردّين 503 (ضغط عالٍ لدى Google).
const PRIMARY_TIMEOUT_MS = 15000;
const PRIMARY_MAX_503 = 2;
// صاحب المشروع: يُعاد له اسم النموذج الذي كتب التقرير (لدراسة الحالة)، ولا يُعاد لغيره.
const OWNER_EMAIL = "ifahadenglish@gmail.com";
// صيغة المؤنث: حين تكون صفة مقدم التقرير «معلمة» يُلحق هذا التوجيه بنص الطلب.
const FEMALE_NOTE = "\n\nتعليمات الصياغة (إلزامية): مقدِّمة هذا التقرير معلمة (أنثى) في مدرسة بنات. اكتب كل ما يخصها بصيغة المؤنث (المعلمة، قامت، نفّذت، حرصت، استخدمت...)، واستخدم صيغ المؤنث للمتعلمين (الطالبات، الطالبة، المتعلمات، المتفوقات، أولياء أمور الطالبات) بدل صيغ المذكر، وكذلك عند الإشارة إلى الزميلات أو المشرفة أو قائدة المدرسة. لا تغيّر أسماء الأعلام ولا المصطلحات الرسمية الثابتة، والتزم بالشكل والتنسيق المطلوبين أعلاه تماماً.";



let lastGeminiIssue = "";
let lastGeminiModel = "";

const EXTRACT_KEYS = [
  "title", "executors", "participants", "place", "duration", "date",
  "beneficiaries", "count", "domain", "notes",
];
const EXTRACT_KEYS_VISIT = [
  "title", "visitor", "host", "grade", "subject", "lesson", "date", "notes",
];
const GENERATE_VARS_VISIT: Record<string, string> = {
  report_name: "title",
  visitor: "visitor",
  host: "host",
  grade: "grade",
  subject: "subject",
  lesson: "lesson",
  date: "date",
  achieved: "achieved",
  partial: "partial",
  unmet: "unmet",
  extra_notes: "extra_notes",
};

const EXTRA_TEMPLATES: Record<string, { extract: string[]; vars: Record<string, string> }> = {
  strategy: {
    extract: ["title", "strategy_type", "grade", "effectiveness", "notes"],
    vars: { report_name: "title", strategy_type: "strategy_type", grade: "grade", effectiveness: "effectiveness", extra_notes: "extra_notes" },
  },
  tool: {
    extract: ["title", "subject", "audience", "usage_time", "notes"],
    vars: { report_name: "title", subject: "subject", audience: "audience", usage_time: "usage_time", extra_notes: "extra_notes" },
  },
  parents: {
    extract: ["title", "activity_type", "responsible", "audience", "medium", "period", "domain", "notes"],
    vars: {
      report_name: "title", activity_type: "activity_type", responsible: "responsible", audience: "audience",
      medium: "medium", period: "period", domain: "domain", extra_notes: "extra_notes",
    },
  },
};

const GENERATE_VARS: Record<string, string> = {
  report_name: "title",
  executors: "executors",
  participants: "participants",
  place: "place",
  duration: "duration",
  date: "date",
  beneficiaries: "beneficiaries",
  domain: "domain",
  extra_notes: "extra_notes",
};
const NOT_MENTIONED = "---";

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

function shuffledKeyOrder(): string[] {
  const n = GEMINI_KEYS.length;
  if (n === 0) return [];
  const start = Math.floor(Math.random() * n);
  return Array.from({ length: n }, (_, i) => GEMINI_KEYS[(start + i) % n]);
}

async function callGemini(
  prompt: string,
  jsonMode: boolean,
  perAttemptMs: number,
  overallMs: number,
  models: string[] = ALL_MODELS,
): Promise<string | null> {
  const keys = shuffledKeyOrder();
  const deadline = Date.now() + overallMs;
  lastGeminiIssue = "";
  for (const model of models) {
    let skipModel = false;
    let count503 = 0;
    for (let i = 0; i < keys.length && !skipModel; i++) {
      const remaining = deadline - Date.now();
      if (remaining < 1500) {
        lastGeminiIssue = "deadline";
        console.error("Overall deadline reached after " + i + " key(s); giving up.");
        return null;
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(model === PRIMARY_MODEL ? Math.min(perAttemptMs, PRIMARY_TIMEOUT_MS) : perAttemptMs, remaining));
      try {
        const generationConfig: Record<string, unknown> = {};
        if (jsonMode) {
          // نماذج الجيل الثالث: تُترك الحرارة على الافتراضي (توصية Google).
          if (!model.startsWith("gemini-3")) generationConfig.temperature = 0;
          generationConfig.responseMimeType = "application/json";
        }
        if (model === "gemini-2.5-flash") generationConfig.thinkingConfig = { thinkingBudget: 0 };
        const resp = await geminiFetch("short-report", keys[i], model, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
            signal: controller.signal,
          },
        );
        if (!resp.ok) {
          let detail = "";
          try { detail = (await resp.text()).slice(0, 160); } catch { /* ignore */ }
          lastGeminiIssue = model + " HTTP " + resp.status;
          console.error("Gemini key " + (i + 1) + "/" + keys.length + " (" + model + ") failed: HTTP " + resp.status + " " + detail);
          if (resp.status === 400 || resp.status === 404) skipModel = true;
          if (resp.status === 503 && model === PRIMARY_MODEL && ++count503 >= PRIMARY_MAX_503) skipModel = true;
          continue;
        }
        const data = await resp.json();
        const parts = data?.candidates?.[0]?.content?.parts ?? [];
        const text = parts.map((p: { text?: string }) => p.text || "").join("");
        if (text) {
          console.log("gemini ok model=" + model + " key=" + (i + 1));
          lastGeminiModel = model;
          return text;
        }
        lastGeminiIssue = model + " empty (" + (data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason || "?") + ")";
        console.error("Gemini key " + (i + 1) + "/" + keys.length + " (" + model + ") returned no text: " + lastGeminiIssue);
      } catch (e) {
        lastGeminiIssue = model + " " + (e instanceof Error ? e.name : "error");
        console.error("Gemini key " + (i + 1) + "/" + keys.length + " (" + model + ") threw: " + (e instanceof Error ? e.message : String(e)));
        if (model === PRIMARY_MODEL && e instanceof Error && e.name === "AbortError") skipModel = true;
      } finally {
        clearTimeout(timer);
      }
    }
  }
  return null;
}

function parseLooseJson(raw: string): Record<string, unknown> | null {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  const candidates = [cleaned];
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) candidates.push(cleaned.slice(first, last + 1));
  for (const c of candidates) {
    try {
      let v = JSON.parse(c);
      if (Array.isArray(v)) v = v[0];
      if (v && typeof v === "object") return v as Record<string, unknown>;
    } catch { /* try next */ }
  }
  return null;
}

function asText(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function fill(template: string, token: string, value: string): string {
  return template.split(token).join(value);
}

const handleRequest = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonResponse({ detail: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return jsonResponse({ detail: "Login required", code: "auth" }, 401);

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: userData, error: userError } = await authClient.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return jsonResponse({ detail: "Invalid session", code: "auth" }, 401);
  }
  const userId = userData.user.id;
  const isOwner = (userData.user.email || "").toLowerCase() === OWNER_EMAIL;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ detail: "Bad request", code: "bad_request" }, 400);
  }
  const action = body.action;
  if (action !== "extract" && action !== "generate") {
    return jsonResponse({ detail: "Unknown action", code: "bad_request" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { error: accessError } = await supabase.rpc("check_report_access", { p_user_id: userId });
  if (accessError) return jsonResponse({ detail: accessError.message }, 403);

  const isVisit = body.template === "visit";
  const extra = (typeof body.template === "string" && Object.prototype.hasOwnProperty.call(EXTRA_TEMPLATES, body.template))
    ? EXTRA_TEMPLATES[body.template]
    : null;
  const baseKey = isVisit ? "visit" : (extra ? String(body.template) : "short");
  const templateKey = action === "extract" ? baseKey + "_extract" : baseKey;
  const { data: templateRow } = await supabase
    .from("prompt_templates")
    .select("template")
    .eq("role_id", "teacher")
    .eq("template_key", templateKey)
    .maybeSingle();
  const template = templateRow?.template as string | undefined;

  if (action === "extract") {
    const transcript = asText(body.transcript, 4000);
    if (!transcript) return jsonResponse({ fields: {} });
    if (!template || GEMINI_KEYS.length === 0) {
      console.error("extract: template missing or no Gemini keys");
      return jsonResponse({ fields: {}, failed: true, reason: "not_configured" });
    }

    const prompt = fill(template, "{{TRANSCRIPT}}", transcript);
    let parsed: Record<string, unknown> | null = null;
    for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
      // المحاولة الثانية (بعد ردّ غير صالح أو فشل) بنماذج 2.5 الاحتياطية فقط.
      const raw = await callGemini(prompt, attempt === 0, 7000, attempt === 0 ? 14000 : 5000, attempt === 0 ? ALL_MODELS : FALLBACK_MODELS);
      if (!raw) {
        console.error("extract attempt " + (attempt + 1) + ": no answer from Gemini");
        continue;
      }
      parsed = parseLooseJson(raw);
      if (!parsed) console.error("extract attempt " + (attempt + 1) + ": unparsable answer: " + raw.slice(0, 300));
    }
    if (!parsed) return jsonResponse({ fields: {}, failed: true, reason: lastGeminiIssue || "unparsable" });

    const fields: Record<string, string> = {};
    for (const key of (isVisit ? EXTRACT_KEYS_VISIT : (extra ? extra.extract : EXTRACT_KEYS))) {
      const v = asText(parsed[key], 1000);
      if (v) fields[key] = v;
    }
    return jsonResponse({ fields });
  }

  const reportData = (body.report_data && typeof body.report_data === "object")
    ? body.report_data as Record<string, unknown>
    : {};
  if (!asText(reportData.title, 300)) {
    return jsonResponse({ detail: "Title is required", code: "bad_request" }, 400);
  }
  if (!template) return jsonResponse({ detail: "Template not found", code: "template_missing" }, 500);
  if (GEMINI_KEYS.length === 0) return jsonResponse({ detail: "AI is not configured", code: "ai_unavailable" }, 500);

  let prompt = template;
  for (const [placeholder, dataKey] of Object.entries(isVisit ? GENERATE_VARS_VISIT : (extra ? extra.vars : GENERATE_VARS))) {
    prompt = fill(prompt, "{" + placeholder + "}", asText(reportData[dataKey], 1500) || NOT_MENTIONED);
  }

  if (body.gender === "female") prompt += FEMALE_NOTE;
  const rawContent = await callGemini(prompt, false, 30000, 75000);
  const usedModel = lastGeminiModel || null;
  if (!rawContent) {
    return jsonResponse({ detail: "AI is unavailable right now", code: "ai_unavailable" }, 502);
  }
  const content = rawContent
    .split("**").join("")
    .split("*").join("")
    .split("##").join("")
    .split("#").join("")
    .split("`").join("");

  const { error: consumeError } = await supabase.rpc("consume_report_usage", { p_user_id: userId });
  if (consumeError) return jsonResponse({ detail: consumeError.message }, 403);

  const role = asText(body.role, 50) || "teacher";
  let reporterName: string | null = null;
  try {
    const { data: prof } = await supabase.from("profiles").select("reporter_name, username").eq("id", userId).maybeSingle();
    reporterName = ((prof?.reporter_name || prof?.username || "") as string).slice(0, 120) || null;
  } catch (_e) {
    reporterName = null;
  }
  const inputMethod = body.input_method === "voice" || body.input_method === "typed" ? body.input_method : null;
  const { error: logError } = await supabase.from("report_generation_log").insert({
    user_id: userId,
    role,
    report_id: null,
    title: asText(reportData.title, 300) || null,
    template_kind: baseKey,
    input_method: inputMethod,
    reporter_name: reporterName,
    ai_model: usedModel,
  });
  if (logError) console.error("report_generation_log insert failed: " + logError.message);

  const feedback = body.voice_corrections_feedback;
  if (Array.isArray(feedback) && feedback.length) {
    const rows = feedback
      .filter((c) =>
        !!c && typeof c.field_name === "string" && typeof c.original_text === "string" &&
        typeof c.suggested_text === "string" && typeof c.accepted === "boolean"
      )
      .slice(0, 20)
      .map((c) => ({
        user_id: userId,
        field_name: c.field_name.slice(0, 50),
        original_text: c.original_text.slice(0, 500),
        suggested_text: c.suggested_text.slice(0, 500),
        accepted: c.accepted,
      }));
    if (rows.length) {
      const { error: fbError } = await supabase.from("voice_field_corrections").insert(rows);
      if (fbError) console.error("voice_field_corrections insert failed: " + fbError.message);
    }
  }

  return jsonResponse({ content, generated_at: new Date().toISOString(), ...(isOwner ? { ai_model: usedModel } : {}) });
};

Deno.serve(async (req: Request) => {
  const res = await handleRequest(req);
  await scheduleCallLogFlush();
  return res;
});
