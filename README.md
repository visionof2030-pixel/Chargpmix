<!DOCTYPE html>
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
  margin-bottom:6px;
}

.by {
  text-align:center;
  font-size:13px;
  color:#4f6f68;
  margin-bottom:20px;
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
  font-size:12px;
  color:#4f6f68;
  margin-top:4px;
}

.hint {
  font-size:12px;
  color:#777;
  margin-top:2px;
}

button {
  margin-top:15px;
  padding:15px;
  width:100%;
  background:#0a3b40;
  color:white;
  border:none;
  border-radius:12px;
  font-size:17px;
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

/* ===== الهيدر ===== */
.header {
  background:#0a3b40;
  color:white;
  padding:8px;
  border-radius:10px;
  text-align:center;
  margin-bottom:12px;
}

.header img {
  width:45px;
  display:block;
  margin:0 auto 4px;
}

/* ===== معلومات ===== */
.info-grid {
  display:grid;
  grid-template-columns:repeat(5,1fr);
  gap:10px;
  margin-bottom:18px;
}

.info-box {
  border:2px solid #cfd8dc;
  border-radius:12px;
  padding:8px;
  text-align:center;
  font-size:12px;
}

.info-box span {
  display:block;
  background:#0a3b40;
  color:white;
  border-radius:8px;
  padding:4px;
  font-weight:700;
  margin-bottom:4px;
}

/* ===== المحتوى ===== */
.grid-desc {
  display:flex;
  gap:12px;
  min-height:260px;
}

.desc-box {
  flex:1;
  border:2px solid #cfd8dc;
  border-radius:14px;
  padding:15px;
  background:#f9fbfb;
  display:flex;
  flex-direction:column;
  font-size:13px;
}

.desc-box strong {
  margin-bottom:8px;
  border-bottom:1px dashed #cfd8dc;
  padding-bottom:6px;
  color:#0a3b40;
}

.desc-box p {
  flex:1;
  white-space:pre-line;
}

.vertical {
  width:60px;
  background:#eef3f1;
  border-radius:14px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:700;
}

/* ===== الصور ===== */
.images {
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:12px;
  margin-top:20px;
}

.images img {
  width:100%;
  height:160px;
  object-fit:cover;
  border-radius:10px;
}

/* ===== التوقيعات ===== */
.signatures {
  margin-top:30px;
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:30px;
}

.signature-line {
  border-bottom:2px solid #333;
  height:30px;
  margin:10px 0;
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

<div class="report">

<!-- الصفحة الأولى -->
<div class="page">
  <div class="header">
    <img src="https://i.ibb.co/kshh2Tf8/IMG-2109.jpg">
    وزارة التعليم
  </div>

  <div class="info-grid">
    <div class="info-box"><span>المنطقة</span><div id="region"></div></div>
    <div class="info-box"><span>عنوان التقرير</span><div id="title"></div></div>
    <div class="info-box"><span>تاريخ التنفيذ</span><div id="date"></div></div>
    <div class="info-box"><span>المستهدفون</span><div id="target"></div></div>
    <div class="info-box"><span>عدد المستفيدين</span><div id="count"></div></div>
  </div>

  <div class="grid-desc">
    <div class="desc-box"><strong>وصف مختصر</strong><p id="desc1"></p></div>
    <div class="vertical">⇄</div>
    <div class="desc-box"><strong>إجراءات التنفيذ</strong><p id="desc2"></p></div>
  </div>
</div>

<!-- الصفحة الثانية -->
<div class="page">
  <div class="header">
    <img src="https://i.ibb.co/kshh2Tf8/IMG-2109.jpg">
    وزارة التعليم
  </div>

  <div class="info-grid">
    <div class="info-box"><span>المنطقة</span><div id="region2"></div></div>
    <div class="info-box"><span>عنوان التقرير</span><div id="title2"></div></div>
    <div class="info-box"><span>تاريخ التنفيذ</span><div id="date2"></div></div>
    <div class="info-box"><span>المستهدفون</span><div id="target2"></div></div>
    <div class="info-box"><span>عدد المستفيدين</span><div id="count2"></div></div>
  </div>

  <div class="grid-desc">
    <div class="desc-box"><strong>النتائج</strong><p id="desc3"></p></div>
    <div class="vertical">⇄</div>
    <div class="desc-box"><strong>التوصيات</strong><p id="desc4"></p></div>
  </div>
</div>

<!-- الصفحة الثالثة -->
<div class="page">
  <div class="header">
    <img src="https://i.ibb.co/kshh2Tf8/IMG-2109.jpg">
    وزارة التعليم
  </div>

  <h3 style="text-align:center">شواهد الصور</h3>
  <div class="images" id="imagesContainer"></div>

  <div class="signatures">
    <div>اسم المعلم<div class="signature-line"></div>التوقيع</div>
    <div>مدير المدرسة<div class="signature-line"></div>التوقيع</div>
  </div>
</div>

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

imagesInput.addEventListener('change',e=>{
  imagesContainer.innerHTML='';
  [...e.target.files].forEach(f=>{
    const r=new FileReader();
    r.onload=ev=>{
      const img=document.createElement('img');
      img.src=ev.target.result;
      imagesContainer.appendChild(img);
    };
    r.readAsDataURL(f);
  });
});

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