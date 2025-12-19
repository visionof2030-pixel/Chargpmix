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
  font-weight: 400;
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
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
}

.tool label {
  font-weight: 700;
  margin-top: 15px;
  display: block;
}

.tool input,
.tool textarea,
.tool select {
  width: 100%;
  padding: 14px;
  margin-top: 6px;
  border-radius: 12px;
  border: 2px solid #cfd8dc;
  font-family: inherit;
}

button {
  margin-top: 25px;
  padding: 16px;
  width: 100%;
  background: #0a3b40;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
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

  .header-full {
    background: #0a3b40;
    color: white;
    padding: 15px;
    border-radius: 12px;
    text-align: center;
    margin-bottom: 15px;
  }

  .header-full img {
    width: 80px;
    margin-bottom: 8px;
  }

  .school-name {
    background: #0a3b40;
    color: white;
    width: fit-content;
    margin: 10px auto 15px;
    padding: 8px 25px;
    border-radius: 10px;
    font-weight: 700;
  }

  /* ===== شبكة المحتوى ===== */
  .grid-desc {
    display: grid;
    grid-template-columns: 1fr 70px 1fr;
    gap: 12px;

    /* توحيد الارتفاع + تكبير 20% */
    min-height: 240px;
    max-height: 240px;
    align-items: stretch;
  }

  .desc-box {
    border: 2px solid #cfd8dc;
    border-radius: 14px;
    padding: 15px;
    background: #f9fbfb;
    font-size: 13px;
    line-height: 1.5;

    /* تكبير 20% */
    min-height: 240px;
    max-height: 240px;
    overflow: hidden;

    display: flex;
    flex-direction: column;
  }

  .desc-box strong {
    margin-bottom: 8px;
    color: #0a3b40;
    font-size: 14px;
    border-bottom: 1px dashed #cfd8dc;
    padding-bottom: 6px;
    flex-shrink: 0;
  }

  .desc-box p {
    margin: 0;
    white-space: pre-line;
    overflow: hidden;
    flex-grow: 1;
  }

  /* ===== المربع الأوسط ===== */
  .vertical {
    background: #eef3f1;
    border-radius: 14px;
    display: grid;
    grid-template-columns: 1fr 1px 1fr;
    padding: 12px 6px;
    align-items: center;

    height: 100%;
    align-self: stretch;
  }

  .vertical .right {
    writing-mode: vertical-rl;
    font-size: 12px;
    color: #1b5e52;
    text-align: center;
    font-weight: 700;
  }

  .vertical .left {
    writing-mode: vertical-lr;
    transform: rotate(180deg);
    font-size: 12px;
    color: #4f6f68;
    text-align: center;
    font-weight: 700;
  }

  .vertical .divider {
    width: 1px;
    height: 85%;
    background: #8fbfb3;
    margin: auto;
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

  <button onclick="window.print()">تصدير PDF</button>
</div>

<div class="report">

<div class="page">
  <div class="header-full">
    <img src="https://i.ibb.co/2037zjqy/IMG-2102.jpg">
    <div>وزارة التعليم</div>
  </div>

  <div class="school-name" id="school"></div>

  <div class="grid-desc">
    <div class="desc-box">
      <strong>وصف مختصر</strong>
      <p id="desc1"></p>
    </div>

    <div class="vertical">
      <div class="right">وصف مختصر</div>
      <div class="divider"></div>
      <div class="left">إجراءات التنفيذ</div>
    </div>

    <div class="desc-box">
      <strong>إجراءات التنفيذ</strong>
      <p id="desc2"></p>
    </div>
  </div>
</div>

</div>

</body>
</html>