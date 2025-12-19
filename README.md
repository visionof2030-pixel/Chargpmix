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
  background: #f2f7f6;
  margin: 0;
  padding: 20px;
}

/* ===== الأداة ===== */
.tool {
  max-width: 900px;
  margin: auto;
  background: white;
  padding: 30px;
  border-radius: 20px;
}

.tool-title {
  text-align: center;
  margin-bottom: 20px;
}

.tool-title h2 {
  margin: 0;
  color: #0a3b40;
}

.tool-title .by {
  font-size: 13px;
  color: #4f6f68;
  margin-top: 6px;
}

.tool label {
  font-weight: 700;
  margin-top: 14px;
  display: block;
}

.tool input,
.tool textarea {
  width: 100%;
  padding: 12px;
  margin-top: 6px;
  border-radius: 12px;
  border: 2px solid #cfd8dc;
  font-family: inherit;
}

button {
  margin-top: 15px;
  padding: 15px;
  width: 100%;
  background: #0a3b40;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
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

/* ===== الهيدر (مصغر) ===== */
.header {
  background:#0a3b40;
  color:white;
  padding:8px 10px;
  border-radius:10px;
  text-align:center;
  margin-bottom:12px;
}

.header img {
  width:45px;
  display:block;
  margin:0 auto 4px;
}

.header span {
  font-size:14px;
  font-weight:700;
}

/* ===== المعلومات ===== */
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
  <div class="tool-title">
    <h2>أداة إعداد التقارير</h2>
    <div class="by">نُفِّذت بواسطة / فهد الخالدي</div>
  </div>

  <label>المنطقة التعليمية</label>
  <input oninput="setText('region',this.value)">

  <label>عنوان التقرير</label>
  <input oninput="setText('title',this.value)">

  <label>تاريخ التنفيذ</label>
  <input oninput="setText('date',this.value)">

  <label>المستهدفون</label>
  <input oninput="setText('target',this.value)">

  <label>عدد المستفيدين</label>
  <input oninput="setText('count',this.value)">

  <label>وصف مختصر</label>
  <textarea oninput="validateText(this,'desc1')"></textarea>

  <label>إجراءات التنفيذ</label>
  <textarea oninput="validateText(this,'desc2')"></textarea>

  <label>النتائج</label>
  <textarea oninput="validateText(this,'desc3')"></textarea>

  <label>التوصيات</label>
  <textarea oninput="validateText(this,'desc4')"></textarea>

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
    <span>وزارة التعليم</span>
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
    <span>وزارة التعليم</span>
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
    <span>وزارة التعليم</span>
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

function setText(id,val){
  document.getElementById(id).textContent=val;
  if(document.getElementById(id+'2')) document.getElementById(id+'2').textContent=val;
}

function validateText(el,target){
  const lines=el.value.trim().split('\n');
  if(lines.length>10){
    alert('الحد الأقصى 10 أسطر');
    el.value=lines.slice(0,10).join('\n');
  }
  for(const l of lines){
    if(l.trim().split(/\s+/).length!==6){
      el.style.borderColor='red';
      return;
    }
  }
  el.style.borderColor='#cfd8dc';
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

function printReport(){ window.print(); }

function resetForm(){
  if(!confirm('مسح جميع الخانات؟'))return;
  document.querySelectorAll('input,textarea').forEach(e=>e.value='');
  imagesContainer.innerHTML='';
  document.querySelectorAll('[id]').forEach(e=>e.textContent='');
}
</script>

</body>
</html>