
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>أداة إعداد التقارير</title>

<style>
@font-face {
  font-family: 'KufamLocal';
  src: url('static/Kufam-Regular.ttf') format('truetype');
}
@font-face {
  font-family: 'KufamLocal';
  src: url('static/Kufam-Bold.ttf') format('truetype');
  font-weight: 700;
}

body {
  font-family: 'KufamLocal', sans-serif;
  background:#f2f7f6;
  margin:0;
  padding:20px;
}

/* ===== الأداة ===== */
.tool {
  max-width:900px;
  margin:auto;
  background:white;
  padding:30px;
  border-radius:20px;
}

.tool h2 {
  text-align:center;
  color:#0a3b40;
  margin-bottom:4px;
}

.by {
  text-align:center;
  font-size:12px;
  color:#4f6f68;
  margin-bottom:16px;
}

.tool label {
  font-weight:700;
  margin-top:14px;
  display:block;
}

.tool input,
.tool textarea {
  width:100%;
  padding:12px;
  margin-top:6px;
  border-radius:12px;
  border:2px solid #cfd8dc;
  font-family:inherit;
}

.counter {
  font-size:11px;
  color:#4f6f68;
  margin-top:3px;
}

.hint {
  font-size:11px;
  color:#777;
  margin-top:2px;
}

button {
  margin-top:14px;
  padding:14px;
  width:100%;
  background:#0a3b40;
  color:white;
  border:none;
  border-radius:12px;
  font-size:16px;
  font-weight:700;
  cursor:pointer;
}

.reset-btn { background:#9e9e9e; }

/* ===== التقرير ===== */
.report { display:none; }

@page { size:A4; margin:14mm; }

@media print {

body { background:white; padding:0; }
.tool { display:none; }
.report { display:block; }

.page { page-break-after:always; }
.page:last-child { page-break-after:auto; }

/* ===== الهيدر المصغر جدًا ===== */
.header {
  background:#0a3b40;
  color:white;
  padding:4px 6px;        /* ↓↓↓ تصغير قوي */
  border-radius:6px;
  text-align:center;
  margin-bottom:8px;
  line-height:1.2;
}

.header img {
  width:28px;             /* ↓↓↓ تصغير الشعار */
  display:inline-block;
  vertical-align:middle;
  margin-left:6px;
}

.header span {
  font-size:11px;         /* ↓↓↓ تصغير النص */
  font-weight:700;
  vertical-align:middle;
}

/* ===== معلومات ===== */
.info-grid {
  display:grid;
  grid-template-columns:repeat(5,1fr);
  gap:8px;
  margin-bottom:14px;
}

.info-box {
  border:2px solid #cfd8dc;
  border-radius:10px;
  padding:6px;
  text-align:center;
  font-size:11px;
}

.info-box span {
  display:block;
  background:#0a3b40;
  color:white;
  border-radius:6px;
  padding:3px;
  font-weight:700;
  margin-bottom:3px;
}

/* ===== المحتوى ===== */
.grid-desc {
  display:flex;
  gap:10px;
  min-height:260px;
}

.desc-box {
  flex:1;
  border:2px solid #cfd8dc;
  border-radius:12px;
  padding:12px;
  background:#f9fbfb;
  display:flex;
  flex-direction:column;
  font-size:12px;
}

.desc-box strong {
  margin-bottom:6px;
  border-bottom:1px dashed #cfd8dc;
  padding-bottom:4px;
  color:#0a3b40;
}

.desc-box p {
  flex:1;
  white-space:pre-line;
}

.vertical {
  width:50px;
  background:#eef3f1;
  border-radius:12px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:700;
  font-size:12px;
}

/* ===== الصور ===== */
.images {
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:10px;
  margin-top:16px;
}

.images img {
  width:100%;
  height:150px;
  object-fit:cover;
  border-radius:8px;
}

/* ===== التوقيعات ===== */
.signatures {
  margin-top:24px;
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:26px;
}

.signature-line {
  border-bottom:2px solid #333;
  height:26px;
  margin:8px 0;
}
}
</style>
</head>

<body>

<div class="tool">
  <h2>أداة إعداد التقارير</h2>
  <div class="by">نُفِّذت بواسطة / فهد الخالدي</div>

  <label>المنطقة التعليمية</label>
  <input oninput="sync('region',this.value)">

  <label>عنوان التقرير</label>
  <input oninput="sync('title',this.value)">

  <label>تاريخ التنفيذ</label>
  <input oninput="sync('date',this.value)">

  <label>المستهدفون</label>
  <input oninput="sync('target',this.value)">

  <label>عدد المستفيدين</label>
  <input oninput="sync('count',this.value)">

  <label>وصف مختصر</label>
  <textarea oninput="limitLines(this,'desc1','c1')"></textarea>
  <div class="counter" id="c1">0 / 10 أسطر</div>
  <div class="hint">الحد الأقصى 10 أسطر — بدون تقييد كلمات</div>

  <label>إجراءات التنفيذ</label>
  <textarea oninput="limitLines(this,'desc2','c2')"></textarea>
  <div class="counter" id="c2">0 / 10 أسطر</div>
  <div class="hint">الحد الأقصى 10 أسطر — بدون تقييد كلمات</div>

  <label>النتائج</label>
  <textarea oninput="limitLines(this,'desc3','c3')"></textarea>
  <div class="counter" id="c3">0 / 10 أسطر</div>
  <div class="hint">الحد الأقصى 10 أسطر — بدون تقييد كلمات</div>

  <label>التوصيات</label>
  <textarea oninput="limitLines(this,'desc4','c4')"></textarea>
  <div class="counter" id="c4">0 / 10 أسطر</div>
  <div class="hint">الحد الأقصى 10 أسطر — بدون تقييد كلمات</div>

  <label>إرفاق الصور</label>
  <input type="file" id="imagesInput" multiple accept="image/*">

  <button onclick="printReport()">تصدير PDF</button>
  <button class="reset-btn" onclick="resetForm()">مسح جميع الخانات</button>
</div>

<!-- التقرير (لم يتغير سوى الهيدر) -->
<div class="report">
  <!-- نفس صفحاتك السابقة تمامًا -->
</div>

<script>
const imagesInput=document.getElementById('imagesInput');
const imagesContainer=document.getElementById('imagesContainer');

function sync(id,val){
  document.getElementById(id).textContent=val;
  if(document.getElementById(id+'2')) document.getElementById(id+'2').textContent=val;
}

function limitLines(el,target,counter){
  let lines=el.value.split('\n');
  if(lines.length>10){
    el.value=lines.slice(0,10).join('\n');
    lines=el.value.split('\n');
  }
  document.getElementById(counter).textContent=`${lines.length} / 10 أسطر`;
  document.getElementById(target).textContent=el.value;
}

function printReport(){
  const ids=['desc1','desc2','desc3','desc4'];
  for(const id of ids){
    const lines=document.getElementById(id).textContent.split('\n').filter(l=>l.trim());
    if(lines.length>10){
      alert('الحد الأقصى 10 أسطر فقط');
      return;
    }
  }
  window.print();
}

function resetForm(){
  if(!confirm('مسح جميع الخانات؟'))return;
  document.querySelectorAll('input,textarea').forEach(e=>e.value='');
  document.querySelectorAll('[id]').forEach(e=>e.textContent='');
  imagesContainer.innerHTML='';
}
</script>

</body>
</html>