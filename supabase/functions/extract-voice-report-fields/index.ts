// supabase/functions/extract-voice-report-fields/index.ts
//
// Second, fully independent voice-command system (alongside the existing
// step-by-step field wizard): the teacher dictates ONE long free-form
// sentence covering as many report details as they want (place, grade,
// class section, target audience, count, subject, lesson, notes, and an
// implicit or explicit title) in a single breath, instead of answering one
// question at a time. This function's only job is EXTRACTION (slot
// filling), never normalization or validation: for each slot, it returns
// the teacher's own spoken phrase verbatim if that detail was mentioned, or
// an empty string if it wasn't mentioned at all. It must not guess/invent
// facts (numbers, names, counts) that were not said.
//
// Deliberately NOT the AI's job here: matching a spoken phrase to one of
// the app's fixed <select> option values (term/grade), or deciding whether
// a place phrase implies "outside the classroom" plus a specific location
// detail. All of that already exists, tested, in the client
// (matchSelectOptionByVoice / applyVoiceFieldValue in index.html) because
// it's the exact same logic the step-by-step wizard already uses for a
// single spoken answer - this function just needs to hand it the right raw
// phrase per field, exactly as if each had been asked as its own question.
//
// The one deliberate exception is "title": if the teacher's sentence has no
// explicit title-like phrase, a short, faithful title is synthesized from
// the rest of what was actually said (never invented content beyond that) -
// and any clause describing the OUTCOME/result/reaction of what was done
// (rather than WHAT was done) must be routed to "notes" instead of "title",
// even when it's grammatically glued to the same sentence as the topic.
//
// Like review-voice-fields, this does NOT consume the account's report-
// generation usage quota - it's a cheap, optional capture helper; the
// actual "report generation" quota is spent once, later, by generate-report.
//
// All user-facing Arabic text (error messages, select-option reference
// lists, and the extraction prompt itself) lives in STRINGS_B64 below as a
// base64-encoded UTF-8 JSON blob instead of inline string literals. This is
// purely a transport-safety measure for how this file's source is produced
// and deployed in this project's tooling (plain ASCII round-trips reliably;
// long inline Arabic literals have previously been silently corrupted
// character-by-character when retyped through that tooling) - it carries NO
// runtime behavior difference from inline literals, and all logic/comments
// elsewhere in this file are in English for the same reason. Decode it with
// `python3 -c "import base64,json; print(json.dumps(json.loads(base64.b64decode('<STRINGS_B64 value>')), ensure_ascii=False, indent=2))"`
// to read or edit the actual Arabic text.

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

// Same Gemini key pool / round-robin failover logic used in generate-report
// and review-voice-fields (each Edge function is deployed standalone with no
// shared import between functions, so this is intentionally duplicated).
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

// Models in order: gemini-3.1-flash-lite first (much larger free daily quota:
// 500 requests/day per project vs 20 for the 2.5 models), then the 2.5 models
// as fallbacks. Each model is tried across ALL keys before moving to the next,
// so the small 2.5 quotas are only spent once 3.1 is unavailable everywhere.
const PRIMARY_MODEL = "gemini-3.1-flash-lite";
const GEMINI_MODELS = [PRIMARY_MODEL, "gemini-2.5-flash", "gemini-2.5-flash-lite"];
const FALLBACK_MODELS = GEMINI_MODELS.slice(1);

// Per-attempt timeout, and a hard overall budget for the whole request. The
// client waits up to ~20s, so the server must give up (and say so with
// failed:true) comfortably before that rather than letting the client time
// out blindly - observed in production: keys answering 503 one after another
// stretched a single request to ~21-25s, past the old 9s client timeout.
const PER_ATTEMPT_TIMEOUT_MS = 7000;
const OVERALL_DEADLINE_MS = 16000;

// Start each request at a RANDOM key instead of always key #1. Edge function
// instances cold-boot very often (often once per request), so a module-level
// round-robin counter effectively reset to 0 every time and key #1 absorbed
// almost all traffic until its quota ran out (production logs: key #1
// returned 429 ~31 times in one day while later keys were barely used).
function shuffledKeyOrder(): string[] {
  const n = GEMINI_KEYS.length;
  if (n === 0) return [];
  const start = Math.floor(Math.random() * n);
  return Array.from({ length: n }, (_, i) => GEMINI_KEYS[(start + i) % n]);
}

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

async function callGeminiModel(apiKey: string, model: string, prompt: string, timeoutMs: number): Promise<{ text: string | null; status: number | string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const generationConfig: Record<string, unknown> = {
      responseMimeType: "application/json",
    };
    // Gemini 3 models: keep the default temperature (Google's recommendation;
    // low values can degrade them). Their default thinking level is minimal.
    if (!model.startsWith("gemini-3")) generationConfig.temperature = 0;
    // flash "thinks" by default, which adds seconds of latency for a simple
    // slot-filling task - disable it. flash-lite doesn't think by default.
    if (model === "gemini-2.5-flash") generationConfig.thinkingConfig = { thinkingBudget: 0 };
    const resp = await geminiFetch("extract-voice-report-fields", apiKey, model, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
        signal: controller.signal,
      },
    );
    if (!resp.ok) return { text: null, status: resp.status };
    const json = await resp.json();
    const parts = json?.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p: { text?: string }) => p.text || "").join("");
    return { text: text || null, status: text ? 200 : "empty" };
  } catch (e) {
    return { text: null, status: (e instanceof Error && e.name === "AbortError") ? "timeout" : "error" };
  } finally {
    clearTimeout(timer);
  }
}

async function callGeminiOnce(prompt: string, models: string[] = GEMINI_MODELS, overallMs = OVERALL_DEADLINE_MS): Promise<string | null> {
  const deadline = Date.now() + overallMs;
  const keys = shuffledKeyOrder();
  for (const model of models) {
    let count503 = 0;
    for (let i = 0; i < keys.length; i++) {
      const remaining = deadline - Date.now();
      if (remaining < 1500) {
        console.error(`Overall deadline reached at ${model} key ${i}; giving up.`);
        return null;
      }
      const { text, status } = await callGeminiModel(keys[i], model, prompt, Math.min(PER_ATTEMPT_TIMEOUT_MS, remaining));
      if (text) {
        console.log(`gemini ok model=${model} key=${i + 1}`);
        return text;
      }
      console.error(`Gemini attempt ${i + 1}/${keys.length} (${model}) failed (${status}), trying next...`);
      // 400/404 = this model itself is unavailable; a timeout on the primary
      // model is model-wide slowness. Either way, move on to the next model.
      if (status === 400 || status === 404 || (model === PRIMARY_MODEL && status === "timeout")) break;
      // After two 503s (Google-side overload of the model itself) skip the primary.
      if (status === 503 && model === PRIMARY_MODEL && ++count503 >= 2) break;
    }
  }
  return null;
}

function parseFields(raw: string): Record<string, unknown> | null {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    const v = JSON.parse(cleaned);
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

// See the file-header comment above for why this is base64 rather than
// inline string literals. Decode once at module load.
const STRINGS_B64 = "eyJ0ZXJtX29wdGlvbnMiOiBbItin2YTYo9mI2YQiLCAi2KfZhNir2KfZhtmKIiwgItin2YTYq9in2YTYqyJdLCAiZ3JhZGVfb3B0aW9ucyI6IFsi2KfZhNij2YjZhCDYp9io2KrYr9in2KbZiiIsICLYp9mE2KvYp9mG2Yog2KfYqNiq2K/Yp9im2YoiLCAi2KfZhNir2KfZhNirINin2KjYqtiv2KfYptmKIiwgItin2YTYsdin2KjYuSDYp9io2KrYr9in2KbZiiIsICLYp9mE2K7Yp9mF2LMg2KfYqNiq2K/Yp9im2YoiLCAi2KfZhNiz2KfYr9izINin2KjYqtiv2KfYptmKIiwgItin2YTYo9mI2YQg2YXYqtmI2LPYtyIsICLYp9mE2KvYp9mG2Yog2YXYqtmI2LPYtyIsICLYp9mE2KvYp9mE2Ksg2YXYqtmI2LPYtyIsICLYp9mE2KPZiNmEINir2KfZhtmI2YoiLCAi2KfZhNir2KfZhtmKINir2KfZhtmI2YoiLCAi2KfZhNir2KfZhNirINir2KfZhtmI2YoiXSwgImVycl9sb2dpbiI6ICLZitis2Kgg2KrYs9is2YrZhCDYp9mE2K/YrtmI2YQiLCAiZXJyX3Nlc3Npb24iOiAi2KzZhNiz2Kkg2LrZitixINi12KfZhNit2KnYjCDZitix2KzZiSDYqtiz2KzZitmEINin2YTYr9iu2YjZhCDZhdmGINis2K/ZitivIiwgImVycl9iYWRyZXEiOiAi2LfZhNioINi62YrYsSDYtdin2YTYrSIsICJwcm9tcHRfdGVtcGxhdGUiOiAi2KPZhtiqINmF2LPYp9i52K8g2KfYs9iq2K7ZhNin2LUg2KjZitin2YbYp9iqINmE2KrYt9io2YrZgiDYqtmC2KfYsdmK2LEg2KrYsdio2YjZitipINi52LHYqNmKLiDZhdi52YTZhSDZgtin2YQg2KzZhdmE2Klcbti12YjYqtmK2Kkg2YjYp9it2K/YqSDYrdix2Kkg2KrYtdmBINiq2YLYsdmK2LHYp9mLINmF2K/Ysdiz2YrYp9mL2Iwg2YjZgtivINiq2LrYt9mKINio2LnYtiDYo9mIINmD2YQg2KfZhNio2YbZiNivINin2YTYqtin2YTZitipINio2KPZilxu2KrYsdiq2YrYqCDZiNio2KPZiiDYtdmK2KfYutipINi32KjZiti52YrYqS4g2YXZh9mF2KrZgyDYp9iz2KrYrtmE2KfYtSDZgdmC2LcgLSDZhNinINiq2Y/Zgdiz2ZHYsdiMINmE2Kcg2KrZj9i32KjZkdi5INin2YTYtdmK2LrYqdiMINmI2YTYp1xu2KrZj9iu2YXZkdmGINit2YLZitmC2Kkg2YTZhSDYqtmP2LDZg9ixOiDZhNmD2YQg2KjZhtiv2Iwg2KPYudivINin2YTYudio2KfYsdipINin2YTYqtmKINmC2KfZhNmH2Kcg2KfZhNmF2LnZhNmFINmB2LnZhNin2Ysg2YPZhdinINiz2YXYudiq2YfYp1xuKNij2Ygg2KPZgtix2Kgg2YbYtSDZhdmF2YPZhiDZhdmG2YfYpykg2KXZhiDZg9in2YbYqiDZhdmI2KzZiNiv2Kkg2YHZiiDYp9mE2KzZhdmE2KnYjCDYo9mIINmG2LXYp9mLINmB2KfYsdi62KfZiyBcIlwiINil2YYg2YTZhVxu2YrZj9iw2YPYsSDZh9iw2Kcg2KfZhNio2YbYryDYpdi32YTYp9mC2KfZiy5cblxu2KfZhNio2YbZiNivINin2YTZhdi32YTZiNioINin2LPYqtiu2YTYp9i12YfYpzpcbi0gdGl0bGU6INi52YbZiNin2YYg2KfZhNiq2YLYsdmK2LEgLSDZiNmH2Ygg2YXZiNi22YjYuSDYo9mIINmG2LTYp9i3INij2Ygg2KXYrNix2KfYoSDYp9mE2KrZgtix2YrYsSDZgdmC2LcgKNin2YTYp9iz2KrYsdin2KrZitis2YrYqVxuICDYp9mE2KrZiiDZhtmP2YHZkdiw2KrYjCDYp9mE2K/Ysdiz2Iwg2KfZhNmG2LTYp9i32Iwg2KfZhNin2KzYqtmF2KfYudiMINin2YTZhdmG2KfYs9io2KkuLi4p2Iwg2YjZhNmK2LMg2KPZiiDYrNmF2YTYqSDYqti12YEg2YbYqtmK2KzYqVxuICDYp9mE2KrZhtmB2YrYsCDYo9mIINiq2YLZitmK2YXZhyDYo9mIINix2K8g2YHYudmEL9ij2K/Yp9ihINin2YTYt9mE2KfYqCDYo9mIINij2Yog2YXZhNin2K3YuNipINi52KfZhdipINi52YbZhyAtINiq2YTZgyDZg9mE2YfYp1xuICDYqtiw2YfYqCDYpdmE2YkgXCJub3Rlc1wiINij2K/Zhtin2Ycg2YTYpyDYpdmE2Ykg2KfZhNi52YbZiNin2YbYjCDYrdiq2Ykg2YTZiCDZiNix2K/YqiDZhdmE2KrYtdmC2Kkg2KjZhtmB2LMg2KzZhdmE2Kkg2KfZhNi52YbZiNin2YZcbiAg2KjYudio2KfYsdin2Kog2YjYtdmEINmF2KvZhCBcItmI2YLYryDZg9in2YZcIi9cItmI2YPYp9mGXCIvXCLYrdmK2KtcIi9cItmI2YTYp9it2LjYqlwiL1wi2YjYqtis2KfZiNioXCIuINil2YYg2LDZg9ixINin2YTZhdi52YTZhVxuICDYudmG2YjYp9mG2KfZiyDYtdix2YrYrdin2Ysg2YTZhdmI2LbZiNi5INin2YTYqtmG2YHZitiwINin2LPYqtiu2K/ZhdmHICjZhdis2LHYr9in2Ysg2YXZhiDYo9mKINis2YXZhNipINmG2KrZitis2Kkv2YXZhNin2K3YuNipINmD2YXYp1xuICDYs9io2YIp2Iwg2YjYpdmE2Kcg2YTYrtmR2LUg2KPZhtiqINi52YbZiNin2YbYp9mLINmC2LXZitix2KfZiyDYtdin2K/Zgtin2YsgKDMg2KXZhNmJIDgg2YPZhNmF2KfYqikg2YXZhiDZhdmI2LbZiNi5INin2YTYqtmG2YHZitiwXG4gINmB2YLYtyAtINmH2LDYpyDZh9mIINin2YTYp9iz2KrYq9mG2KfYoSDYp9mE2YjYrdmK2K8g2KfZhNiw2Yog2YrZj9iz2YXYrSDZgdmK2Ycg2KjYp9mE2LXZitin2LrYqSDYqNiv2YQg2KfZhNin2LPYqtiu2YTYp9i1INin2YTYrdix2YHZitiMXG4gINmI2YTYpyDZitis2YjYsiDYo9mGINmK2K3YqtmI2Yog2YXYudmE2YjZhdipINmE2YUg2KrZj9iw2YPYsSDZgdmKINin2YTYrNmF2YTYqS5cbiAg2YXYq9in2YQ6IFwi2KfYtdiv2LEg2KrZgtix2YrYsSDYudmGINiq2YHYudmK2YQg2KfYs9iq2LHYp9iq2YrYrNmK2Kkg2KfZhNiq2LnZhNmFINio2KfZhNij2YLYsdin2YYg2YjZgtivINmD2KfZhiDZh9mG2KfZgyDYo9iv2KfYoVxuICDZhdmF2KrYp9iyINmF2YYg2KfZhNi32YTYp9ioINmI2KrYrNin2YjYqCDYsdin2KbYuVwiIOKGkCB0aXRsZT1cItiq2YHYudmK2YQg2KfYs9iq2LHYp9iq2YrYrNmK2Kkg2KfZhNiq2LnZhNmFINio2KfZhNij2YLYsdin2YZcItiMXG4gINmI2KzZhdmE2KkgXCLZg9in2YYg2YfZhtin2YMg2KPYr9in2KEg2YXZhdiq2KfYsiDZhdmGINin2YTYt9mE2KfYqCDZiNiq2KzYp9mI2Kgg2LHYp9im2LlcIiDYqtiw2YfYqCDYpdmE2Ykgbm90ZXMg2YTYpyDYpdmE2YlcbiAgdGl0bGUuXG4gINmC2YjYp9i52K8g2KXYttin2YHZitipINmE2YTYudmG2YjYp9mGOlxuICAqINin2K3YsNmBINi52KjYp9ix2Kkg2KfZhNi32YTYqCDZhtmB2LPZh9inINmF2YYg2KjYr9in2YrYqSDYp9mE2KzZhdmE2KkgKNmF2KvZhCBcItin2LXYr9ixINiq2YLYsdmK2LEg2LnZhlwi2IwgXCLYp9mD2KrYqCDYqtmC2LHZitixXG4gICAg2K3ZiNmEXCLYjCBcItiz2YjZkSDZhNmKINiq2YLYsdmK2LFcIikg2K3YqtmJINmE2Ygg2KfZhNiq2YLYt9mH2Kcg2KfZhNiq2LnYsdmBINin2YTYtdmI2KrZiiDZhdit2LHZkdmB2KkgKNmF2KvZhCBcItij2LXZhCDYqtmC2LHZitixXG4gICAg2LnZhlwiKdiMINmB2YfZiiDZhNmK2LPYqiDYrNiy2KHYp9mLINmF2YYg2KfZhNi52YbZiNin2YYuXG4gICog2YTYpyDZitis2YjYsiDYo9mGINmK2K3YqtmI2Yog2KfZhNi52YbZiNin2YYg2KPZiiDZhti1INin2LPYqtiu2LHYrNiq2Ycg2YTYqNmG2K8g2KLYrtixICjYp9mE2YHYtdmEINin2YTYr9ix2KfYs9mK2Iwg2YXZg9in2YZcbiAgICDYp9mE2KrZhtmB2YrYsNiMINin2YTYtdmB2Iwg2KfZhNi02LnYqNip2Iwg2KfZhNmF2LPYqtmH2K/ZgdmI2YbYjCDYp9mE2LnYr9iv2Iwg2KfZhNmF2KfYr9ip2Iwg2KfZhNiv2LHYsykg2YjZhNinINit2LHZiNmBINin2YTYsdio2LdcbiAgICDYp9mE2YXYpNiv2YrYqSDYpdmE2YrZhyAo2YXYq9mEIFwi2YTZhNmB2LXZhCDYp9mE2K/Ysdin2LPZiiDYp9mE2KPZiNmEXCLYjCBcItiv2KfYrtmEINin2YTYtdmBXCLYjCBcItmE2LfZhNin2Kgg2KfZhNi12YEuLi5cIikuXG4gINmF2KvYp9mEINir2KfZhtmNOiBcItin2LXYr9ixINiq2YLYsdmK2LEg2LnZhiDYqti32KjZitmCINin2LPYqtix2KfYqtmK2KzZitin2Kog2KfZhNiq2LnZhNmFINin2YTZhti02Lcg2YTZhNmB2LXZhCDYp9mE2K/Ysdin2LPZiiDYp9mE2KPZiNmEXG4gINiv2KfYrtmEINin2YTYtdmBINin2YTYq9in2YTYqyDZhdiq2YjYs9i3INij2LHYqNi52KlcIiDihpAgdGl0bGU9XCLYqti32KjZitmCINin2LPYqtix2KfYqtmK2KzZitin2Kog2KfZhNiq2LnZhNmFINin2YTZhti02LdcItiMXG4gIHRlcm09XCLYp9mE2KPZiNmEXCLYjCBwbGFjZT1cItiv2KfYrtmEINin2YTYtdmBXCLYjCBncmFkZT1cItin2YTYq9in2YTYqyDZhdiq2YjYs9i3XCLYjCBjbGFzc19zZWN0aW9uPVwi2KPYsdio2LnYqVwiLlxuICDZhdir2KfZhCDYq9in2YTYqzogXCLYqtmC2LHZitixINi52YYg2K3YtdipINmG2YXZiNiw2KzZitipINmB2Yog2K/YsdizINin2YTZg9iz2YjYsSDZhNmF2KfYr9ipINin2YTYsdmK2KfYttmK2KfYqiDZhNmE2LXZgSDYp9mE2K7Yp9mF2LNcbiAg2KfYqNiq2K/Yp9im2Yog2KfZhNi02LnYqNipINmiINi52K/YryDYp9mE2LfZhNin2Kgg2aLZqCDZiNmC2K8g2KrZgdin2LnZhCDYp9mE2LfZhNin2Kgg2KjYtNmD2YQg2YTYp9mB2Kog2YjYqtmFINiq2YPYsdmK2YUg2KfZhNmF2KrZhdmK2LLZitmGXCIg4oaQXG4gIHRpdGxlPVwi2K3YtdipINmG2YXZiNiw2KzZitipINmB2Yog2K/YsdizINin2YTZg9iz2YjYsVwi2Iwgc3ViamVjdD1cItin2YTYsdmK2KfYttmK2KfYqlwi2IwgbGVzc29uPVwi2KfZhNmD2LPZiNixXCLYjFxuICBncmFkZT1cItin2YTYrtin2YXYsyDYp9io2KrYr9in2KbZilwi2IwgY2xhc3Nfc2VjdGlvbj1cItmiXCLYjCBjb3VudD1cItmi2ahcItiMIG5vdGVzPVwi2KrZgdin2LnZhCDYp9mE2LfZhNin2Kgg2KjYtNmD2YRcbiAg2YTYp9mB2Kog2YjYqtmFINiq2YPYsdmK2YUg2KfZhNmF2KrZhdmK2LLZitmGXCIuXG4gICog2KrZhtio2YrZhyDZhNmE2KrYudix2YEg2KfZhNi12YjYqtmKOiDYpdmGINis2KfYodiqINmD2YTZhdipIFwi2KfZhNmB2LXZhFwiINmF2KrYqNmI2LnYqSDZhdio2KfYtNix2Kkg2KjYtdmBINmI2YXYsdit2YTYqSAo2YXYq9mEXG4gICAgXCLYp9mE2YHYtdmEINin2YTYq9in2YTYqyDYp9mE2YXYqtmI2LPYt1wiKSDZgdin2YTZhdmC2LXZiNivINi62KfZhNio2KfZiyDYp9mE2LXZgSDYp9mE2K/Ysdin2LPZiiAoZ3JhZGUpINmE2Kcg2KfZhNmB2LXZhFxuICAgINin2YTYr9ix2KfYs9mKICh0ZXJtKS5cbi0gdGVybTog2KfZhNmB2LXZhCDYp9mE2K/Ysdin2LPZiiAo2YXYsdis2Lkg2KrZgtix2YrYqNmKOiB7e1RFUk1fT1BUSU9OU319KS5cbi0gcGxhY2U6INmF2YPYp9mGINin2YTYqtmG2YHZitiwIC0g2YLYryDZitmC2YjZhNmH2Kcg2YPYrtmK2KfYsSDYq9mG2KfYptmKICjYr9in2K7ZhCDYp9mE2LXZgS/Yrtin2LHYrCDYp9mE2LXZgSkg2KPZiCDZitiw2YPYsVxuICDZhdmD2KfZhtin2Ysg2K3ZgtmK2YLZitin2Ysg2YXYqNin2LTYsdipICjZhdir2YQgXCLZgtin2LnYqSDYp9mE2KfYrNiq2YXYp9i52KfYqlwiKSAtINij2LnYryDZhdinINmC2KfZhNmHINit2LHZgdmK2KfZiyDYqNmE2Kcg2KrZgdiz2YrYsS5cbi0gZGV0YWlsZWRfcGxhY2U6INmB2YLYtyDYpdmGINiw2YPYsSDZhdmI2YLYudin2Ysg2KPZg9ir2LEg2KrYrdiv2YrYr9in2Ysg2KjYp9mE2KXYttin2YHYqSDYpdmE2YkgXCJwbGFjZVwiICjZhdir2KfZhDpcbiAgXCLYrtin2LHYrCDYp9mE2LXZgSDZgdmKINmC2KfYudipINin2YTYp9is2KrZhdin2LnYp9iqINio2KXYr9in2LHYqSDYp9mE2KrYudmE2YrZhVwiIOKGkiBwbGFjZT1cItiu2KfYsdisINin2YTYtdmBXCLYjFxuICBkZXRhaWxlZF9wbGFjZT1cItmC2KfYudipINin2YTYp9is2KrZhdin2LnYp9iqINio2KXYr9in2LHYqSDYp9mE2KrYudmE2YrZhVwiKS4g2KfYqtix2YPZhyDZgdin2LHYutin2Ysg2KXZhiDZhNmFINmK2YPZhlxuICDZh9mG2KfZgyDYqtmB2LXZitmEINil2LbYp9mB2Yog2YXZhtmB2LXZhCDYudmGIFwicGxhY2VcIiDZhtmB2LPZh9inLlxuLSBncmFkZTog2KfZhNi12YEg2KfZhNiv2LHYp9iz2YogKNmF2LHYrNi5INiq2YLYsdmK2KjZijoge3tHUkFERV9PUFRJT05TfX0pLlxuLSBjbGFzc19zZWN0aW9uOiDYp9mE2YHYtdmEL9in2YTYtNi52KjYqSAo2LHZgtmFINij2Ygg2KfYs9mFKS5cbi0gdGFyZ2V0OiDYp9mE2YXYs9iq2YfYr9mB2YjZhiDZhdmGINin2YTYqtmG2YHZitiwLlxuLSBjb3VudDog2KfZhNi52K/YryAo2KPYsdmC2KfZhSDYo9mIINi52K/YryDZhdmG2LfZiNmCKS5cbi0gc3ViamVjdDog2KfZhNmF2KfYr9ipINin2YTYr9ix2KfYs9mK2KkuXG4tIGxlc3Nvbjog2KfZhNiv2LHYsyDYo9mIINin2YTZhdmI2LbZiNi5INin2YTZhdit2K/Yry5cbi0gbm90ZXM6INij2Yog2YXZhNin2K3YuNipINil2LbYp9mB2YrYqSDZhNinINiq2YLYuSDYqtit2Kog2KjZhtivINii2K7YsSAtINmI2KrYtNmF2YQg2KjYp9mE2KrYrdiv2YrYryDYo9mKINis2YXZhNipINiq2LXZgVxuICDZhtiq2YrYrNipINin2YTYqtmG2YHZitiwINij2Ygg2KrZgtmK2YrZhdmHINij2Ygg2LHYryDZgdi52YQv2KPYr9in2KEg2KfZhNi32YTYp9ioICjZhdir2YQgXCLYo9iv2KfYoSDZhdmF2KrYp9iyXCLYjCBcItiq2KzYp9mI2KhcbiAg2LHYp9im2LlcItiMIFwi2KrZgdin2LnZhCDYp9mE2LfZhNin2Kgg2KjYtNmD2YQg2KzZitivXCIp2Iwg2K3YqtmJINil2YYg2YjYsdiv2Kog2YXZhNiq2LXZgtipINmF2KjYp9i02LHYqSDYqNis2YXZhNipXG4gINin2YTZhdmI2LbZiNi5L9in2YTYudmG2YjYp9mGINmG2YHYs9mH2KcgLSDYp9iz2KrYrtix2KzZh9inINmH2YbYpyDZg9is2YXZhNipINmF2LPYqtmC2YTYqSDYudmGIHRpdGxl2Iwg2YPZhdinINmB2Yog2KfZhNmF2KvYp9mEXG4gINij2LnZhNin2YcuINil2YYg2YjZj9is2K/YqiDYo9mD2KvYsSDZhdmGINmF2YTYp9it2LjYqSDZhdmG2YHYtdmE2Kkg2YHZiiDYp9mE2KzZhdmE2Kkg2YHYp9is2YXYudmH2Kcg2YXYudin2Ysg2YHZiiBub3Rlcy5cblxu2KfZhNmG2LUg2KfZhNmF2YbYt9mI2YI6XG5cInt7VFJBTlNDUklQVH19XCJcblxu2KPYudivINil2KzYp9io2KrZgyDYqNi12YrYutipIEpTT04g2YHZgti3INio2K/ZiNmGINij2Yog2YbYtSDYo9mIINi02LHYrSDYpdi22KfZgdmK2Iwg2KjYp9mE2LbYqNi3INio2YfYsNinINin2YTYtNmD2YQgKNmD2YRcbtin2YTZhdmB2KfYqtmK2K0g2KPYr9mG2KfZh9iMINio2YTYpyDYp9iz2KrYq9mG2KfYodiMINmI2YTZiCDZg9in2YbYqiDZgtmK2YXYqtmH2Kcg2YHYp9ix2LrYqSk6XG57XCJ0aXRsZVwiOlwiXCIsXCJ0ZXJtXCI6XCJcIixcInBsYWNlXCI6XCJcIixcImRldGFpbGVkX3BsYWNlXCI6XCJcIixcImdyYWRlXCI6XCJcIixcImNsYXNzX3NlY3Rpb25cIjpcIlwiLFwidGFyZ2V0XCI6XCJcIixcImNvdW50XCI6XCJcIixcInN1YmplY3RcIjpcIlwiLFwibGVzc29uXCI6XCJcIixcIm5vdGVzXCI6XCJcIn0ifQ==";

interface DecodedStrings {
  term_options: string[];
  grade_options: string[];
  err_login: string;
  err_session: string;
  err_badreq: string;
  prompt_template: string;
}

function decodeStrings(b64: string): DecodedStrings {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const json = new TextDecoder("utf-8").decode(bytes);
  return JSON.parse(json);
}

const STRINGS = decodeStrings(STRINGS_B64);

const SLOT_KEYS = [
  "title", "term", "place", "detailed_place", "grade", "class_section",
  "target", "count", "subject", "lesson", "notes",
] as const;
type SlotKey = typeof SLOT_KEYS[number];

interface ExtractRequest {
  transcript?: string;
}

// Arabic comma (U+060C) + space, built from its numeric code point (not a
// literal) to keep this entire file's source pure ASCII - see the
// file-header comment.
const ARABIC_LIST_SEPARATOR = String.fromCharCode(0x060c) + " ";

function buildPrompt(transcript: string): string {
  return STRINGS.prompt_template
    .replace("{{TERM_OPTIONS}}", STRINGS.term_options.join(ARABIC_LIST_SEPARATOR))
    .replace("{{GRADE_OPTIONS}}", STRINGS.grade_options.join(ARABIC_LIST_SEPARATOR))
    .replace("{{TRANSCRIPT}}", transcript);
}

const handleRequest = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonResponse({ detail: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return jsonResponse({ detail: STRINGS.err_login }, 401);

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: userData, error: userError } = await authClient.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return jsonResponse({ detail: STRINGS.err_session }, 401);
  }
  const userId = userData.user.id;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Same eligibility check used before any AI call in generate-report /
  // review-voice-fields - never consumes usage here, since this is just an
  // optional capture helper, not actual "report generation".
  const { error: accessError } = await supabase.rpc("check_report_access", { p_user_id: userId });
  if (accessError) return jsonResponse({ detail: accessError.message }, 403);

  let body: ExtractRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ detail: STRINGS.err_badreq }, 400);
  }

  const transcript = (body.transcript || "").trim();
  if (!transcript) return jsonResponse({ fields: {} });

  if (GEMINI_KEYS.length === 0) return jsonResponse({ fields: {}, failed: true });

  const prompt = buildPrompt(transcript);

  let raw = await callGeminiOnce(prompt);
  // failed:true lets the client tell "the AI was unavailable" apart from
  // "the AI ran and found nothing" - the two need very different handling
  // (e.g. never hide report fields just because the AI couldn't be reached).
  if (!raw) return jsonResponse({ fields: {}, failed: true });

  // Strip any possible Markdown fencing then parse defensively. An unparsable
  // answer gets ONE retry on the 2.5 fallback models (short budget); any
  // failure after that simply means "no extraction" (failed:true), since this
  // is an optional helper that must never block the report-issuing flow.
  let parsed = parseFields(raw);
  if (!parsed) {
    console.error("extract: unparsable answer, retrying with fallback models");
    raw = await callGeminiOnce(prompt, FALLBACK_MODELS, 7000);
    parsed = raw ? parseFields(raw) : null;
  }
  if (!parsed) return jsonResponse({ fields: {}, failed: true });

  const fields: Partial<Record<SlotKey, string>> = {};
  for (const key of SLOT_KEYS) {
    const val = parsed[key];
    if (typeof val === "string" && val.trim()) fields[key] = val.trim();
  }

  return jsonResponse({ fields });
};

Deno.serve(async (req: Request) => {
  const res = await handleRequest(req);
  await scheduleCallLogFlush();
  return res;
});
