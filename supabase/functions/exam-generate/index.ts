// exam-generate: يولّد أسئلة اختبار نهائي وفق توزيع الوزارة: الإنجليزي (المرحلة المتوسطة) والرياضيات (وفق جدول المواصفات).
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
// gemini-2.5-flash غير متاح لهذه المفاتيح (404)، فنبدأ بـ 3.1-flash-lite ثم 2.5-flash-lite.
const MODELS = ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite"];

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
      words: Array.isArray(o.words) ? o.words.slice(0, 50).map((w) => txt(w, 40)).filter(Boolean) : [],
    };
  });
}

// ستة مستويات — كل مستوى يغيّر طول الجمل وقرب المشتتات ونوع أسئلة القراءة فعلاً (والمنهج نفسه لا يتغير)
const LEVEL: Record<string, string> = {
  veasy: "VERY EASY (level 1 of 6): very short sentences (5–7 words), only the most frequent unit words, one clear context clue in every item, distractors obviously wrong (different form/meaning that clearly does not fit).",
  easy: "EASY (level 2 of 6): short simple sentences (6–9 words), familiar unit words, a clear context clue, distractors clearly wrong.",
  medium: "MEDIUM (level 3 of 6): typical end-of-term level, sentences of 8–12 words, distractors plausible but only one correct.",
  mhard: "MEDIUM-HARD (level 4 of 6): sentences of 10–14 words with fewer direct clues, distractors close (similar forms of the same point), the student must read the whole sentence to decide.",
  hard: "HARD (level 5 of 6): longer sentences (12–16 words), compound sentences, close distractors (same word family / similar form), clue placed away from the blank.",
  vhard: "VERY HARD (level 6 of 6): the longest and most demanding sentences in the curriculum (14–18 words), subtle clues, the closest possible distractors (same word family, same verb in different forms), but STILL strictly within the curriculum — never harder grammar or vocabulary than the units.",
};
const READ_MIX: Record<string, string> = {
  veasy: "5 multiple-choice questions: 4 direct detail questions whose answers use the exact words of the passage, 1 simple best-title question",
  easy: "5 multiple-choice questions: 4 direct detail questions, 1 best-title question",
  medium: "5 multiple-choice questions: 3 detail questions, 1 reference question (\"The word '<pronoun>' in paragraph N refers to:\" — the pronoun must really appear in that paragraph), 1 main-idea / best-title question",
  mhard: "5 multiple-choice questions: 2 detail questions (answers paraphrased, not copied), 1 reference question (pronoun really in that paragraph), 1 simple inference question, 1 main-idea question",
  hard: "5 multiple-choice questions: 2 paraphrased detail questions, 1 reference question (pronoun really in that paragraph), 1 inference question, 1 word-meaning-from-context question (a unit word in the passage)",
  vhard: "5 multiple-choice questions: 1 paraphrased detail question, 1 reference question (pronoun really in that paragraph), 1 inference question, 1 word-meaning-from-context question, 1 main-idea / writer's purpose question",
};
const lvl = (d: string) => (LEVEL[d] ? d : d === "easy" || d === "hard" ? d : "medium");

function header(grade: string, term: string, difficulty: string) {
  return `You write questions for a Saudi Ministry of Education English final exam.
Students: ${grade}${/primary/i.test(grade) ? " (primary stage, Top Goal series), term " + term + ". Learners are Saudi children aged 10–12 (A1): keep sentences short and simple, everyday child-friendly contexts (school, family, food, sports, animals)." : " (intermediate stage, Super Goal series), term " + term + ". Learners are Saudi teenagers (A1–A2)."}
Difficulty: ${LEVEL[lvl(difficulty)]}
Rules:
- Use ONLY the grammar and vocabulary of the given units. Never test anything outside them, and never invent a grammar rule or structure that is not in the given points.
- Natural, correct English; culturally appropriate for Saudi Arabia (Saudi names, places, food). No dating or inappropriate content; mention music or instruments only when it is a target unit word.
- Exactly one correct answer per item. Shuffle the position of the correct option.
- Return JSON only, no markdown.`;
}

function specLines(specs: Spec[]) {
  return specs.map((s, i) => `${i + 1}. [${s.kind}] Unit ${s.unit} "${s.unitTitle}" — target: ${s.target}${s.words.length ? " — unit words: " + s.words.join(", ") : ""}`).join("\n");
}

function buildPrompt(section: string, h0: string, specs: Spec[], ctx: Record<string, unknown>): string | null {
  const lines = specLines(specs);
  // نموذج بديل: نصوص النموذج الأول التي يجب ألا تتكرر
  const avoid = Array.isArray(ctx.avoid) ? (ctx.avoid as unknown[]).slice(0, 40).map((x) => txt(x, 200)).filter(Boolean) : [];
  const h1 = avoid.length ? `${h0}
This is an ALTERNATIVE exam form. Do NOT reuse, copy or lightly paraphrase any of these existing items/texts from the first form — write completely new sentences, contexts, names and distractors (same grammar points / words where required):
${avoid.map((a) => "- " + a).join("\n")}` : h0;
  // التنويع: أسماء ومواقف عشوائية من الصفحة + ما ورد في الاختبارات السابقة حتى لا يتكرر
  const recent = Array.isArray(ctx.recent) ? (ctx.recent as unknown[]).slice(0, 40).map((x) => txt(x, 160)).filter(Boolean) : [];
  const names = Array.isArray(ctx.names) ? (ctx.names as unknown[]).slice(0, 8).map((x) => txt(x, 30)).filter(Boolean) : [];
  const scenes = Array.isArray(ctx.scenes) ? (ctx.scenes as unknown[]).slice(0, 6).map((x) => txt(x, 60)).filter(Boolean) : [];
  const vary = `${names.length ? "\nVariety: when a sentence needs people, prefer these names: " + names.join(", ") + "." : ""}${scenes.length ? "\nVariety: set the sentences in varied everyday situations such as: " + scenes.join("; ") + " (only where they fit the target naturally)." : ""}
Vary sentence patterns: statements, questions, short dialogues (A: … B: …), first and third person — do not start items the same way.${recent.length ? "\nThese items/texts appeared in this teacher's recent exams — do NOT repeat them or write close paraphrases; use new sentences, contexts and distractors:\n" + recent.map((a) => "- " + a).join("\n") : ""}`;
  const h = h1 + vary;
  // عدد الخيارات: 4 (قالب الوزارة) أو 3 (قالب التصحيح الآلي A/B/C)
  const no = Number(ctx.nopts) === 3 ? 3 : 4;
  const oj = JSON.stringify(Array(no).fill(""));
  if (section === "grammar") {
    return `${h}
Write one grammar item for EACH line below, in the same order, testing exactly the given target point.
Allowed grammar points (the ONLY grammar this exam may test): ${txt(ctx.allowed, 1500) || "the targets below"}.
- Be very careful: the item must test ONLY its target point. The sentence may contain any simple everyday words, but answering must never depend on a grammar rule outside the allowed points, and never invent a rule.
- Grammar items test GRAMMAR only: all options must be forms/variants of the same grammar point (e.g. big / bigger / biggest; is / are / am; who / which / where) — never vocabulary words with different meanings. Exactly one option is grammatically correct in the sentence.
- kind "mcq": a sentence with ONE blank "____" and ${no} options (all the same word class / verb forms of the same verb).
- kind "do": a "do as shown" task. Pick the instruction that best fits the target, e.g. "Correct the mistake", "Rearrange", "Make a Yes/No question", "Make a question", "Change into negative", "Change into passive", "Join using who/which", "Use the correct form of the verb". For "Rearrange" give the words separated by " – ". For "Correct the mistake" the sentence must contain exactly one error in the target point.
${lines}
Return valid JSON: {"items":[ ...one object per line above, in order... ]}
Object for kind "mcq": {"kind":"mcq","stem":"...","options":${oj},"answer":"<exact option>"}
Object for kind "do": {"kind":"do","sentence":"...","instruction":"...","answer":"<the full correct answer>"}`;
  }
  if (section === "grammar_review") {
    const its = Array.isArray(ctx.review) ? (ctx.review as unknown[]).slice(0, 20).map((x) => txt(x, 400)) : [];
    return `You are a strict curriculum checker for a Saudi school English exam (Super Goal / Top Goal series).
Allowed grammar points (the ONLY grammar the exam may test): ${txt(ctx.allowed, 1500)}.
For EACH numbered item below (it shows its intended target point), decide "ok": true ONLY if ALL are true:
1) it tests exactly its target point, and that point is in the allowed list;
2) answering it does not require any grammar rule outside the allowed list, and no new/invented rule is used;
3) for multiple choice: the options are forms/variants of the same grammar point (not different vocabulary), exactly ONE option is correct, and the marked answer is that correct option;
4) for "do as shown": the instruction fits the target point and the given answer is correct;
5) the English is natural and correct.
Ordinary everyday words in the sentence are fine — judge the GRAMMAR only.
${its.map((x, i) => `${i + 1}. ${x}`).join("\n")}
Return valid JSON: {"items":[{"ok":true,"why":""}, ...one per item, in order]} — "why" is a short reason when ok is false.`;
  }
  if (section === "vocab") {
    return `${h}
Write one vocabulary item for EACH line below, in the same order, testing the given target word (a word from that unit).
STRICT CURRICULUM VOCABULARY: every option, distractor and odd-one-out word MUST be taken ONLY from the unit words given on that line or from this word pool of the same book: ${txt(ctx.pool, 2500) || "(unit words only)"}. Never use any English word outside these lists as an option. The correct answer is the target word itself (you may change its form: plural / -ed / -ing).
- kind "mcq": a sentence with ONE blank "____" where the target word is the answer; ${no} options from the same unit/word class.
- kind "match": give a short simple meaning/definition (max 5 words) or synonym of the target word.
- kind "picture": just return the word (it must be a concrete, picturable noun or action; if the target is not picturable choose another picturable word from the unit words).
- kind "odd": 4 words (all from the lists above) where 3 belong to one category from the unit and 1 (the target or another word) is the odd one; give the odd word as answer.
${lines}
Return valid JSON: {"items":[ ...one object per line above, in order... ]}
Object for kind "mcq": {"kind":"mcq","stem":"...","options":${oj},"answer":"<exact option>"}
Object for kind "match": {"kind":"match","word":"...","meaning":"..."}
Object for kind "picture": {"kind":"picture","word":"..."}
Object for kind "odd": {"kind":"odd","options":["","","",""],"answer":"..."}`;
  }
  if (section === "spelling") {
    return `${h}
Orthography: for EACH line write ONE short, simple sentence (6–12 words) that contains the target word written EXACTLY and in full (same spelling, no gaps — the tool will remove a letter itself). The sentence must make the word's meaning clear.
${lines}
JSON: {"items":[{"word":"<the target word exactly>","sentence":"<sentence containing the full word>"}]}`;
  }
  if (section === "reading") {
    const s = specs[0];
    const n = Number(ctx.words) || 120;
    // قالب التصحيح الآلي: القراءة 9 عبارات صح وخطأ فقط (بلا اختيار من متعدد)
    if (ctx.tf9) {
      return `${h}
Write an ORIGINAL reading passage${ctx.genre ? " in the form of " + txt(ctx.genre, 80) : ""} (about ${n} words, with a title) on the theme of Unit ${s?.unit} "${s?.unitTitle}" (${s?.target}). Use the unit vocabulary: ${(s?.words || []).join(", ")}.
Use mainly these structures from the term: ${txt(ctx.grammar, 600)}.
Give the passage as an array "paragraphs" of 1–3 normal paragraphs (ordinary prose; no line numbers, no labels).
Then write EXACTLY 9 true/false statements about the passage, in passage order where possible: 4 or 5 TRUE (stated directly in the passage, reworded simply) and the rest FALSE. Every FALSE statement must clearly contradict ONE fact that IS stated in the passage (a wrong name, place, number, day, action…) — never something the passage simply does not mention. Each statement is one short simple sentence. Mix true and false.
JSON: {"data":{"title":"...","paragraphs":[""],"tf":[{"s":"...","answer":true}]}}`;
    }
    return `${h}
Write an ORIGINAL reading passage${ctx.genre ? " in the form of " + txt(ctx.genre, 80) : ""} (about ${n} words, with a title) on the theme of Unit ${s?.unit} "${s?.unitTitle}" (${s?.target}). Use the unit vocabulary: ${(s?.words || []).join(", ")}.
Use mainly these structures from the term: ${txt(ctx.grammar, 600)}.
Then write:
Give the passage as an array "paragraphs" of 2–3 normal paragraphs (ordinary prose with normal commas and full stops; no line numbers, no labels).
- ${READ_MIX[lvl(txt(ctx.level, 10))]}. Each question has ${no} options.
- 4 true/false statements: 2 TRUE (stated directly in the passage) and 2 FALSE (clearly contradicting one fact stated in the passage — never something the passage simply does not mention). Mix the order.
JSON: {"data":{"title":"...","paragraphs":["",""],"mcq":[{"q":"...","options":${oj},"answer":"..."}],"tf":[{"s":"...","answer":true}]}}`;
  }
  if (section === "prim") {
    return `${h}
Primary-stage exam items (children aged 10–12): short, clear, natural sentences using the unit words. Write one item for EACH line below, in the same order:
- kind "qa": a short question a child can answer (about the unit theme: favourite things, jobs, food, family, hobbies, places…) and its short answer (3–8 words), e.g. "What is your favourite dish?" → "My favourite dish is pizza." Every question in this request must have a clearly different answer, so students can match each question with exactly one answer.
- kind "picsent": the target word will be shown to the student as a PICTURE. Write two short sentences (3–7 words): "right" correctly describes the picture (it uses the target word or clearly means it); "wrong" is similar in form but describes something different (another word from the unit), so only "right" matches the picture.
- kind "picfill": one short sentence (5–10 words) about the picture with ONE blank "____" where the target word fits exactly (the target word itself must NOT appear in the sentence).
- kind "opp": a common adjective (from the units if possible) and its clear opposite, e.g. happy / sad, big / small, clean / messy.
- kind "text": a very short real-life text of the type given in the target (40–70 words), with a title and short lines (ingredients/steps for a recipe, greeting/body/closing for an e-mail…), then exactly 2 multiple-choice questions with 3 options each: first "This text is:" (options are text types, e.g. an e-mail / a recipe / a dialogue), second "The text is about:" (one correct, two clearly wrong but plausible).
${lines}
JSON: {"items":[ ...one object per line above, in order... ]}
qa: {"kind":"qa","q":"...","a":"..."}
picsent: {"kind":"picsent","right":"...","wrong":"..."}
picfill: {"kind":"picfill","s":"... ____ ..."}
opp: {"kind":"opp","word":"...","opposite":"..."}
text: {"kind":"text","title":"...","lines":["...","..."],"mcq":[{"q":"This text is:","options":["","",""],"answer":"..."},{"q":"The text is about:","options":["","",""],"answer":"..."}]}`;
  }
  if (section === "composition") {
    const s = specs[0];
    const mode = ctx.mode === "wordbox" ? "wordbox" : ctx.mode === "words" ? "words" : "guided";
    if (mode === "words") {
      return `${h}
Composition (paragraph with a word list). Topic from Unit ${s?.unit} "${s?.unitTitle}" (${s?.target}). Give a short topic title (2–5 words), and EXACTLY ${[5, 6, 7, 8].includes(Number(ctx.nwords)) ? Number(ctx.nwords) : "6–8"} words/phrases from the unit (${(s?.words || []).join(", ")}) that fit one clear everyday topic so a student can write a coherent paragraph of 3–5 sentences using all of them. Also write a model answer paragraph of 3–5 sentences that uses all the listed words (for the teacher).
JSON: {"data":{"mode":"words","title":"...","words":["",""],"model":"..."}}`;
    }
    if (mode === "wordbox") {
      const nb = [5, 6, 7, 8].includes(Number(ctx.nblanks)) ? Number(ctx.nblanks) : 8;
      return `${h}
Guided composition (word box). Topic from Unit ${s?.unit} "${s?.unitTitle}" (${s?.target}).
Write a short first-person paragraph (60–90 words) with exactly ${nb} blanks written as "____". Give the ${nb} missing words/phrases (each 1–4 words) in order. Students fill the blanks from a box. Use unit words: ${(s?.words || []).join(", ")}.
JSON: {"data":{"mode":"wordbox","title":"...","instructions":"Fill in the blanks with a suitable word from the box below","paragraph":"...","answers":${JSON.stringify(Array(nb).fill(""))}}}`;
    }
    return `${h}
Guided composition. Topic from Unit ${s?.unit} "${s?.unitTitle}" (${s?.target}). Give a short title (2–4 words), one instruction line, and 5 guiding questions in a logical order that help the student write a paragraph of about 60–80 words using the unit's grammar and words (${(s?.words || []).join(", ")}). Also write a model answer paragraph (for the teacher's answer key).
JSON: {"data":{"mode":"guided","title":"...","instructions":"...","questions":["","","","",""],"model":"..."}}`;
  }
  return null;
}


// ===================== الرياضيات (وفق جدول المواصفات) =====================
// كل فقرة مرتبطة بفصل ودرس وهدف ومستوى (معرفة/تطبيق/استدلال) تحدده الصفحة من جدول المواصفات.
type MSpec = { kind: string; ch: number; chTitle: string; lesson: string; obj: string; lv: string; mk: number; graph: boolean; ref: string };
function readMSpecs(v: unknown): MSpec[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 30).map((s) => {
    const o = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
    return { kind: txt(o.kind, 10), ch: Number(o.ch) || 0, chTitle: txt(o.chTitle, 120), lesson: txt(o.lesson, 160), obj: txt(o.obj, 300), lv: txt(o.lv, 12), mk: Number(o.mk) || 1, graph: o.graph === true, ref: txt(o.ref, 700) };
  });
}
const MLEVEL: Record<string, string> = {
  veasy: "سهل جدًا (١ من ٦): أعداد صغيرة وخطوة واحدة مباشرة، ومشتتات بعيدة عن الإجابة.",
  easy: "سهل (٢ من ٦): أعداد صغيرة وخطوة أو خطوتان، ومشتتات واضحة الخطأ.",
  medium: "متوسط (٣ من ٦): مستوى اختبار نهاية الفصل المعتاد، خطوتان أو ثلاث، ومشتتات من الأخطاء الشائعة.",
  mhard: "متوسط الصعوبة (٤ من ٦): خطوات أكثر وأعداد سالبة أو كسور حيث يناسب الدرس، ومشتتات قريبة من الأخطاء الشائعة.",
  hard: "صعب (٥ من ٦): مسائل متعددة الخطوات ومواقف حياتية تحتاج ترجمة إلى معادلة، ومشتتات قريبة جدًا.",
  vhard: "صعب جدًا (٦ من ٦): أصعب ما يسمح به الدرس نفسه: تفكير متعدد الخطوات وتفسير وتبرير، لكن دون الخروج عن أهداف الدرس.",
};
const LVTXT: Record<string, string> = {
  "م": "معرفة: تذكّر مفهوم أو تعريف أو خاصية أو تمييز مصطلح من الدرس (بلا حساب طويل).",
  "ت": "تطبيق: تنفيذ إجراء أو حل روتيني مباشر من الدرس (حل معادلة، إيجاد قيمة، كتابة معادلة…).",
  "س": "استدلال: مسألة من واقع الحياة أو تحليل أو تفسير أو اختيار أفضل طريقة أو مسألة متعددة الخطوات، مبنية على هدف الدرس.",
};
function mathHeader(grade: string, term: string, difficulty: string) {
  return `أنت معلم رياضيات خبير تكتب أسئلة اختبار نهائي وفق منهج الرياضيات المعتمد من وزارة التعليم في المملكة العربية السعودية.
الصف: ${grade}، الفصل الدراسي: ${term}.
مستوى الصعوبة: ${MLEVEL[lvl(difficulty)] || MLEVEL.medium}
قواعد صارمة:
- كل فقرة تقيس هدفها المحدد فقط من الدرس المحدد، وبمستواه المعرفي المحدد. لا تستعمل أي مفهوم أو مهارة من فصول أو صفوف لاحقة، ولا تخترع مصطلحات أو قوانين غير موجودة في الكتاب.
- اللغة عربية فصيحة واضحة ومختصرة، وسياقات سعودية مناسبة (أسماء عربية، ريال، مدن المملكة).
- الأرقام هندية عربية (٠١٢٣٤٥٦٧٨٩)، والفاصلة العشرية «٫». المتغيرات حروف عربية كما في الكتاب: س، ص، ع، ن، م، ل، ك، ر، هـ. الدالة: د(س). المجموعة الخالية: Ø.
- الرموز: + − × ÷ = ≠ < > ≤ ≥ √ و | | للقيمة المطلقة و π. الأسس: س^٢ . الكسور: \\frac{البسط}{المقام} فقط. العدد السالب: علامة "-" ملاصقة للعدد بلا مسافة (-٥ ، -٢س). الطرح بين حدين: " - " بمسافتين.
- لا تكتب أي سؤال يحتاج رسمًا أو شكلًا أو جدولًا ليُفهم (إلا الفقرات المعلَّمة «بياني» فلها طريقة خاصة أدناه)؛ صف الأبعاد والبيانات بالكلمات والأعداد.
- إذا كان الصف الأول أو الثاني أو الثالث الابتدائي: جمل قصيرة جدًا وكلمات سهلة يفهمها طفل في السادسة إلى الثامنة، وأعداد صغيرة ضمن ما درسه (الأول: حتى ٢٠ والجمع حتى ١٢؛ الثاني: حتى ١٠٠؛ الثالث: القيمة المنزلية حتى ١٠٠٠٠، والجمع والطرح حتى ١٠٠٠، والضرب ضمن جدول الضرب حتى ١٠ × ١٠)، وخيارات قصيرة (عدد أو كلمة أو رمز).
- إذا ورد «من الكتاب» مع الفقرة فهو ملخص الدرس من كتاب الطالب: التزم بمفاهيمه ورموزه وصيغه وطريقته في الحل، وابنِ الفقرة على مثل أمثلته (بأعداد وسياقات جديدة)، ولا تخرج عنه.
- قبل الكتابة: حلّ كل فقرة بنفسك خطوة خطوة وتحقق من الإجابة مرتين. يجب أن تكون الإجابة صحيحة رياضيًا تمامًا.
- أعد JSON فقط بلا أي نص آخر.`;
}

const GRAPH_HELP = `الفقرات المعلَّمة «بياني» (اختيار من متعدد فقط): اجعل السؤال معتمدًا على تمثيل بياني تصفه بالأرقام (لا ترسم شيئًا؛ الأداة ترسمه بدقة). شكلان:
(أ) رسم واحد في السؤال (مثل: الزوج المرتب الذي يمثل حل النظام الممثل بيانيًا في الشكل المجاور، أو ميل المستقيم الممثل في الشكل): ضع "graph".
(ب) رسم في كل خيار (مثل: أي العلاقات الآتية ليست دالة؟ أو أي التمثيلات الآتية يمثل حل المتباينة؟): ضع "optionGraphs" (٤ رسوم) و"answer_index" (رقم الخيار الصحيح من ٠ إلى ٣)، و"options" نصوص فارغة أو قصيرة جدًا.
صيغة الرسم في المستوى الإحداثي: {"range":[سأدنى,سأعلى,صأدنى,صأعلى],"items":[...]} أعداد صحيحة بين -٨ و٨، وعناصره:
 {"k":"line","m":الميل,"b":المقطع الصادي} مستقيم ص = م س + ب ؛ {"k":"vline","x":العدد} مستقيم رأسي ؛
 {"k":"parab","a":..,"b":..,"c":..} قطع مكافئ ص = أس^٢ + ب س + جـ ؛ {"k":"abs","a":..,"h":..,"v":..} ص = أ|س - هـ| + ك ؛
 {"k":"ray","p":[س,ص],"v":[اتجاه س,اتجاه ص],"open":true|false} شعاع يبدأ من نقطة (open=true دائرة مفرغة) ؛
 {"k":"seg","p":[س,ص],"q":[س,ص]} قطعة مستقيمة ؛ {"k":"pts","p":[[س,ص],...],"lab":true} نقاط (lab لكتابة إحداثياتها) ؛ {"k":"circle","c":[س,ص],"r":نصف القطر}.
تمثيلات إحصائية (لدروس الإحصاء والتمثيلات البيانية):
 بالأعمدة: {"type":"bar","title":"عنوان التمثيل","xlabel":"اسم المحور الأفقي","ylabel":"اسم المحور الرأسي","cats":["فئة١","فئة٢",...],"vals":[عدد,عدد,...]} (٣ إلى ٧ فئات، أسماء قصيرة) ؛
 بالخطوط: {"type":"linechart", ...نفس الحقول، والفئات أزمنة مرتبة: أيام، أشهر، سنوات} ؛
 بالقطاعات الدائرية: {"type":"pie","title":"...","cats":["فئة١",...],"vals":[أعداد موجبة],"show":"frac" أو "pct" أو "val" أو ""} (٢ إلى ٥ فئات؛ للصفوف الابتدائية اجعل القطاعات أنصافًا وأرباعًا وأثمانًا واضحة، و"show" يحدد ما يُكتب داخل القطاع: كسر أو نسبة مئوية أو العدد) ؛
 جدول إشارات: {"type":"tally","title":"...","cats":["فئة١",...],"vals":[أعداد صحيحة حتى ٢٠]} (الأداة ترسم الإشارات في حزم من ٥) ؛
 بالنقاط: {"type":"dotplot","title":"...","range":[أصغر,أكبر],"data":[قيم البيانات كلها أعداد صحيحة]} (المدى لا يزيد على ٢٠).
 مع هذه التمثيلات اكتب في "verify": "mean" أو "median" أو "mode" أو "range" أو "max" أو "min" أو "total" (مجموع القيم) أو "count" (عدد البيانات) والخيارات أعداد، أو "maxcat"/"mincat" (الفئة ذات القيمة الأكبر/الأصغر والخيارات أسماء فئات). اجعل الأعداد مناسبة للصف (قسمة المتوسط بلا كسور معقدة).
صيغة خط الأعداد: {"type":"numberline","range":[-٦,٦],"sol":[{"a":البداية أو null للانهاية,"b":النهاية أو null,"ca":طرف مغلق؟,"cb":طرف مغلق؟}]}.
اجعل النقاط المهمة (التقاطع، المقاطع، نقاط الميل) أعدادًا صحيحة داخل المدى وعلى تقاطعات الشبكة. الأرقام في وصف الرسم أرقام إنجليزية عادية (JSON).
أضف "verify" إن انطبق: "intersection" (حل نظام من مستقيمين بيانيًا؛ الخيارات أزواج مرتبة) أو "slope" (ميل المستقيم الأول؛ الخيارات أعداد) أو "notfunction" / "function" (أي الرسوم الأربعة ليست / هي دالة) أو "count" (عدد حلول نظام من مستقيمين). الأداة تتحقق من الإجابة بنفسها.
إن كان الهدف يحتاج تمثيلًا غير ممكن بهذه العناصر (صور، أشكال هندسية مرسومة…) فاكتب فقرة عادية بلا رسم.`;
function mathLines(specs: MSpec[]) {
  return specs.map((s, i) => `${i + 1}. [${s.kind}${s.kind === "essay" ? `، ${s.mk} درجات` : ""}${s.graph ? "، بياني" : ""}] الفصل ${s.ch} «${s.chTitle}» — الدرس: ${s.lesson} — الهدف: ${s.obj} — المستوى: ${LVTXT[s.lv] || s.lv}${s.ref ? " — من الكتاب: " + s.ref : ""}`).join("\n");
}
function buildMathPrompt(section: string, h0: string, specs: MSpec[], ctx: Record<string, unknown>): string | null {
  const avoid = Array.isArray(ctx.avoid) ? (ctx.avoid as unknown[]).slice(0, 40).map((x) => txt(x, 200)).filter(Boolean) : [];
  const recent = Array.isArray(ctx.recent) ? (ctx.recent as unknown[]).slice(0, 40).map((x) => txt(x, 200)).filter(Boolean) : [];
  const names = Array.isArray(ctx.names) ? (ctx.names as unknown[]).slice(0, 8).map((x) => txt(x, 30)).filter(Boolean) : [];
  const no = [...avoid, ...recent];
  const h = `${h0}${names.length ? "\nعند الحاجة لأسماء أشخاص استعمل: " + names.join("، ") + "." : ""}
نوّع الأعداد والصيغ والسياقات بين الفقرات، ولا تبدأ الفقرات بالصيغة نفسها.${no.length ? "\nهذه فقرات وردت سابقًا — لا تكررها ولا تكتب صيغًا قريبة منها (أعداد وسياقات جديدة):\n" + no.map((a) => "- " + a).join("\n") : ""}`;
  const lines = mathLines(specs);
  if (section === "math") {
    return `${h}
اكتب فقرة واحدة لكل سطر من الأسطر الآتية بالترتيب نفسه، بنوعها المحدد:
- mcq: سؤال اختيار من متعدد له ٤ خيارات مختلفة، واحد فقط صحيح، والمشتتات من أخطاء الطلاب الشائعة في هذا الدرس. "answer" نص الخيار الصحيح حرفيًا.
- tf: عبارة واحدة قصيرة لـ«صح أم خطأ». اجعل نحو نصف عبارات الطلب خاطئة. العبارة الخاطئة خطؤها حقيقي وواضح لمن يعرف الدرس (مفهوم شائع خاطئ أو قيمة خاطئة)، واكتب في "fix" تصويبها المختصر.
- fill: سؤال «أكمل» قصير للصفوف الأولية فيه فراغ أو فراغان مكتوبان "..........": مثل إكمال نمط عددي، أو العدد الذي قبل/بعد/بين، أو إكمال الحقائق المترابطة، أو جملة عددية فيها عدد مفقود. "answer" قيمة الفراغ (أو القيم مفصولة بـ « ، »).
- word: مسألة لفظية قصيرة جدًا من واقع حياة الطفل تُحل بعملية واحدة (جمع أو طرح)، بأعداد ضمن مدى الصف. أعد "a" و"op" ("+" أو "-") و"b" و"answer" و"unit" (اسم المعدود مثل: بقرات، أقلام).
- essay: مسألة مقالية تُحل في خطوات بالدرجة المحددة، "ex" سطر أو سطران رياضيان فقط (المعادلة أو النظام أو المتباينة…) إن وجدا، و"steps" خطوات الحل لنموذج الإجابة مع درجة كل خطوة ومجموعها يساوي درجة الفقرة بالضبط (أنصاف الدرجات مسموحة). اجعل "numberline" = true فقط إذا كان الحل يُطلب تمثيله على خط الأعداد.
${specs.some((x) => x.graph) ? GRAPH_HELP + "\n" : ""}${lines}
أعد JSON بالشكل: {"items":[ ...كائن لكل سطر بالترتيب... ]}
mcq: {"kind":"mcq","q":"...","options":["","","",""],"answer":"..."}
mcq بياني: {"kind":"mcq","q":"...","graph":{...},"options":["","","",""],"answer":"...","verify":"intersection"} أو {"kind":"mcq","q":"...","optionGraphs":[{...},{...},{...},{...}],"options":["","","",""],"answer_index":2,"verify":"notfunction"}
tf: {"kind":"tf","s":"...","answer":true,"fix":""}
fill: {"kind":"fill","q":"أكمل النمط: ١٥ ، ٢٠ ، ٢٥ ، .......... ، ..........","answer":"٣٠ ، ٣٥"}
word: {"kind":"word","q":"...","a":18,"op":"-","b":10,"answer":8,"unit":"بقرات"}
essay: {"kind":"essay","q":"...","ex":[""],"steps":[{"t":"...","mk":1}],"answer":"الناتج النهائي","numberline":false}`;
  }
  if (section === "math_review") {
    const its = Array.isArray(ctx.review) ? (ctx.review as unknown[]).slice(0, 30).map((x) => txt(x, 2500)) : [];
    return `أنت مدقق رياضيات صارم لاختبار نهائي سعودي (الصف ${txt(ctx.grade, 40)}).
لكل فقرة مرقمة أدناه (معها هدفها ومستواها والإجابة المعلَّمة): حلّها أنت بنفسك من البداية خطوة خطوة، ثم قرر "ok": true فقط إذا تحقق كل ما يلي:
١) الإجابة المعلَّمة صحيحة رياضيًا تمامًا؛
٢) في الاختيار من متعدد: خيار واحد فقط صحيح والخيارات مختلفة؛ في صح وخطأ: الحكم (صح/خطأ) صحيح بلا لبس؛
٣) الفقرة واضحة ومكتملة البيانات ولا تحتاج رسمًا؛
٤) تقيس هدفها من الدرس ولا تحتاج مفهومًا من خارج الدرس.
إن كانت الإجابة المعلَّمة خاطئة لكن السؤال سليم فاكتب الإجابة الصحيحة في "fix" (نص الخيار الصحيح حرفيًا، أو حرف الخيار أ/ب/جـ/د إن كانت الخيارات رسومًا، أو true/false).
الرسوم موصوفة بصيغة JSON: line ص = m س + b، vline مستقيم رأسي، parab ص = a س^٢ + b س + c، abs ص = a|س - h| + v، ray شعاع من p باتجاه v (open = بدايته مفرغة)، seg قطعة، pts نقاط، circle دائرة، numberline خط أعداد (sol فترات الحل، ca/cb طرف مغلق)، bar تمثيل بالأعمدة وlinechart تمثيل بالخطوط (cats الفئات وvals قيمها بالترتيب)، dotplot تمثيل بالنقاط (data قيم البيانات)، tally جدول إشارات (cats وvals)، pie تمثيل بالقطاعات الدائرية (cats الفئات وvals مقاديرها، وحجم كل قطاع يتناسب مع قيمته).
${its.map((x, i) => `${i + 1}. ${x}`).join("\n")}
أعد JSON: {"items":[{"ok":true,"why":"","fix":""}, ...واحد لكل فقرة بالترتيب]} — "why" سبب مختصر عند ok=false.`;
  }
  return null;
}

// قراءة متسامحة لرد النموذج: أسوار الكود، مصفوفة في الأعلى، فواصل زائدة، علامات اقتباس ذكية، وفاصل «|» بين الكائنات
function parseLoose(raw: string): any {
  let c = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const tries: string[] = [c];
  const o1 = c.indexOf("{"), o2 = c.lastIndexOf("}"), a1 = c.indexOf("["), a2 = c.lastIndexOf("]");
  if (o1 >= 0 && o2 > o1) tries.push(c.slice(o1, o2 + 1));
  if (a1 >= 0 && a2 > a1 && (o1 < 0 || a1 < o1)) tries.push(c.slice(a1, a2 + 1));
  const fix = (x: string) => x.replace(/[\u201c\u201d]/g, '"').replace(/}\s*\|\s*{/g, "},{").replace(/,\s*([}\]])/g, "$1");
  for (const t of [...tries, ...tries.map(fix)]) {
    try { const v = JSON.parse(t); if (v && typeof v === "object") return v; } catch { /* next */ }
  }
  return null;
}

async function callGemini(prompt: string, deadlineMs: number, temp = 0.9): Promise<string | null> {
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
      const timer = setTimeout(() => controller.abort(), Math.min(model === MODELS[0] ? 25000 : 40000, remaining));
      try {
        const generationConfig: Record<string, unknown> = { responseMimeType: "application/json" };
        generationConfig.temperature = model.startsWith("gemini-3") ? Math.max(temp, 0.3) : temp;
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
  const section = txt(body.section, 24);
  const ctx = (body.ctx && typeof body.ctx === "object" ? body.ctx : {}) as Record<string, unknown>;
  let prompt: string | null = null;
  if (section === "math" || section === "math_review") {
    const ms = readMSpecs(body.items);
    const mh = mathHeader(txt(body.grade, 40) || "المتوسط", txt(body.term, 10) || "الأول", txt(body.difficulty, 10));
    prompt = ms.length ? buildMathPrompt(section, mh, ms, ctx) : null;
  } else {
    const specs = readSpecs(body.items);
    const h = header(txt(body.grade, 40) || "Intermediate", txt(body.term, 10) || "1", txt(body.difficulty, 10));
    prompt = specs.length ? buildPrompt(section, h, specs, ctx) : null;
  }
  if (!prompt) return jsonResponse({ detail: "Bad request", code: "bad_request" }, 400);
  if (!GEMINI_KEYS.length) return jsonResponse({ failed: true, reason: "not_configured" });

  const raw = await callGemini(prompt, 95000, section === "grammar_review" || section === "math_review" ? 0.1 : section === "math" ? 0.7 : 0.95);
  if (!raw) return jsonResponse({ failed: true, reason: "no_answer" });
  const v = parseLoose(raw);
  if (!v) {
    console.error("exam-generate unparsable section=" + section + " len=" + raw.length + " head=" + raw.slice(0, 400).replace(/\s+/g, " "));
    return jsonResponse({ failed: true, reason: "unparsable" });
  }
  const items = Array.isArray(v) ? v : Array.isArray(v.items) ? v.items : undefined;
  const data = !Array.isArray(v) && v.data && typeof v.data === "object" ? v.data : (!Array.isArray(v) && !v.items && (v.title || v.lines || v.mcq) ? v : undefined);
  return jsonResponse({ items, data });
};

Deno.serve(async (req: Request) => {
  const res = await handleRequest(req);
  await scheduleCallLogFlush();
  return res;
});
