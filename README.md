<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>أداة إعداد التقارير</title>

<style>
/* ===== الخط ===== */
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

/* ================= الأداة ================= */
.tool {
  max-width: 900px;
  margin: auto;
  background: white;
  padding: 30px;
  border-radius: 20px;
}

.tool label {
  font-weight: 700;
  display: block;
  margin-top: 14px;
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
  margin-top: 25px;
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

/* ===== معاينة الصور ===== */
.preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px,1fr));
  gap: 10px;
  margin-top: 10px;
}
.preview img {
  width: 100%;
  height: 110px;
  object-fit: cover;
  border-radius: 10px;
}

/* ================= التقرير ================= */
.report { display: none; }

@page {
  size: A4;
  margin: 14mm;
}

@media print {

  body { padding: 0; background: white; }
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

  .school {
    background: #0a3b40;
    color: white;
    width: fit-content;
    margin: 10px auto 15px;
    padding: 8px 25px;
    border-radius: 10px;
    font-weight: 700;
  }

  /* ===== صف المحتوى (الحل النهائي) ===== */
  .grid-desc {
    display: flex;
    gap: 12px;
    align-items: stretch;
    min-height: 240px; /* +20% */
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

  /* ===== المربع الأوسط ===== */
  .vertical {
    width: 70px;
    background: #eef3f1;
    border-radius: 14px;
    display: flex;
    flex-direction: column;
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
}
</style>
</head>

<body>

<div class="tool">
  <label>اسم المدرسة</label>
  <input oninput="school.textContent=this.value">

  <label>وصف مختصر</label>
  <textarea oninput="desc1.textContent=this.value"></textarea>

  <label>إجراءات التنفيذ</label>
  <textarea oninput="desc2.textContent=this.value"></textarea>

  <label>إرفاق الصور</label>
  <input type="file" id="imagesInput" multiple accept="image/*">

  <div class="preview" id="preview"></div>

  <button onclick="printReport()">تصدير PDF</button>
</div>

<div class="report">

<div class="page">
  <div class="header">وزارة التعليم</div>
  <div class="school" id="school"></div>

  <div class="grid-desc">
    <div class="desc-box">
      <strong>وصف مختصر</strong>
      <p id="desc1"></p>
    </div>

    <div class="vertical">⇄</div>

    <div class="desc-box">
      <strong>إجراءات التنفيذ</strong>
      <p id="desc2"></p>
    </div>
  </div>
</div>

<div class="page">
  <h3 style="text-align:center">شواهد الصور</h3>
  <div class="images" id="imagesContainer"></div>
</div>

</div>

<script>
const imagesInput = document.getElementById('imagesInput');
const preview = document.getElementById('preview');
const imagesContainer = document.getElementById('imagesContainer');

imagesInput.addEventListener('change', e => {
  preview.innerHTML = '';
  imagesContainer.innerHTML = '';

  [...e.target.files].forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img1 = document.createElement('img');
      img1.src = ev.target.result;
      preview.appendChild(img1);

      const img2 = document.createElement('img');
      img2.src = ev.target.result;
      imagesContainer.appendChild(img2);
    };
    reader.readAsDataURL(file);
  });
});

function printReport() {
  window.print();
}
</script>

</body>
</html>