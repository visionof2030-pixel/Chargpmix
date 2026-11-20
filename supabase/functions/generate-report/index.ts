// supabase/functions/generate-report/index.ts
// Deployed copy: comments stripped and non-ASCII characters \u-escaped for
// transport safety. Readable, commented source: generate-report-edge-fn.ts
// in the Chargpmix repository.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const CORS_HEADERS: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
function shuffledKeyOrder(): string[] {
    const n = GEMINI_KEYS.length;
    if (n === 0)
        return [];
    const start = Math.floor(Math.random() * n);
    return Array.from({ length: n }, (_, i) => GEMINI_KEYS[(start + i) % n]);
}
const PER_ATTEMPT_TIMEOUT_MS = 30000;
const OVERALL_DEADLINE_MS = 75000;
// النموذج الأساسي 3.1 Flash-Lite (حصته المجانية ٥٠٠ طلب/يوم لكل مشروع)، و2.5 Flash-Lite احتياطاً.
// المرور: الأساسي على كل المفاتيح أولاً، ثم الاحتياطي على كل المفاتيح.
const PRIMARY_MODEL = "gemini-3.1-flash-lite";
const GEMINI_MODELS = [PRIMARY_MODEL, "gemini-2.5-flash-lite"];
// مهلة أقصر للنموذج الأساسي: لو تأخر ينتقل للاحتياطي بدل انتظار نصف دقيقة.
const PRIMARY_TIMEOUT_MS = 15000;
// بعد ردّين 503 (ضغط عالٍ لدى Google على النموذج نفسه) يُتجاوز إلى الاحتياطي.
const PRIMARY_MAX_503 = 2;
// صاحب المشروع: يُعاد له اسم النموذج الذي كتب التقرير (لدراسة الحالة)، ولا يُعاد لغيره.
const OWNER_EMAIL = "ifahadenglish@gmail.com";

interface VoiceCorrectionFeedback {
    field_name?: string;
    original_text?: string;
    suggested_text?: string;
    accepted?: boolean;
}
interface GenerateReportRequest {
    criterion_id?: string | null;
    subcategory_id?: string | null;
    report_id?: string | null;
    role?: string;
    report_data?: Record<string, unknown>;
    voice_corrections_feedback?: VoiceCorrectionFeedback[];
    input_method?: string;
}
function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
}
function fillTemplate(template: string, vars: Record<string, string>): string {
    let out = template;
    for (const [key, value] of Object.entries(vars)) {
        out = out.replaceAll(`{${key}}`, value);
    }
    return out;
}
function stripMarkdown(text: string): string {
    return text
        .replaceAll("**", "")
        .replaceAll("*", "")
        .replaceAll("##", "")
        .replaceAll("#", "")
        .replaceAll("`", "")
        .replaceAll("-", "");
}
function pickSupervisorTemplateKey(reportName: string): string {
    const name = reportName.toLowerCase();
    const analyticalWords = ["تحليل", "مؤشر", "نتائج", "قياس", "اتجاهات"];
    const projectWords = ["مبادرة", "مشروع", "برنامج", "تطبيق", "تنفيذ"];
    if (analyticalWords.some((w) => name.includes(w)))
        return "analytical";
    if (projectWords.some((w) => name.includes(w)))
        return "project";
    return "support";
}
interface GeminiCallResult {
    content: string | null;
    lastErrorMessage: string;
    attempts: number;
    succeededOnAttempt: number | null;
    model?: string;
}
async function callGeminiWithFailover(prompt: string): Promise<GeminiCallResult> {
    const totalKeys = GEMINI_KEYS.length;
    let lastErrorMessage = "لم يتم إعداد أي مفتاح للذكاء الاصطناعي";
    let attempts = 0;
    const keys = shuffledKeyOrder();
    const deadline = Date.now() + OVERALL_DEADLINE_MS;
    for (const model of GEMINI_MODELS) {
        let skipModel = false;
        let count503 = 0;
        for (let i = 0; i < totalKeys && !skipModel; i++) {
            const apiKey = keys[i];
            if (!apiKey)
                break;
            const remaining = deadline - Date.now();
            if (remaining < 3000) {
                console.error(`Overall generation deadline reached after ${attempts} attempt(s); giving up.`);
                return { content: null, lastErrorMessage, attempts, succeededOnAttempt: null };
            }
            attempts++;
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), Math.min(model === PRIMARY_MODEL ? PRIMARY_TIMEOUT_MS : PER_ATTEMPT_TIMEOUT_MS, remaining));
            try {
                const geminiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                    }),
                    signal: controller.signal,
                });
                if (!geminiResp.ok) {
                    lastErrorMessage = await geminiResp.text();
                    console.error(`Gemini attempt ${i + 1}/${totalKeys} (${model}) failed (HTTP ${geminiResp.status}), trying next...`);
                    // 400/404: النموذج نفسه غير متاح — لا فائدة من بقية المفاتيح عليه.
                    if (geminiResp.status === 400 || geminiResp.status === 404)
                        skipModel = true;
                    if (geminiResp.status === 503 && model === PRIMARY_MODEL && ++count503 >= PRIMARY_MAX_503)
                        skipModel = true;
                    continue;
                }
                const geminiJson = await geminiResp.json();
                const parts = geminiJson?.candidates?.[0]?.content?.parts ?? [];
                const text = parts.map((p: {
                    text?: string;
                }) => p.text || "").join("");
                if (!text) {
                    lastErrorMessage = "empty response from Gemini";
                    console.error(`Gemini attempt ${i + 1}/${totalKeys} (${model}) returned empty content, trying next...`);
                    continue;
                }
                console.log(`gemini ok model=${model} key=${i + 1}`);
                return { content: stripMarkdown(text), lastErrorMessage: "", attempts, succeededOnAttempt: attempts, model };
            }
            catch (e) {
                lastErrorMessage = e instanceof Error ? e.message : String(e);
                console.error(`Gemini attempt ${i + 1}/${totalKeys} (${model}) threw (${lastErrorMessage}), trying next...`);
                // بطء النموذج الأساسي عام لا يخص مفتاحاً بعينه: انتقل للاحتياطي مباشرة.
                if (model === PRIMARY_MODEL && e instanceof Error && e.name === "AbortError")
                    skipModel = true;
            }
            finally {
                clearTimeout(timer);
            }
        }
    }
    return { content: null, lastErrorMessage, attempts, succeededOnAttempt: null };
}
Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS_HEADERS });
    }
    if (req.method !== "POST") {
        return jsonResponse({ detail: "Method not allowed" }, 405);
    }
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) {
        return jsonResponse({ detail: "يجب تسجيل الدخول" }, 401);
    }
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: userData, error: userError } = await authClient.auth.getUser(jwt);
    if (userError || !userData?.user) {
        return jsonResponse({ detail: "جلسة غير صالحة، يرجى تسجيل الدخول من جديد" }, 401);
    }
    const userId = userData.user.id;
    const isOwner = (userData.user.email || "").toLowerCase() === OWNER_EMAIL;
    let body: GenerateReportRequest;
    try {
        body = await req.json();
    }
    catch {
        return jsonResponse({ detail: "طلب غير صالح" }, 400);
    }
    const role = body.role || "teacher";
    const reportData = body.report_data || {};
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { error: accessError } = await supabase.rpc("check_report_access", {
        p_user_id: userId,
    });
    if (accessError) {
        return jsonResponse({ detail: accessError.message }, 403);
    }
    let reportName: string;
    let subcategoryName: string;
    let criterionName: string;
    let criterionPercentage = "";
    const isFreeMode = !body.criterion_id || !body.subcategory_id || !body.report_id;
    if (isFreeMode) {
        reportName = (reportData.title as string) || "تقرير مدرسي";
        subcategoryName = "عام";
        criterionName = "عام";
    }
    else {
        const { data: report, error: reportErr } = await supabase
            .from("reports")
            .select("id, subcategory_id, name")
            .eq("id", body.report_id)
            .maybeSingle();
        if (reportErr || !report) {
            return jsonResponse({ detail: "Report not found" }, 404);
        }
        const { data: subcategory, error: subErr } = await supabase
            .from("subcategories")
            .select("id, criterion_id, name")
            .eq("id", body.subcategory_id)
            .maybeSingle();
        if (subErr || !subcategory) {
            return jsonResponse({ detail: "Subcategory not found" }, 404);
        }
        if (report.subcategory_id !== body.subcategory_id) {
            return jsonResponse({ detail: "Report does not belong to this subcategory" }, 400);
        }
        const { data: criterion, error: critErr } = await supabase
            .from("criteria")
            .select("id, role_id, name, weight")
            .eq("id", body.criterion_id)
            .maybeSingle();
        if (critErr || !criterion) {
            return jsonResponse({ detail: "Criterion not found" }, 404);
        }
        if (subcategory.criterion_id !== body.criterion_id) {
            return jsonResponse({ detail: "Subcategory does not belong to this criterion" }, 400);
        }
        reportName = report.name;
        subcategoryName = subcategory.name;
        criterionName = criterion.name;
        criterionPercentage = criterion.weight || "";
    }
    let templateRoleId = role;
    let templateKey = "default";
    let reportMode = "";
    if (role === "educational_supervisor") {
        templateKey = pickSupervisorTemplateKey(reportName);
        reportMode = "قيادي تربوي";
    }
    let { data: templateRow } = await supabase
        .from("prompt_templates")
        .select("template")
        .eq("role_id", templateRoleId)
        .eq("template_key", templateKey)
        .maybeSingle();
    if (!templateRow) {
        templateRoleId = "teacher";
        templateKey = "default";
        const fallback = await supabase
            .from("prompt_templates")
            .select("template")
            .eq("role_id", "teacher")
            .eq("template_key", "default")
            .maybeSingle();
        templateRow = fallback.data;
    }
    if (!templateRow) {
        return jsonResponse({ detail: "لم يتم العثور على قالب مناسب" }, 500);
    }
    const subject = (reportData.subject as string) || "";
    const lesson = (reportData.lesson as string) || "";
    const grade = (reportData.grade as string) || "";
    const target = (reportData.target as string) || "";
    const place = (reportData.place as string) || "";
    const detailedPlace = (reportData.detailed_place as string) || "";
    const count = (reportData.count as string) || "";
    const field = (reportData.field as string) || "";
    const initiative = (reportData.initiative as string) || "";
    const duration = (reportData.duration as string) || "";
    const extraNotes = (reportData.extra_notes as string) || "";
    const prompt = fillTemplate(templateRow.template, {
        report_name: reportName,
        subcategory_name: subcategoryName,
        criterion_name: criterionName,
        criterion_percentage: criterionPercentage,
        subject_line: subject ? `المادة: ${subject}` : "",
        lesson_line: lesson ? `الدرس: ${lesson}` : "",
        grade_line: grade ? `الصف: ${grade}` : "",
        target_line: target ? `المستهدفون: ${target}` : "",
        place_line: place
            ? `مكان التنفيذ: ${place}${detailedPlace ? ` (${detailedPlace})` : ""}`
            : "",
        count_line: count ? `عدد الحضور: ${count}` : "",
        extra_notes_line: extraNotes ? `ملاحظات إضافية من مقدّم التقرير: ${extraNotes}` : "",
        field,
        initiative,
        duration,
        report_mode: reportMode,
    });
    if (GEMINI_KEYS.length === 0) {
        return jsonResponse({ detail: "لم يتم إعداد مفتاح الذكاء الاصطناعي" }, 500);
    }
    const geminiResult = await callGeminiWithFailover(prompt);
    if (!geminiResult.content) {
        console.error(`All ${geminiResult.attempts} configured Gemini key(s) failed for this request. Last error: ${geminiResult.lastErrorMessage}`);
        return jsonResponse({
            detail: `فشل توليد المحتوى بعد تجربة ${geminiResult.attempts} مفتاح/مفاتيح: ${geminiResult.lastErrorMessage}`,
        }, 500);
    }
    const content = geminiResult.content;
    const { error: consumeError } = await supabase.rpc("consume_report_usage", {
        p_user_id: userId,
    });
    if (consumeError) {
        return jsonResponse({ detail: consumeError.message }, 403);
    }
    let reporterName: string | null = null;
    try {
        const { data: prof } = await supabase.from("profiles").select("reporter_name, username").eq("id", userId).maybeSingle();
        reporterName = ((prof?.reporter_name || prof?.username || "") as string).slice(0, 120) || null;
    }
    catch (_e) {
        reporterName = null;
    }
    const inputMethod = body.input_method === "voice" || body.input_method === "typed" ? body.input_method : null;
    const { error: logError } = await supabase.from("report_generation_log").insert({
        user_id: userId,
        role,
        report_id: isFreeMode ? null : body.report_id,
        title: String(reportName || "").slice(0, 300) || null,
        template_kind: "long",
        input_method: inputMethod,
        reporter_name: reporterName,
        ai_model: geminiResult.model || null,
    });
    if (logError) {
        console.error("report_generation_log insert failed:", logError.message);
    }
    if (Array.isArray(body.voice_corrections_feedback) && body.voice_corrections_feedback.length) {
        const rows = body.voice_corrections_feedback
            .filter((c): c is Required<VoiceCorrectionFeedback> => !!c && typeof c.field_name === "string" && typeof c.original_text === "string" &&
            typeof c.suggested_text === "string" && typeof c.accepted === "boolean")
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
            if (fbError) {
                console.error("voice_field_corrections insert failed:", fbError.message);
            }
        }
    }
    return jsonResponse({
        content,
        report_id: isFreeMode ? null : body.report_id,
        report_name: reportName,
        subcategory_name: isFreeMode ? null : subcategoryName,
        criterion_name: isFreeMode ? null : criterionName,
        generated_at: new Date().toISOString(),
        ...(isOwner ? { ai_model: geminiResult.model || null } : {}),
    });
});
