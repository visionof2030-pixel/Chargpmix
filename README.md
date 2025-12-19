<!-- نفس الملف الذي أرسلته أنت، مع تعديل واحد فقط في CSS -->
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
  font-weight: 400;
}
@font-face {
  font-family: 'KufamLocal';
  src: url('static/Kufam-Bold.ttf') format('truetype');
  font-weight: 700;
}

/* ===== عام ===== */
body {
  font-family: 'KufamLocal', sans-serif;
  background: linear-gradient(135deg, #f2f7f6 0%, #e8eff0 100%);
  margin: 0;
  padding: 20px;
  color: #333;
}

/* ===== الأداة ===== */
/* (باقي كودك كما هو بدون أي تغيير) */

/* =================== الطباعة =================== */
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
    padding-bottom: 20mm;
  }
  .page:last-child { page-break-after: auto; }

  /* ===== شبكة المحتوى ===== */
  .grid-desc {
    display: grid;
    grid-template-columns: 1fr 70px 1fr;
    gap: 12px;
    margin-top: 15px;

    /* ✅ توحيد الارتفاع + تكبير 20% */
    min-height: 240px;
    max-height: 240px;
    align-items: stretch;

    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* ===== مربعات النص ===== */
  .desc-box {
    border: 2px solid #cfd8dc;
    border-radius: 14px;
    padding: 15px;
    background: #f9fbfb;
    font-size: 13px;
    line-height: 1.5;

    /* ✅ تكبير 20% */
    min-height: 240px;
    max-height: 240px;
    overflow: hidden;

    display: flex;
    flex-direction: column;

    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* ===== المربع الأوسط ===== */
  .vertical {
    background: #eef3f1;
    border-radius: 14px;
    display: grid;
    grid-template-columns: 1fr 1px 1fr;
    align-items: center;
    padding: 12px 6px;

    /* ✅ محاذاة كاملة مع المربعين */
    height: 100%;
    align-self: stretch;

    page-break-inside: avoid;
    break-inside: avoid;
  }

  .vertical .divider {
    width: 1px;
    height: 85%;
    background: #8fbfb3;
    margin: auto;
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

}
/* ===== باقي ملفك كما هو بدون أي تغيير ===== */
</style>
</head>

<body>
<!-- بقية HTML + JS كما أرسلتها أنت تمامًا -->
</body>
</html>