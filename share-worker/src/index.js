// خادم مشاركة التقارير (رموز QR في ملف الإنجاز).
//
//   POST   /v1/reports   رفع حتى 3 تقارير للمعلم المسجّل → { ids: { key: id } }
//   GET    /v1/r/:id     قراءة عامة لتقرير واحد برمزه (لمن يمسح الرمز)
//   DELETE /v1/r/:id     حذف تقرير يملكه المعلم
//
// مزامنة تقارير المعلم بين أجهزته (خاصة به وحده، تتطلب جلسة الدخول):
//   GET    /v1/sync              قائمة تقاريره: [{ k, u, d }] (المفتاح، وقت التعديل، محذوف؟)
//   GET    /v1/sync/item?k=      التقرير كاملاً
//   PUT    /v1/sync/item?k=&u=   حفظ التقرير (JSON) بوقت تعديله
//   DELETE /v1/sync/item?k=&u=   حذف (يبقى أثر حذف حتى تحذفه أجهزته الأخرى)
//   GET/PUT /v1/profile          بيانات إضافية للمعلم (التخصص) { subject, u }
//
// يتحقق من المعلم تلقائياً بجلسة دخوله الحالية في الأداة (رمز الجلسة يُرسل في Authorization)،
// بسؤال خدمة تسجيل الدخول عن صاحب الرمز (قراءة فقط). لا يحتاج المعلم أي مفتاح إضافي.
//
// التخزين في حاوية R2 (REPORTS):
//   r/<id>.json            { v, owner, key, content, updated_at }
//   u/<owner>/k/<sha(key)> نص فيه <id>  ← يُبقي رمز التقرير ثابتاً للمعلم نفسه من أي جهاز
//   s/<owner>/<sha(key)>   نسخة المزامنة الكاملة، وبياناتها الوصفية { k, u, d }

const ID_RE = /^[A-Za-z0-9]{12,40}$/;
const IMG_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const ABC = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_BODY = 8 * 1024 * 1024;      // حجم طلب الرفع كاملاً
const MAX_CONTENT = 2560 * 1024;       // حجم التقرير الواحد بعد التحويل إلى JSON (مع صورة القالب الرسمي)
const MAX_ITEMS = 3;
const MAX_SYNC_ITEM = 12 * 1024 * 1024;  // تقرير المزامنة الواحد (بصوره)
const MAX_SYNC_COUNT = 3000;             // عدد تقارير المعلم الواحد

export default {
    async fetch(req, env) {
        const cors = corsHeaders(req, env);
        if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
        const url = new URL(req.url);
        try {
            const m = url.pathname.match(/^\/v1\/r\/([^/]+)$/);
            if (m && req.method === 'GET') return await getReport(m[1], env, cors);
            if (m && req.method === 'DELETE') return await deleteReport(req, m[1], env, cors);
            if (url.pathname === '/v1/reports' && req.method === 'POST') return await upload(req, env, cors);
            if (url.pathname === '/v1/sync' && req.method === 'GET') return await syncList(req, env, cors);
            if (url.pathname === '/v1/sync/item') return await syncItem(req, url, env, cors);
            if (url.pathname === '/v1/profile') return await profile(req, env, cors);
            return json({ error: 'not_found' }, 404, cors);
        } catch (e) {
            console.error(e);
            return json({ error: 'server' }, 500, cors);
        }
    },
};

function corsHeaders(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const ok = !allowed.length || allowed.includes(origin);
    return {
        'Access-Control-Allow-Origin': ok ? (origin || '*') : allowed[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
    };
}

function json(obj, status, cors, extra) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff', ...cors, ...(extra || {}) },
    });
}

// صاحب جلسة الدخول، أو null. لا يقبل إلا مستخدماً مسجّلاً فعلاً (ليس المفتاح العام).
async function verifyUser(req, env) {
    const h = req.headers.get('Authorization') || '';
    const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
    if (!token || token.length > 8192) return null;
    const res = await fetch(env.AUTH_URL.replace(/\/+$/, '') + '/auth/v1/user', {
        headers: { apikey: env.AUTH_ANON_KEY, Authorization: 'Bearer ' + token },
    });
    if (!res.ok) return null;
    const u = await res.json().catch(() => null);
    return u && typeof u.id === 'string' && /^[0-9a-f-]{36}$/i.test(u.id) ? u.id : null;
}

async function sha(s) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
}

function newId() {
    const a = new Uint8Array(16);
    crypto.getRandomValues(a);
    return Array.from(a, b => ABC[b % ABC.length]).join('');
}

const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : typeof v === 'number' ? String(v).slice(0, n) : '');
const pairs = (x, n) => (Array.isArray(x) ? x : [])
    .filter(p => Array.isArray(p) && p.length >= 2)
    .slice(0, 40)
    .map(([l, v]) => [str(l, 200), str(v, n)]);

// يبقي الحقول المعروفة فقط بأحجام معقولة؛ الصور data: بصيغة صورة فقط.
function cleanContent(c) {
    if (!c || typeof c !== 'object') return null;
    return {
        v: 1,
        title: str(c.title, 300) || 'تقرير',
        date: str(c.date, 100),
        criterion: str(c.criterion, 300),
        criterionNo: Number.isFinite(+c.criterionNo) ? Math.max(0, Math.min(99, Math.floor(+c.criterionNo))) : 0,
        teacher: str(c.teacher, 200),
        role: str(c.role, 200),
        school: str(c.school, 200),
        subject: str(c.subject, 200),
        education: str(c.education, 200),
        meta: pairs(c.meta, 500),
        secs: pairs(c.secs, 20000),
        images: (Array.isArray(c.images) ? c.images : []).filter(s => typeof s === 'string' && IMG_RE.test(s)).slice(0, 2),
        // صورة التقرير بقالبه الرسمي (كما في PDF التقرير)
        official: typeof c.official === 'string' && c.official.length < 1600 * 1024 && IMG_RE.test(c.official) ? c.official : '',
    };
}

async function countOwned(env, owner, stopAt) {
    let n = 0, cursor;
    do {
        const page = await env.REPORTS.list({ prefix: `u/${owner}/k/`, cursor, limit: 1000 });
        n += page.objects.length;
        cursor = page.truncated ? page.cursor : undefined;
    } while (cursor && n < stopAt);
    return n;
}

async function upload(req, env, cors) {
    const len = +(req.headers.get('Content-Length') || 0);
    if (len > MAX_BODY) return json({ error: 'too_large' }, 413, cors);
    const owner = await verifyUser(req, env);
    if (!owner) return json({ error: 'auth' }, 401, cors);
    const text = await req.text();
    if (text.length > MAX_BODY) return json({ error: 'too_large' }, 413, cors);
    let body;
    try { body = JSON.parse(text); } catch (_) { return json({ error: 'bad_json' }, 400, cors); }
    const items = Array.isArray(body && body.items) ? body.items.slice(0, MAX_ITEMS) : [];
    if (!items.length) return json({ error: 'empty' }, 400, cors);

    const max = Math.max(1, +(env.MAX_REPORTS_PER_USER || 500));
    let owned = null; // يُحسب عند أول تقرير جديد فقط
    const ids = {};
    let limited = false;
    for (const it of items) {
        const key = str(it && it.key, 200);
        const content = cleanContent(it && it.content);
        if (!key || !content) continue;
        const raw = JSON.stringify(content);
        if (raw.length > MAX_CONTENT) continue;
        const idxKey = `u/${owner}/k/${await sha(key)}`;
        const idxObj = await env.REPORTS.get(idxKey);
        let id = idxObj ? (await idxObj.text()).trim() : '';
        if (!ID_RE.test(id)) {
            if (owned === null) owned = await countOwned(env, owner, max);
            if (owned >= max) { limited = true; continue; }
            id = newId();
            await env.REPORTS.put(idxKey, id);
            owned++;
        }
        await env.REPORTS.put(`r/${id}.json`, JSON.stringify({ v: 1, owner, key, content, updated_at: new Date().toISOString() }), {
            httpMetadata: { contentType: 'application/json; charset=utf-8' },
        });
        ids[key] = id;
    }
    return json(limited ? { ids, error: 'limit' } : { ids }, 200, cors);
}

async function getReport(id, env, cors) {
    if (!ID_RE.test(id)) return json({ error: 'not_found' }, 404, cors);
    const obj = await env.REPORTS.get(`r/${id}.json`);
    if (!obj) return json({ error: 'not_found' }, 404, cors);
    const rec = await obj.json().catch(() => null);
    if (!rec || !rec.content) return json({ error: 'not_found' }, 404, cors);
    // لا يُعاد معرّف المالك ولا مفتاح التقرير للعموم.
    return json(rec.content, 200, cors, { 'Cache-Control': 'public, max-age=60' });
}

async function deleteReport(req, id, env, cors) {
    if (!ID_RE.test(id)) return json({ error: 'not_found' }, 404, cors);
    const owner = await verifyUser(req, env);
    if (!owner) return json({ error: 'auth' }, 401, cors);
    const obj = await env.REPORTS.get(`r/${id}.json`);
    if (!obj) return json({ ok: true }, 200, cors);
    const rec = await obj.json().catch(() => null);
    if (!rec || rec.owner !== owner) return json({ error: 'forbidden' }, 403, cors);
    await env.REPORTS.delete([`r/${id}.json`, `u/${owner}/k/${await sha(rec.key)}`]);
    return json({ ok: true }, 200, cors);
}

// ===================== مزامنة تقارير المعلم بين أجهزته =====================
async function syncList(req, env, cors) {
    const owner = await verifyUser(req, env);
    if (!owner) return json({ error: 'auth' }, 401, cors);
    const items = [];
    let cursor;
    do {
        const page = await env.REPORTS.list({ prefix: `s/${owner}/`, cursor, limit: 1000, include: ['customMetadata'] });
        page.objects.forEach(o => {
            const m = o.customMetadata || {};
            if (m.k) items.push({ k: m.k, u: +m.u || 0, d: m.d === '1' });
        });
        cursor = page.truncated ? page.cursor : undefined;
    } while (cursor && items.length < MAX_SYNC_COUNT + 1000);
    return json({ items }, 200, cors, { 'Cache-Control': 'no-store' });
}

async function syncItem(req, url, env, cors) {
    const owner = await verifyUser(req, env);
    if (!owner) return json({ error: 'auth' }, 401, cors);
    const k = str(url.searchParams.get('k'), 200);
    if (!k) return json({ error: 'bad_key' }, 400, cors);
    const objKey = `s/${owner}/${await sha(k)}`;
    const u = Math.max(0, Math.floor(+url.searchParams.get('u') || 0)) || Date.now();

    if (req.method === 'GET') {
        const obj = await env.REPORTS.get(objKey);
        if (!obj || (obj.customMetadata || {}).d === '1') return json({ error: 'not_found' }, 404, cors);
        return new Response(obj.body, { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors } });
    }
    if (req.method === 'PUT') {
        const len = +(req.headers.get('Content-Length') || 0);
        if (len > MAX_SYNC_ITEM) return json({ error: 'too_large' }, 413, cors);
        const text = await req.text();
        if (text.length > MAX_SYNC_ITEM) return json({ error: 'too_large' }, 413, cors);
        let rep;
        try { rep = JSON.parse(text); } catch (_) { return json({ error: 'bad_json' }, 400, cors); }
        if (!rep || typeof rep !== 'object' || Array.isArray(rep)) return json({ error: 'bad_json' }, 400, cors);
        const head = await env.REPORTS.head(objKey);
        if (!head) {
            const n = await countSync(env, owner, MAX_SYNC_COUNT);
            if (n >= MAX_SYNC_COUNT) return json({ error: 'limit' }, 409, cors);
        }
        await env.REPORTS.put(objKey, text, {
            httpMetadata: { contentType: 'application/json; charset=utf-8' },
            customMetadata: { k, u: String(u), d: '0' },
        });
        return json({ ok: true, u }, 200, cors);
    }
    if (req.method === 'DELETE') {
        await env.REPORTS.put(objKey, '', { customMetadata: { k, u: String(u), d: '1' } });
        return json({ ok: true, u }, 200, cors);
    }
    return json({ error: 'not_found' }, 404, cors);
}

async function countSync(env, owner, stopAt) {
    let n = 0, cursor;
    do {
        const page = await env.REPORTS.list({ prefix: `s/${owner}/`, cursor, limit: 1000 });
        n += page.objects.length;
        cursor = page.truncated ? page.cursor : undefined;
    } while (cursor && n < stopAt);
    return n;
}

// ===================== بيانات المعلم الإضافية (التخصص) =====================
async function profile(req, env, cors) {
    const owner = await verifyUser(req, env);
    if (!owner) return json({ error: 'auth' }, 401, cors);
    const key = `p/${owner}.json`;
    if (req.method === 'GET') {
        const obj = await env.REPORTS.get(key);
        const rec = obj ? await obj.json().catch(() => null) : null;
        return json(rec || {}, 200, cors, { 'Cache-Control': 'no-store' });
    }
    if (req.method === 'PUT') {
        let b; try { b = JSON.parse(await req.text()); } catch (_) { return json({ error: 'bad_json' }, 400, cors); }
        const rec = { subject: str(b && b.subject, 120), u: Math.max(0, Math.floor(+(b && b.u) || 0)) || Date.now() };
        await env.REPORTS.put(key, JSON.stringify(rec), { httpMetadata: { contentType: 'application/json; charset=utf-8' } });
        return json({ ok: true, u: rec.u }, 200, cors);
    }
    return json({ error: 'not_found' }, 404, cors);
}
