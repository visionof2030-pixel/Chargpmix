import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// استخراج درجات الطلاب من صورة أو PDF لكشف درجات. تُرجع الأرقام فقط (دون أسماء)
// ولا تُخزَّن الملفات ولا محتواها: تُرسل مباشرة إلى النموذج ثم تُهمل.

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
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_FILES = 6;
const MAX_FILE_B64 = 8_000_000;
const MAX_TOTAL_B64 = 16_000_000;
const MAX_SCORES = 400;

const PROMPT = [
  "أنت أداة لقراءة كشوف درجات الطلاب. المرفقات صور أو PDF لجدول درجات (قد تكون عدة صفحات لنفس الكشف).",
  "المطلوب: استخرج درجة كل طالب فقط، بترتيب ظهورهم في الجدول، من عمود الدرجة النهائية أو المجموع إن وُجد عدة أعمدة (وإن وُجد عمود واحد للاختبار فاستخدمه).",
  "قواعد صارمة:",
  "- لا تُخرج أي اسم أو رقم هوية أو رقم سجل مدني أو أي معلومة تعرّف بالطالب إطلاقاً. الأرقام (الدرجات) فقط.",
  "- تجاهل الطلاب الغائبين أو من لا درجة لهم أو من كانت خانتهم فارغة أو غير مقروءة، ولا تخمّن درجة غير واضحة، وعُدّهم في skipped.",
  "- الدرجات أرقام عادية (قد تكون عشرية مثل 17.5). حوّل الأرقام الهندية (٠١٢٣) إلى أرقام إنجليزية.",
  "- لا تُدخل في scores أرقام التسلسل أو الصفوف أو رقم الفصل أو المجاميع الكلية للصف في أسفل الجدول.",
  "- إن ذُكرت الدرجة العظمى للاختبار في رأس الجدول أو الصفحة فضعها في max_score، وإلا فاجعلها null.",
  "- إن ظهرت مادة الاختبار فضعها في subject، وإلا null.",
  "- في column وصف قصير جداً بالعربية للعمود الذي أخذت منه الدرجات.",
  "أعد JSON فقط بهذا الشكل بلا أي نص آخر:",
  '{"scores":[number,...],"max_score":number|null,"subject":string|null,"column":string,"skipped":number}',
].join("\n");

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

let lastIssue = "";

async function callGemini(parts: unknown[], perAttemptMs: number, overallMs: number): Promise<string | null> {
  const keys = shuffledKeyOrder();
  const deadline = Date.now() + overallMs;
  lastIssue = "";
  for (let i = 0; i < keys.length; i++) {
    for (const model of GEMINI_MODELS) {
      const remaining = deadline - Date.now();
      if (remaining < 4000) {
        lastIssue = "deadline";
        return null;
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(perAttemptMs, remaining));
      try {
        const generationConfig: Record<string, unknown> = { temperature: 0, responseMimeType: "application/json" };
        if (model === "gemini-2.5-flash") generationConfig.thinkingConfig = { thinkingBudget: 512 };
        const resp = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + keys[i],
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts }], generationConfig }),
            signal: controller.signal,
          },
        );
        if (!resp.ok) {
          lastIssue = model + " HTTP " + resp.status;
          console.error("Gemini key " + (i + 1) + "/" + keys.length + " (" + model + ") failed: HTTP " + resp.status);
          continue;
        }
        const data = await resp.json();
        const outParts = data?.candidates?.[0]?.content?.parts ?? [];
        const text = outParts.map((p: { text?: string }) => p.text || "").join("");
        if (text) return text;
        lastIssue = model + " empty";
      } catch (e) {
        lastIssue = model + " " + (e instanceof Error ? e.name : "error");
        console.error("Gemini key " + (i + 1) + "/" + keys.length + " (" + model + ") threw: " + (e instanceof Error ? e.message : String(e)));
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
      if (Array.isArray(v)) v = { scores: v };
      if (v && typeof v === "object") return v as Record<string, unknown>;
    } catch { /* try next */ }
  }
  return null;
}

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const s = v.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace("٫", ".").replace(",", ".").trim();
    if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonResponse({ detail: "Method not allowed" }, 405);

  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return jsonResponse({ detail: "Login required", code: "auth" }, 401);
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: userData, error: userError } = await authClient.auth.getUser(jwt);
  if (userError || !userData?.user) return jsonResponse({ detail: "Invalid session", code: "auth" }, 401);
  const userId = userData.user.id;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ detail: "Bad request", code: "bad_request" }, 400);
  }
  const files = Array.isArray(body.files) ? (body.files as Array<Record<string, unknown>>) : [];
  if (!files.length || files.length > MAX_FILES) return jsonResponse({ detail: "Files required", code: "bad_request" }, 400);
  const parts: unknown[] = [{ text: PROMPT }];
  let total = 0;
  for (const f of files) {
    const mime = typeof f?.mime === "string" ? f.mime : "";
    const data = typeof f?.data === "string" ? f.data.replace(/^data:[^,]*,/, "") : "";
    if (!ALLOWED_MIME.has(mime) || !data || !/^[A-Za-z0-9+/=\s]+$/.test(data.slice(0, 2000))) return jsonResponse({ detail: "Unsupported file", code: "bad_file" }, 400);
    if (data.length > MAX_FILE_B64) return jsonResponse({ detail: "File too large", code: "too_large" }, 413);
    total += data.length;
    if (total > MAX_TOTAL_B64) return jsonResponse({ detail: "Files too large", code: "too_large" }, 413);
    parts.push({ inline_data: { mime_type: mime, data } });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { error: accessError } = await supabase.rpc("check_report_access", { p_user_id: userId });
  if (accessError) return jsonResponse({ detail: accessError.message }, 403);

  if (GEMINI_KEYS.length === 0) return jsonResponse({ failed: true, reason: "not_configured" });

  let parsed: Record<string, unknown> | null = null;
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    const raw = await callGemini(parts, 55000, attempt === 0 ? 110000 : 30000);
    if (!raw) continue;
    parsed = parseLooseJson(raw);
    if (!parsed) console.error("extract-grades: unparsable answer (length " + raw.length + ")");
  }
  if (!parsed) return jsonResponse({ failed: true, reason: lastIssue || "unparsable" });

  const rawScores = Array.isArray(parsed.scores) ? parsed.scores : [];
  const scores: number[] = [];
  let dropped = 0;
  for (const v of rawScores) {
    const n = toNum(v);
    if (n === null || n < 0 || n > 1000) { dropped++; continue; }
    scores.push(Math.round(n * 100) / 100);
    if (scores.length >= MAX_SCORES) break;
  }
  const ms = toNum(parsed.max_score);
  const skippedRaw = toNum(parsed.skipped);
  const subject = typeof parsed.subject === "string" ? parsed.subject.trim().slice(0, 80) : "";
  const column = typeof parsed.column === "string" ? parsed.column.trim().slice(0, 80) : "";
  console.log("extract-grades: files=" + files.length + " scores=" + scores.length);
  return jsonResponse({
    scores,
    max_score: ms && ms > 0 && ms <= 1000 ? ms : null,
    subject,
    column,
    skipped: (skippedRaw ?? 0) + dropped,
  });
});
