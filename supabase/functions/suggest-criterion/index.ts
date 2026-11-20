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
// المرور: النموذج الأساسي على كل المفاتيح أولاً، ثم الاحتياطي.
const PRIMARY_MODEL = "gemini-3.1-flash-lite";
const ALL_MODELS = [PRIMARY_MODEL, "gemini-2.5-flash-lite", "gemini-2.5-flash"];
const FALLBACK_MODELS = ALL_MODELS.slice(1);

const MIN_SCORE = 60;
const MAX_MATCHES = 3;
const CATALOG_TTL_MS = 10 * 60 * 1000;

const L_CRITERION = "المعيار";
const L_EXAMPLES = "أمثلة";
const SEP = "؛ ";
const DASH = " — ";
const NONE_TEXT = "لا توجد";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function asText(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function shuffledKeyOrder(): string[] {
  const n = GEMINI_KEYS.length;
  if (n === 0) return [];
  const start = Math.floor(Math.random() * n);
  return Array.from({ length: n }, (_, i) => GEMINI_KEYS[(start + i) % n]);
}

let lastIssue = "";

async function callGemini(prompt: string, perAttemptMs: number, overallMs: number, jsonMode = true, models: string[] = ALL_MODELS): Promise<string | null> {
  const keys = shuffledKeyOrder();
  const deadline = Date.now() + overallMs;
  lastIssue = "";
  for (const model of models) {
    let skipModel = false;
    for (let i = 0; i < keys.length && !skipModel; i++) {
      const remaining = deadline - Date.now();
      if (remaining < 2000) {
        lastIssue = "deadline";
        return null;
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(perAttemptMs, remaining));
      try {
        const generationConfig: Record<string, unknown> = {};
        // نماذج الجيل الثالث: تُترك الحرارة والتفكير على الافتراضي (توصية Google).
        if (!model.startsWith("gemini-3")) generationConfig.temperature = 0;
        if (jsonMode) generationConfig.responseMimeType = "application/json";
        if (model === "gemini-2.5-flash") generationConfig.thinkingConfig = { thinkingBudget: 0 };
        const resp = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + keys[i],
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
            signal: controller.signal,
          },
        );
        if (!resp.ok) {
          lastIssue = model + " HTTP " + resp.status;
          console.error("Gemini key " + (i + 1) + "/" + keys.length + " (" + model + ") failed: HTTP " + resp.status);
          if (resp.status === 400 || resp.status === 404) skipModel = true;
          continue;
        }
        const data = await resp.json();
        const parts = data?.candidates?.[0]?.content?.parts ?? [];
        const text = parts.map((p: { text?: string }) => p.text || "").join("");
        if (text) {
          console.log("gemini ok model=" + model + " key=" + (i + 1));
          return text;
        }
        lastIssue = model + " empty";
      } catch (e) {
        lastIssue = model + " " + (e instanceof Error ? e.name : "error");
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

function salvageMatches(raw: string): Record<string, unknown> | null {
  const matches: Array<Record<string, unknown>> = [];
  const objs = raw.match(/\{[^{}]*\}/g) || [];
  for (const o of objs) {
    const n = o.match(/"n"\s*:\s*"?(\d+)"?/);
    const sc = o.match(/"score"\s*:\s*"?(\d+)"?/);
    if (!n || !sc) continue;
    const r = o.match(/"reason"\s*:\s*"([\s\S]*)"\s*\}?\s*$/);
    matches.push({ n: Number(n[1]), score: Number(sc[1]), reason: r ? r[1].replace(/\s*"\s*\}?\s*$/, "").slice(0, 300) : "" });
  }
  if (matches.length) return { matches };
  if (/"matches"\s*:\s*\[\s*\]/.test(raw)) {
    const nr = raw.match(/"none_reason"\s*:\s*"([\s\S]*?)"\s*[,}]/);
    return { matches: [], none_reason: nr ? nr[1] : "" };
  }
  return null;
}

function normAr(t: string): string {
  return t
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[،؛؟]/g, " ")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^؀-ۿa-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
const STOP_WORDS = new Set(["تقرير", "عن", "حول", "في", "من", "على", "الي", "مع", "و", "او", "ان", "هذا", "هذه"]);
function stemWord(w: string): string {
  let s = w.replace(/^(وال|بال|كال|فال|لل|ال)/, "");
  if (s.length > 4) s = s.replace(/(ات|ون|ين|ان|ه|ي)$/, "");
  return s;
}
function tokens(t: string): string[] {
  return normAr(t).split(" ").filter((w) => w && !STOP_WORDS.has(w)).map(stemWord).filter((w) => w.length > 1);
}
const LEX_REASON = "عنوانك قريب جداً من عنوان تقرير جاهز في هذا التصنيف: ";

function lexicalMatches(title: string, catalog: Catalog): Array<Record<string, unknown>> {
  const A = new Set(tokens(title));
  if (A.size < 2) return [];
  const best = new Map<number, { score: number; report: string }>();
  for (const [n, reports] of catalog.reportsBySub) {
    for (const rep of reports) {
      const B = new Set(tokens(rep));
      let inter = 0;
      for (const w of A) if (B.has(w)) inter++;
      if (inter < 2) continue;
      const cover = inter / A.size;
      const jac = inter / (A.size + B.size - inter);
      if (cover < 0.6) continue;
      const score = Math.round(100 * (0.65 * cover + 0.35 * jac));
      if (score >= MIN_SCORE && (!best.has(n) || best.get(n)!.score < score)) best.set(n, { score, report: rep });
    }
  }
  return [...best.entries()].sort((a, b) => b[1].score - a[1].score).slice(0, MAX_MATCHES).map(([n, v]) => {
    const e = catalog.byNumber.get(n)!;
    return {
      criterion_id: e.criterion_id,
      criterion_name: e.criterion_name,
      subcategory_id: e.subcategory_id,
      subcategory_name: e.subcategory_name,
      score: Math.min(v.score, 96),
      reason: LEX_REASON + "«" + v.report + "»",
    };
  });
}

interface SubEntry {
  n: number;
  criterion_id: string;
  criterion_name: string;
  subcategory_id: string;
  subcategory_name: string;
}
interface Catalog {
  text: string;
  byNumber: Map<number, SubEntry>;
  reportsBySub: Map<number, string[]>;
  at: number;
}
const catalogCache = new Map<string, Catalog>();

async function loadCatalog(supabase: ReturnType<typeof createClient>, role: string): Promise<Catalog | null> {
  const hit = catalogCache.get(role);
  if (hit && Date.now() - hit.at < CATALOG_TTL_MS) return hit;
  const { data, error } = await supabase.rpc("get_full_structure", { p_role: role });
  if (error) {
    console.error("get_full_structure failed: " + error.message);
    return null;
  }
  const structure = (data as { structure?: Array<Record<string, unknown>> })?.structure ?? [];
  const byNumber = new Map<number, SubEntry>();
  const reportsBySub = new Map<number, string[]>();
  const lines: string[] = [];
  let n = 0;
  for (const crit of structure) {
    const subs = (crit.subcategories as Array<Record<string, unknown>> | undefined) ?? [];
    if (!subs.length) continue;
    lines.push("## " + L_CRITERION + ": " + String(crit.name));
    for (const sub of subs) {
      n++;
      byNumber.set(n, {
        n,
        criterion_id: String(crit.id),
        criterion_name: String(crit.name),
        subcategory_id: String(sub.id),
        subcategory_name: String(sub.name),
      });
      const reports = ((sub.reports as Array<Record<string, unknown>> | undefined) ?? []).map((r) => String(r.name));
      reportsBySub.set(n, reports);
      lines.push("[" + n + "] " + String(sub.name) + (reports.length ? DASH + L_EXAMPLES + ": " + reports.join(SEP) : ""));
    }
  }
  if (!byNumber.size) return null;
  const catalog: Catalog = { text: lines.join("\n"), byNumber, reportsBySub, at: Date.now() };
  catalogCache.set(role, catalog);
  return catalog;
}

function fill(template: string, token: string, value: string): string {
  return template.split(token).join(value);
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
  const title = asText(body.title, 300);
  if (!title) return jsonResponse({ detail: "Title is required", code: "bad_request" }, 400);
  const notes = asText(body.notes, 600);
  const roleRaw = asText(body.role, 40);
  const role = /^[a-z_]+$/.test(roleRaw) ? roleRaw : "teacher";

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { error: accessError } = await supabase.rpc("check_report_access", { p_user_id: userId });
  if (accessError) return jsonResponse({ detail: accessError.message }, 403);

  if (GEMINI_KEYS.length === 0) return jsonResponse({ matches: [], failed: true, reason: "not_configured" });

  const { data: templateRow } = await supabase
    .from("prompt_templates")
    .select("template")
    .eq("role_id", "teacher")
    .eq("template_key", "criterion_match")
    .maybeSingle();
  const template = templateRow?.template as string | undefined;
  const catalog = await loadCatalog(supabase, role);
  if (!template || !catalog) {
    console.error("suggest-criterion: template or catalog missing");
    return jsonResponse({ matches: [], failed: true, reason: "not_configured" });
  }

  let prompt = fill(template, "{{CATALOG}}", catalog.text);
  prompt = fill(prompt, "{{NOTES}}", notes || NONE_TEXT);
  prompt = fill(prompt, "{{TITLE}}", title);

  let parsed: Record<string, unknown> | null = null;
  let rawSnippet = "";
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    // المحاولة الثانية (بعد ردّ غير صالح أو فشل) بنماذج 2.5 الاحتياطية فقط.
    const raw = await callGemini(prompt, 14000, attempt === 0 ? 24000 : 9000, attempt === 0, attempt === 0 ? ALL_MODELS : FALLBACK_MODELS);
    if (!raw) continue;
    parsed = parseLooseJson(raw) || salvageMatches(raw);
    if (!parsed) {
      rawSnippet = raw.replace(/\s+/g, " ").slice(0, 120);
      console.error("suggest-criterion: unparsable answer: " + raw.slice(0, 300));
    }
  }
  const lexical = lexicalMatches(title, catalog);
  if (!parsed) {
    if (lexical.length) return jsonResponse({ matches: lexical, none_reason: "", analysis: "", source: "lexical" });
    return jsonResponse({ matches: [], failed: true, reason: lastIssue || ("unparsable: " + rawSnippet) });
  }

  const seen = new Set<number>();
  const matches: Array<Record<string, unknown>> = [];
  const rawMatches = Array.isArray(parsed.matches) ? parsed.matches : [];
  for (const m of rawMatches as Array<Record<string, unknown>>) {
    const n = Number(m?.n);
    const score = Math.round(Number(m?.score));
    const entry = catalog.byNumber.get(n);
    if (!entry || seen.has(n) || !(score >= MIN_SCORE)) continue;
    seen.add(n);
    matches.push({
      criterion_id: entry.criterion_id,
      criterion_name: entry.criterion_name,
      subcategory_id: entry.subcategory_id,
      subcategory_name: entry.subcategory_name,
      score: Math.min(score, 100),
      reason: asText(m.reason, 300),
    });
  }
  for (const lm of lexical) {
    if ((lm.score as number) >= 80 && !matches.some((m) => m.subcategory_id === lm.subcategory_id)) matches.push(lm);
  }
  matches.sort((a, b) => (b.score as number) - (a.score as number));
  if (!matches.length && lexical.length) matches.push(...lexical);

  return jsonResponse({
    matches: matches.slice(0, MAX_MATCHES),
    none_reason: matches.length ? "" : asText(parsed.none_reason, 300),
    analysis: asText(parsed.analysis, 400),
  });
});
