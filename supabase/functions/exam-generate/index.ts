// exam-generate: يولّد أسئلة اختبار نهائي (إنجليزي — المرحلة المتوسطة) وفق توزيع الوزارة.
// للمالك فقط حالياً. الصفحة exam.html تبني «مخطط الشمول» (كل فقرة مرتبطة بوحدة وقاعدة/كلمة)
// وترسل قسماً واحداً في كل طلب، والنموذج يكتب الفقرات المطلوبة بالضبط — فلا يختار هو ما يُغطّى.
// المدخلات: { section, grade, term, difficulty, items:[{kind, unit, unitTitle, target, words?}], ctx? }
// المخرجات: { items:[...] } بنفس ترتيب الطلب، أو { data:{...} } للقراءة والتعبير.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OWNER_EMAIL = "ifahadenglish@gmail.com";

const GEMINI_KEYS: string[] = [];
const KEY_SLOT = new Map<string, number>();
for (let n = 1; n <= 10; n++) {
  const k = Deno.env.get("GEMINI_API_KEY_" + n);
  if (k && !KEY_SLOT.has(k)) { GEMINI_KEYS.push(k); KEY_SLOT.set(k, n); }
}
// جودة الأسئلة أهم من السرعة هنا: 2.5-flash أولاً، ثم البدائل الأخف.
const MODELS = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"];

// ===== سجل الاستهلاك (رقم خانة المفتاح فقط) =====
const CALL_LOG: Array<Record<string, unknown>> = [];
const CALL_LOG_PENDING: Promise<unknown>[] = [];
async function geminiFetch(key: string, model: string, init: RequestInit): Promise<Response> {
  const t0 = Date.now();
  const slot = KEY_SLOT.get(key) ?? null;
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + key, init);
    const base = { fn: "exam-generate", key_slot: slot, model, http_status: r.status, ms: Date.now() - t0 };
    if (r.ok) {
      CALL_LOG_PENDING.push(r.clone().json().then((j) => {
        const u = j?.usageMetadata || {};
        CALL_LOG.push({ ...base, status: "ok", prompt_tokens: u.promptTokenCount ?? null, output_tokens: u.candidatesTokenCount ?? null, total_tokens: u.totalTokenCount ?? null });
      }).catch(() => { CALL_LOG.push({ ...base, status: "ok" }); }));
    } else CALL_LOG.push({ ...base, status: "http_" + r.status });
    return r;
  } catch (e) {
    CALL_LOG.push({ fn: "exam-generate", key_slot: slot, model, http_status: null, ms: Date.now() - t0, status: e instanceof Error && e.name === "AbortError" ? "timeout" : "error" });
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
  } catch (_e) { console.error("ai_call_log flush failed"); }
}
function scheduleCallLogFlush(): Promise<void> | void {
  const er = (globalThis as unknown as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
  if (er && typeof er.waitUntil === "function") { er.waitUntil(flushCallLog()); return; }
  return flushCallLog();
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}
const txt = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max) : "");

type Spec = { kind: string; unit: number; unitTitle: string; target: string; words: string[] };
function readSpecs(v: unknown): Spec[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 30).map((s) => {
    const o = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
    return {
      kind: txt(o.kind, 30), unit: Number(o.unit) || 0, unitTitle: txt(o.unitTitle, 80), target: txt(o.target, 160),
      words: Array.isArray(o.words) ? o.words.slice(0, 40).map((w) => txt(w, 40)).filter(Boolean) : [],
    };
  });
}

const LEVEL: Record<string, string> = {
  easy: "EASY: short simple sentences, very familiar words, distractors clearly wrong.",
  medium: "MEDIUM: typical end-of-term level, distractors plausible but only one correct.",
  hard: "HARD: longer sentences, close distractors (same word family / similar form), still strictly within the curriculum.",
};

function header(grade: string, term: string, difficulty: string) {
  return `You write questions for a Saudi Ministry of Education English final exam.
Students: ${grade} (intermediate stage, Super Goal series), term ${term}. Learners are Saudi teenagers (A1–A2).
Difficulty: ${LEVEL[difficulty] || LEVEL.medium}
Rules:
- Use ONLY the grammar and vocabulary of the given units. Never test anything outside them.
- Natural, correct English; culturally appropriate for Saudi Arabia (Saudi names, places, food). No music, dating or inappropriate content.
- Exactly one correct answer per item. Shuffle the position of the correct option.
- Return JSON only, no markdown.`;
}

function specLines(specs: Spec[]) {
  return specs.map((s, i) => `${i + 1}. [${s.kind}] Unit ${s.unit} "${s.unitTitle}" — target: ${s.target}${s.words.length ? " — unit words: " + s.words.join(", ") : ""}`).join("\n");
}

function buildPrompt(section: string, h: string, specs: Spec[], ctx: Record<string, unknown>): string | null {
  const lines = specLines(specs);
  if (section === "grammar") {
    return `${h}
Write one grammar item for EACH line below, in the same order, testing exactly the given target point.
- kind "mcq": a sentence with ONE blank "____" and 4 options (all the same word class / verb forms of the same verb).
- kind "do": a "do as shown" task. Pick the instruction that best fits the target, e.g. "Correct the mistake", "Rearrange", "Make a Yes/No question", "Make a question", "Change into negative", "Change into passive", "Join using who/which", "Use the correct form of the verb". For "Rearrange" give the words separated by " – ". For "Correct the mistake" the sentence must contain exactly one error in the target point.
${lines}
JSON: {"items":[{"kind":"mcq","stem":"...","options":["","","",""],"answer":"<exact option>"} | {"kind":"do","sentence":"...","instruction":"...","answer":"<the full correct answer>"}]}`;
  }
  if (section === "vocab") {
    return `${h}
Write one vocabulary item for EACH line below, in the same order, testing the given target word (a word from that unit).
- kind "mcq": a sentence with ONE blank "____" where the target word is the answer; 4 options from the same unit/word class.
- kind "match": give a short simple meaning/definition (max 5 words) or synonym of the target word.
- kind "picture": just return the word (it must be a concrete, picturable noun or action; if the target is not picturable choose another picturable word from the unit words).
- kind "odd": 4 words where 3 belong to one category from the unit and 1 (the target or another word) is the odd one; give the odd word as answer.
${lines}
JSON: {"items":[{"kind":"mcq","stem":"...","options":["","","",""],"answer":"..."} | {"kind":"match","word":"...","meaning":"..."} | {"kind":"picture","word":"..."} | {"kind":"odd","options":["","","",""],"answer":"..."}]}`;
  }
  if (section === "spelling") {
    return `${h}
Orthography: for EACH line write a short sentence that contains the target word with ONE letter missing (write the word with "_" in place of that letter, e.g. "ve_etables"). Give 3 single-letter choices (one correct) — choose distractor letters that are typical spelling confusions for Arab learners (b/p, f/v, c/k/s, e/i, g/j...). The missing letter must not be the first letter if avoidable.
${lines}
JSON: {"items":[{"word":"<full word>","sentence":"<sentence with the gapped word>","choices":["","",""],"answer":"<letter>"}]}`;
  }
  if (section === "reading") {
    const s = specs[0];
    const n = Number(ctx.words) || 120;
    return `${h}
Write an ORIGINAL reading passage (about ${n} words, 2 short paragraphs, with a title) on the theme of Unit ${s?.unit} "${s?.unitTitle}" (${s?.target}). Use the unit vocabulary: ${(s?.words || []).join(", ")}.
Use mainly these structures from the term: ${txt(ctx.grammar, 600)}.
Then write:
- 5 multiple-choice questions (4 options each) about the passage: 3 detail questions, 1 reference question ("<pronoun> in line X refers to:" — the pronoun must really appear in that line when the passage is split into lines of about 15 words), 1 vocabulary-in-context or main-idea question.
- 4 true/false statements (mix of true and false; false ones change one fact).
JSON: {"data":{"title":"...","passage":"...","mcq":[{"q":"...","options":["","","",""],"answer":"..."}],"tf":[{"s":"...","answer":true}]}}`;
  }
  if (section === "composition") {
    const s = specs[0];
    const mode = ctx.mode === "wordbox" ? "wordbox" : "guided";
    if (mode === "wordbox") {
      return `${h}
Guided composition (word box). Topic from Unit ${s?.unit} "${s?.unitTitle}" (${s?.target}).
Write a short first-person paragraph (60–90 words) with exactly 8 blanks written as "____". Give the 8 missing words/phrases (each 1–4 words) in order. Students fill the blanks from a box. Use unit words: ${(s?.words || []).join(", ")}.
JSON: {"data":{"mode":"wordbox","title":"...","instructions":"Fill in the blanks with a suitable word from the box below","paragraph":"...","answers":["", "", "", "", "", "", "", ""]}}`;
    }
    return `${h}
Guided composition. Topic from Unit ${s?.unit} "${s?.unitTitle}" (${s?.target}). Give a short title (2–4 words), one instruction line, and 5 guiding questions in a logical order that help the student write a paragraph of about 60–80 words using the unit's grammar and words (${(s?.words || []).join(", ")}). Also write a model answer paragraph (for the teacher's answer key).
JSON: {"data":{"mode":"guided","title":"...","instructions":"...","questions":["","","","",""],"model":"..."}}`;
  }
  return null;
}

async function callGemini(prompt: string, deadlineMs: number): Promise<string | null> {
  const n = GEMINI_KEYS.length;
  if (!n) return null;
  const start = Math.floor(Math.random() * n);
  const keys = Array.from({ length: n }, (_, i) => GEMINI_KEYS[(start + i) % n]);
  const deadline = Date.now() + deadlineMs;
  for (const model of MODELS) {
    let skipModel = false;
    for (let i = 0; i < Math.min(keys.length, 4) && !skipModel; i++) {
      const remaining = deadline - Date.now();
      if (remaining < 3000) return null;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(40000, remaining));
      try {
        const generationConfig: Record<string, unknown> = { responseMimeType: "application/json" };
        if (!model.startsWith("gemini-3")) generationConfig.temperature = 0.8;
        if (model === "gemini-2.5-flash") generationConfig.thinkingConfig = { thinkingBudget: 1024 };
        const resp = await geminiFetch(keys[i], model, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
          signal: controller.signal,
        });
        if (!resp.ok) {
          console.error("Gemini key slot " + KEY_SLOT.get(keys[i]) + " (" + model + ") HTTP " + resp.status);
          if (resp.status === 400 || resp.status === 404 || resp.status === 503) skipModel = true;
          continue;
        }
        const data = await resp.json();
        const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text || "").join("");
        if (text) return text;
      } catch (e) {
        console.error("Gemini (" + model + ") threw: " + (e instanceof Error ? e.name : "error"));
        if (e instanceof Error && e.name === "AbortError") skipModel = true;
      } finally { clearTimeout(timer); }
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
  // للمالك فقط حالياً
  if (String(userData.user.email || "").toLowerCase() !== OWNER_EMAIL) return jsonResponse({ detail: "Not available", code: "forbidden" }, 403);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return jsonResponse({ detail: "Bad request", code: "bad_request" }, 400); }
  const section = txt(body.section, 20);
  const specs = readSpecs(body.items);
  const ctx = (body.ctx && typeof body.ctx === "object" ? body.ctx : {}) as Record<string, unknown>;
  const h = header(txt(body.grade, 40) || "Intermediate", txt(body.term, 10) || "1", txt(body.difficulty, 10));
  const prompt = specs.length ? buildPrompt(section, h, specs, ctx) : null;
  if (!prompt) return jsonResponse({ detail: "Bad request", code: "bad_request" }, 400);
  if (!GEMINI_KEYS.length) return jsonResponse({ failed: true, reason: "not_configured" });

  const raw = await callGemini(prompt, 95000);
  if (!raw) return jsonResponse({ failed: true, reason: "no_answer" });
  try {
    const c = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
    const v = JSON.parse(c.slice(c.indexOf("{"), c.lastIndexOf("}") + 1));
    if (!v || typeof v !== "object") throw new Error("shape");
    return jsonResponse({ items: Array.isArray(v.items) ? v.items : undefined, data: v.data && typeof v.data === "object" ? v.data : undefined });
  } catch { return jsonResponse({ failed: true, reason: "unparsable" }); }
};

Deno.serve(async (req: Request) => {
  const res = await handleRequest(req);
  await scheduleCallLogFlush();
  return res;
});
