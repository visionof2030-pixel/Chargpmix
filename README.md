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

/* ============ الأداة ============ */
.tool {
  max-width: 900px;
  margin: auto;
  background: white;
  padding: 30px;
  border-radius: 20px;
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

/* زر المسح */
.reset-btn {
  background: #9e9e9e;
}

/* ============ التقرير ============ */
.report { display: none; }

@page {
  size: A4;
  margin: 14mm;
}

@media print {

body { background: white; padding: 0; }
.tool { display: none; }
.report { display: block; }

.page {
  page-break-after: always;
}
.page:last-child { page-break-after: auto; }

.header {
  background: #0a3b40;
  color: white;
  padding: 15px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 15px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.info-box {
  border: 2px solid #cfd8dc;
  border-radius: 12px;
  padding: 8px;
  text-align: center;
  font-size: 12px;
}

.info-box span {
  display: block;
  background: #0a3b40;
  color: white;
  border-radius: 8px;
  padding: 4px;
  font-weight: 700;
  margin-bottom: 4px;
}

/* ===== صف المحتوى ===== */
.grid-desc {
  display: flex;
  gap: 12px;
  align-items: stretch;
  min-height: 240px;
}

.desc-box {
  flex: 1;
  border: 2px solid #cfd8dc;
  border-radius: 14px;
  padding: 15px;
  background: #f9fbfb;
  font-size: 13px;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
}

.desc-box strong {
  margin-bottom: 8px;
  color: #0a3b40;
  border-bottom: 1px dashed #cfd8dc;
  padding-bottom: 6px;
}

.desc-box p {
  flex: 1;
  white-space: pre-line;
}

.vertical {
  width: 70px;
  background: #eef3f1;
  border-radius: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 700;
  color: #1b5e52;
}

/* ===== الصور ===== */
.images {
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 12px;
  margin-top: 20px;
}

.images img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 10px;
}

/* ===== التوقيعات ===== */
.signatures {
  margin-top: 30px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.signature-box {
  text-align: center;
}

.signature-line {
  border-bottom: 2px solid #333;
  height: 30px;
  margin: 10px 0;
}

}
</style>
</head>

<body>

<div class="tool">
  <label>المنطقة التعليمية</label>
  <input oninput="region.textContent=this.value">

  <label>عنوان التقرير</label>
  <input oninput="title.textContent=this.value">

  <label>تاريخ التنفيذ</label>
  <input oninput="date.textContent=this.value">

  <label>المستهدفون</label>
  <input oninput="target.textContent=this.value">

  <label>عدد المستفيدين</label>
  <input oninput="count.textContent=this.value">

  <label>وصف مختصر</label>
  <textarea oninput="desc1.textContent=this.value"></textarea>

  <label>إجراءات التنفيذ</label>
  <textarea oninput="desc2.textContent=this.value"></textarea>

  <label>النتائج</label>
  <textarea oninput="desc3.textContent=this.value"></textarea>

  <label>التوصيات</label>
  <textarea oninput="desc4.textContent=this.value"></textarea>

  <label>إرفاق الصور</label>
  <input type="file" id="imagesInput" multiple accept="image/*">

  <button onclick="printReport()">تصدير PDF</button>
  <button class="reset-btn" onclick="resetForm()">مسح جميع الخانات</button>
</div>

<div class="report">

<!-- الصفحة الأولى -->
<div class="page">
  <div class="header">وزارة التعليم</div>

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
  <div class="header">وزارة التعليم</div>

  <div class="grid-desc">
    <div class="desc-box"><strong>النتائج</strong><p id="desc3"></p></div>
    <div class="vertical">⇄</div>
    <div class="desc-box"><strong>التوصيات</strong><p id="desc4"></p></div>
  </div>
</div>

<!-- الصفحة الثالثة -->
<div class="page">
  <div class="header">وزارة التعليم</div>

  <h3 style="text-align:center">شواهد الصور</h3>
  <div class="images" id="imagesContainer"></div>

  <div class="signatures">
    <div class="signature-box">
      اسم المعلم
      <div class="signature-line"></div>
      التوقيع
    </div>
    <div class="signature-box">
      مدير المدرسة
      <div class="signature-line"></div>
      التوقيع
    </div>
  </div>
</div>

</div>

<script>
const imagesInput = document.getElementById('imagesInput');
const imagesContainer = document.getElementById('imagesContainer');

imagesInput.addEventListener('change', e => {
  imagesContainer.innerHTML = '';
  [...e.target.files].forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = document.createElement('img');
      img.src = ev.target.result;
      imagesContainer.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

function printReport() {
  window.print();
}

function resetForm() {
  if (!confirm('هل أنت متأكد من مسح جميع الخانات؟')) return;

  document.querySelectorAll('.tool input[type="text"], .tool textarea').forEach(el => {
    el.value = '';
  });

  imagesInput.value = '';
  imagesContainer.innerHTML = '';

  document.querySelectorAll(
    '#region, #title, #date, #target, #count, #desc1, #desc2, #desc3, #desc4'
  ).forEach(el => {
    el.textContent = '';
  });
}
</script>

</body>
</html>