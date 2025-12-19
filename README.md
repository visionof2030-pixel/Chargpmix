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
.tool {
  max-width: 900px;
  margin: 30px auto;
  padding: 30px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(10, 59, 64, 0.08);
  border: 1px solid #e0e6e5;
}

.tool-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #0a3b40;
}

.tool-header h1 {
  color: #0a3b40;
  margin: 0;
  font-size: 26px;
  font-weight: 700;
}

.tool-header p {
  color: #4f6f68;
  margin-top: 8px;
  font-size: 16px;
}

/* ===== حقول الإدخال ===== */
.input-group {
  margin-bottom: 25px;
  position: relative;
}

.tool label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
  color: #1b5e52;
  font-size: 15px;
}

.tool input,
.tool textarea,
.tool select {
  width: 100%;
  padding: 14px;
  border: 2px solid #cfd8dc;
  border-radius: 12px;
  font-family: 'KufamLocal', sans-serif;
  font-size: 15px;
  transition: all 0.3s ease;
  box-sizing: border-box;
  background: #f9fbfb;
}

.tool input:focus,
.tool textarea:focus,
.tool select:focus {
  outline: none;
  border-color: #0a3b40;
  background: white;
  box-shadow: 0 0 0 3px rgba(10, 59, 64, 0.1);
}

.tool textarea {
  min-height: 100px;
  resize: vertical;
  line-height: 1.6;
}

.tool select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230a3b40' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: left 15px center;
  padding-right: 15px;
}

/* ===== نص افتراضي ===== */
.default-text-note {
  font-size: 13px;
  color: #4f6f68;
  margin-top: 5px;
  font-style: italic;
  padding-right: 5px;
}

.clear-default-btn {
  position: absolute;
  left: 10px;
  top: 38px;
  background: #f0f4f3;
  border: 1px solid #cfd8dc;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  color: #4f6f68;
  transition: all 0.3s ease;
}

.clear-default-btn:hover {
  background: #e8eff0;
  color: #0a3b40;
  border-color: #0a3b40;
}

/* ===== معاينة الصور ===== */
.preview-container {
  margin-top: 10px;
}

.preview-container h4 {
  margin: 15px 0 10px;
  color: #1b5e52;
  font-size: 14px;
}

.preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
  margin-top: 10px;
}

.preview img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 10px;
  border: 2px solid #e0e6e5;
  transition: transform 0.3s ease;
}

.preview img:hover {
  transform: scale(1.03);
  border-color: #0a3b40;
}

/* ===== الأزرار ===== */
.button-container {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

button {
  flex: 1;
  padding: 16px;
  font-size: 17px;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'KufamLocal', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

#printBtn {
  background: linear-gradient(135deg, #0a3b40 0%, #1b5e52 100%);
  color: white;
}

#printBtn:hover {
  background: linear-gradient(135deg, #083136 0%, #164d44 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(10, 59, 64, 0.2);
}

#resetBtn {
  background: #f0f4f3;
  color: #4f6f68;
  border: 2px solid #cfd8dc;
}

#resetBtn:hover {
  background: #e8eff0;
  border-color: #8fbfb3;
}

.load-defaults-btn {
  background: #1b5e52;
  color: white;
  margin-top: 10px;
  padding: 10px 15px;
  font-size: 14px;
  width: auto;
  flex: none;
}

.load-defaults-btn:hover {
  background: #164d44;
}

/* ===== قالب التقرير ===== */
.report { display: none; }

/* =================== الطباعة =================== */
@page {
  size: A4;
  margin: 14mm;
}

@media print {
  body {
    background: white;
    padding: 0;
  }
  
  .tool { display: none; }
  .report { display: block; }

  .page {
    page-break-after: always;
    padding-bottom: 20mm;
  }
  
  .page:last-child { page-break-after: auto; }

  /* ===== الهيدر ===== */
  .header-full {
    background: linear-gradient(135deg, #0a3b40 0%, #1b5e52 100%);
    color: white;
    border-radius: 18px;
    padding: 22px;
    text-align: center;
    margin-bottom: 20px;
  }

  .header-full img {
    width: 110px;
    margin-bottom: 12px;
  }

  .header-full h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .header-full h2 {
    margin: 5px 0 0;
    font-size: 18px;
    font-weight: 400;
    opacity: 0.9;
  }

  .header-full .region {
    margin-top: 5px;
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    background: rgba(255,255,255,0.1);
    padding: 5px 15px;
    border-radius: 8px;
    display: inline-block;
  }

  .school-name {
    background: #0a3b40;
    color: white;
    width: fit-content;
    margin: 15px auto 20px;
    padding: 10px 35px;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 700;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  /* ===== معلومات التقرير في جميع الصفحات ===== */
  .report-info-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
    margin-bottom: 20px;
    background: #f9fbfb;
    padding: 15px;
    border-radius: 14px;
    border: 2px solid #cfd8dc;
    font-size: 14px;
  }

  .report-info-item {
    text-align: center;
  }

  .report-info-label {
    display: block;
    background: #0a3b40;
    color: white;
    border-radius: 10px;
    padding: 6px;
    font-weight: 700;
    margin-bottom: 8px;
    font-size: 13px;
  }

  .report-info-value {
    padding: 4px;
    min-height: 20px;
  }

  /* ===== محتوى ===== */
  .grid-desc {
    display: grid;
    grid-template-columns: 1fr 90px 1fr;
    gap: 15px;
    margin-top: 20px;
  }

  .desc-box {
    border: 2px solid #cfd8dc;
    border-radius: 16px;
    padding: 18px;
    background: #f9fbfb;
    font-size: 14px;
    line-height: 1.6;
  }

  .desc-box strong {
    display: block;
    color: #0a3b40;
    margin-bottom: 10px;
    font-size: 16px;
    border-bottom: 1px dashed #cfd8dc;
    padding-bottom: 8px;
  }

  .desc-box p {
    margin: 8px 0;
    white-space: pre-line;
  }

  /* ===== المربع النصفي المعدل ===== */
  .vertical {
    background: #eef3f1;
    border-radius: 16px;
    display: grid;
    grid-template-columns: 1fr 1px 1fr;
    align-items: center;
    padding: 15px 8px;
    font-weight: 600;
    height: 100%;
  }

  .vertical .right {
    writing-mode: vertical-rl;
    font-size: 13px;
    color: #1b5e52;
    text-align: center;
    font-weight: 700;
  }

  .vertical .left {
    writing-mode: vertical-lr;
    transform: rotate(180deg);
    font-size: 13px;
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

  /* ===== الصور ===== */
  .images-page {
    margin-top: 20px;
  }
  
  .images-page h3 {
    text-align: center;
    color: #0a3b40;
    font-size: 20px;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #cfd8dc;
  }

  .images {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-top: 15px;
  }

  .images img {
    width: 100%;
    height: 180px;
    object-fit: cover;
    border-radius: 12px;
    border: 2px solid #b0bec5;
  }
  
  /* ===== التوقيعات في الصفحة الثالثة ===== */
  .signatures {
    margin-top: 40px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    padding-top: 30px;
    border-top: 2px solid #cfd8dc;
  }

  .signature-box {
    text-align: center;
  }

  .signature-name {
    font-weight: 700;
    color: #0a3b40;
    margin-bottom: 20px;
    font-size: 16px;
  }

  .signature-line {
    border-bottom: 2px solid #333;
    height: 30px;
    margin-bottom: 10px;
  }

  .signature-label {
    font-size: 14px;
    color: #4f6f68;
  }
  
  /* ===== فوتر الصفحة ===== */
  .page-footer {
    position: absolute;
    bottom: 10mm;
    left: 14mm;
    right: 14mm;
    text-align: center;
    color: #666;
    font-size: 12px;
    border-top: 1px solid #ddd;
    padding-top: 10px;
  }
}
</style>
</head>

<body>

<!-- ========= الأداة ========= -->
<div class="tool">
  <div class="tool-header">
    <h1>🖋️ أداة إعداد التقارير المدرسية</h1>
    <p>اختر نوع التقرير لتحميل النصوص الافتراضية، ثم عدل كما تشاء</p>
  </div>

  <div class="input-group">
    <label>🏫 اسم المدرسة</label>
    <input type="text" id="schoolInput" placeholder="أدخل اسم المدرسة">
  </div>

  <div class="input-group">
    <label>🏙️ المنطقة</label>
    <input type="text" id="regionInput" placeholder="أدخل اسم المنطقة التعليمية">
  </div>

  <div class="input-group">
    <label>📄 عنوان التقرير</label>
    <select id="reportType">
      <option value="">اختر نوع التقرير</option>
      <option value="تقرير تنفيذ استراتيجية">تقرير تنفيذ استراتيجية</option>
      <option value="تقرير تنفيذ أنشطة داخل الفصل">تقرير تنفيذ أنشطة داخل الفصل</option>
      <option value="تقرير نشاط إثرائي">تقرير نشاط إثرائي</option>
      <option value="تقرير خطة علاجية">تقرير خطة علاجية</option>
      <option value="تقرير تكريم المتميزين">تقرير تكريم المتميزين</option>
    </select>
    <div class="default-text-note">سيتم تحميل نصوص افتراضية عند الاختيار</div>
  </div>

  <button class="load-defaults-btn" onclick="loadDefaultTexts()">📥 تحميل النصوص الافتراضية للتقريـر المختار</button>

  <div class="input-group">
    <label>📅 تاريخ التنفيذ (ميلادي)</label>
    <input type="text" id="dateInput" placeholder="يوم / شهر / سنة">
  </div>

  <div class="input-group">
    <label>📅 التاريخ الهجري</label>
    <input type="text" id="hijriDateInput" placeholder="يوم / شهر / سنة هجرية">
  </div>

  <div class="input-group">
    <label>👥 المستهدفون</label>
    <input type="text" id="targetInput" placeholder="الفئة المستهدفة">
  </div>

  <div class="input-group">
    <label>🔢 عدد المستفيدين</label>
    <input type="text" id="countInput" placeholder="عدد المشاركين">
  </div>

  <div class="input-group">
    <label>📝 الوصف المختصر (5 أسطر بالضبط)</label>
    <button class="clear-default-btn" onclick="clearField('desc1Input')">مسح</button>
    <textarea id="desc1Input" placeholder="وصف مختصر للنشاط أو البرنامج" rows="6"></textarea>
    <div class="default-text-note">5 أسطر بالضبط (بدون مسافات بين الأسطر)</div>
  </div>

  <div class="input-group">
    <label>⚙️ إجراءات التنفيذ (5 أسطر بالضبط)</label>
    <button class="clear-default-btn" onclick="clearField('desc2Input')">مسح</button>
    <textarea id="desc2Input" placeholder="الخطوات والإجراءات التنفيذية" rows="6"></textarea>
    <div class="default-text-note">5 أسطر بالضبط (بدون مسافات بين الأسطر)</div>
  </div>

  <div class="input-group">
    <label>📊 النتائج</label>
    <button class="clear-default-btn" onclick="clearField('desc3Input')">مسح</button>
    <textarea id="desc3Input" placeholder="النتائج المتحققة من التنفيذ"></textarea>
    <div class="default-text-note">يمكنك حذف هذا النص والكتابة بما يناسبك</div>
  </div>

  <div class="input-group">
    <label>💡 التوصيات</label>
    <button class="clear-default-btn" onclick="clearField('desc4Input')">مسح</button>
    <textarea id="desc4Input" placeholder="التوصيات والمقترحات"></textarea>
    <div class="default-text-note">يمكنك حذف هذا النص والكتابة بما يناسبك</div>
  </div>

  <div class="input-group">
    <label>🖼️ إرفاق الصور (اختياري)</label>
    <input type="file" id="imageInput" multiple accept="image/*">
    <div class="preview-container">
      <h4>معاينة الصور المرفوعة:</h4>
      <div class="preview" id="preview"></div>
    </div>
  </div>

  <div class="button-container">
    <button id="resetBtn" onclick="resetForm()">🔄 مسح النموذج</button>
    <button id="printBtn" onclick="generateReport()">📥 تصدير PDF</button>
  </div>
</div>

<!-- ========= التقرير ========= -->
<div class="report">

<!-- الصفحة الأولى -->
<div class="page">
  <div class="header-full">
    <img src="https://i.ibb.co/2037zjqy/IMG-2102.jpg" alt="شعار الوزارة">
    <h1>وزارة التعليم</h1>
    <h2>الإدارة العامة للتعليم</h2>
    <div class="region" id="region">إدارة التعليم بمنطقة ________</div>
  </div>

  <div class="school-name" id="school"></div>

  <!-- معلومات التقرير - الصفحة الأولى -->
  <div class="report-info-grid" id="reportInfo1">
    <div class="report-info-item">
      <span class="report-info-label">عنوان التقرير</span>
      <div class="report-info-value" id="title1"></div>
    </div>
    <div class="report-info-item">
      <span class="report-info-label">تاريخ التنفيذ</span>
      <div class="report-info-value" id="date1"></div>
    </div>
    <div class="report-info-item">
      <span class="report-info-label">التاريخ الهجري</span>
      <div class="report-info-value" id="hijriDate1"></div>
    </div>
    <div class="report-info-item">
      <span class="report-info-label">المستهدفون</span>
      <div class="report-info-value" id="target1"></div>
    </div>
    <div class="report-info-item">
      <span class="report-info-label">عدد المستفيدين</span>
      <div class="report-info-value" id="count1"></div>
    </div>
  </div>

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
  
  <div class="page-footer">صفحة 1 من 3</div>
</div>

<!-- الصفحة الثانية -->
<div class="page">
  <div class="header-full">
    <img src="https://i.ibb.co/2037zjqy/IMG-2102.jpg" alt="شعار الوزارة">
    <h1>وزارة التعليم</h1>
    <h2>الإدارة العامة للتعليم</h2>
    <div class="region" id="region2">إدارة التعليم بمنطقة ________</div>
  </div>

  <div class="school-name" id="school2"></div>

  <!-- معلومات التقرير - الصفحة الثانية -->
  <div class="report-info-grid" id="reportInfo2">
    <div class="report-info-item">
      <span class="report-info-label">عنوان التقرير</span>
      <div class="report-info-value" id="title2"></div>
    </div>
    <div class="report-info-item">
      <span class="report-info-label">تاريخ التنفيذ</span>
      <div class="report-info-value" id="date2"></div>
    </div>
    <div class="report-info-item">
      <span class="report-info-label">التاريخ الهجري</span>
      <div class="report-info-value" id="hijriDate2"></div>
    </div>
    <div class="report-info-item">
      <span class="report-info-label">المستهدفون</span>
      <div class="report-info-value" id="target2"></div>
    </div>
    <div class="report-info-item">
      <span class="report-info-label">عدد المستفيدين</span>
      <div class="report-info-value" id="count2"></div>
    </div>
  </div>

  <div class="grid-desc">
    <div class="desc-box">
      <strong>النتائج</strong>
      <p id="desc3"></p>
    </div>

    <div class="vertical">
      <div class="right">النتائج</div>
      <div class="divider"></div>
      <div class="left">التوصيات</div>
    </div>

    <div class="desc-box">
      <strong>التوصيات</strong>
      <p id="desc4"></p>
    </div>
  </div>
  
  <div class="page-footer">صفحة 2 من 3</div>
</div>

<!-- الصفحة الثالثة -->
<div class="page images-page">
  <div class="header-full">
    <img src="https://i.ibb.co/2037zjqy/IMG-2102.jpg" alt="شعار الوزارة">
    <h1>وزارة التعليم</h1>
    <h2>الإدارة العامة للتعليم</h2>
    <div class="region" id="region3">إدارة التعليم بمنطقة ________</div>
  </div>

  <div class="school-name" id="school3"></div>

  <!-- معلومات التقرير - الصفحة الثالثة -->
  <div class="report-info-grid" id="reportInfo3">
    <div class="report-info-item">
      <span class="report-info-label">عنوان التقرير</span>
      <div class="report-info-value" id="title3"></div>
    </div>
    <div class="report-info-item">
      <span class="report-info-label">تاريخ التنفيذ</span>
      <div class="report-info-value" id="date3"></div>
    </div>
    <div class="report-info-item">
      <span class="report-info-label">التاريخ الهجري</span>
      <div class="report-info-value" id="hijriDate3"></div>
    </div>
    <div class="report-info-item">
      <span class="report-info-label">المستهدفون</span>
      <div class="report-info-value" id="target3"></div>
    </div>
    <div class="report-info-item">
      <span class="report-info-label">عدد المستفيدين</span>
      <div class="report-info-value" id="count3"></div>
    </div>
  </div>

  <h3>📸 شواهد الصور</h3>
  <div class="images" id="imagesContainer"></div>
  
  <!-- التوقيعات في الصفحة الثالثة -->
  <div class="signatures">
    <div class="signature-box">
      <div class="signature-name">اسم المعلم:</div>
      <div class="signature-line"></div>
      <div class="signature-label">التوقيع</div>
    </div>
    <div class="signature-box">
      <div class="signature-name">اسم المدير:</div>
      <div class="signature-line"></div>
      <div class="signature-label">التوقيع</div>
    </div>
  </div>
  
  <div class="page-footer">صفحة 3 من 3</div>
</div>

</div>

<script>
// عناصر DOM
const schoolInput = document.getElementById('schoolInput');
const regionInput = document.getElementById('regionInput');
const reportType = document.getElementById('reportType');
const dateInput = document.getElementById('dateInput');
const hijriDateInput = document.getElementById('hijriDateInput');
const targetInput = document.getElementById('targetInput');
const countInput = document.getElementById('countInput');
const desc1Input = document.getElementById('desc1Input');
const desc2Input = document.getElementById('desc2Input');
const desc3Input = document.getElementById('desc3Input');
const desc4Input = document.getElementById('desc4Input');
const imageInput = document.getElementById('imageInput');

// عناصر التقرير
const schoolElement = document.getElementById('school');
const schoolElement2 = document.getElementById('school2');
const schoolElement3 = document.getElementById('school3');
const regionElement = document.getElementById('region');
const regionElement2 = document.getElementById('region2');
const regionElement3 = document.getElementById('region3');
const titleElement = document.getElementById('title1');
const titleElement2 = document.getElementById('title2');
const titleElement3 = document.getElementById('title3');
const dateElement = document.getElementById('date1');
const dateElement2 = document.getElementById('date2');
const dateElement3 = document.getElementById('date3');
const hijriDateElement = document.getElementById('hijriDate1');
const hijriDateElement2 = document.getElementById('hijriDate2');
const hijriDateElement3 = document.getElementById('hijriDate3');
const targetElement = document.getElementById('target1');
const targetElement2 = document.getElementById('target2');
const targetElement3 = document.getElementById('target3');
const countElement = document.getElementById('count1');
const countElement2 = document.getElementById('count2');
const countElement3 = document.getElementById('count3');
const desc1Element = document.getElementById('desc1');
const desc2Element = document.getElementById('desc2');
const desc3Element = document.getElementById('desc3');
const desc4Element = document.getElementById('desc4');

// النصوص الافتراضية لكل نوع تقرير (5 أسطر فقط)
const defaultTexts = {
  "تقرير تنفيذ استراتيجية": {
    desc1: "تنفيذ استراتيجية تدريسية متطورة لتحسين نواتج التعلم.\nاستهدفت رفع مستوى المهارات الأساسية.\nاعتمدت على أساليب التعلم النشط.\nركزت على التفاعل والمشاركة الصفية.\nتم تطبيقها وفق خطة زمنية محددة.",
    desc2: "عقد ورشة عمل للمعلمين للتعريف بالاستراتيجية.\nتصميم أدوات تقييم قبلي وبعدي.\nتطبيق الاستراتيجية داخل الفصول.\nمتابعة أسبوعية من فريق التطوير.\nتوثيق الممارسات الناجحة.",
    desc3: "1. تحسن ملحوظ في دافعية الطلاب نحو التعلم\n2. ارتفاع في نسب التفاعل الصفي بنسبة 40%\n3. تحسن في نتائج الاختبارات التكوينية\n4. رضا المعلمين عن الأساليب الجديدة بنسبة 85%\n5. توثيق 15 ممارسة ناجحة قابلة للتعميم",
    desc4: "1. تعميم الاستراتيجية على جميع الصفوف المماثلة\n2. تدريب معلمين جدد على الاستراتيجية\n3. توفير موارد إضافية لدعم التنفيذ\n4. استمرار المتابعة والتقييم الدوري\n5. عقد لقاءات تبادل خبرات بين المعلمين"
  },
  "تقرير تنفيذ أنشطة داخل الفصل": {
    desc1: "سلسلة أنشطة صفية تفاعلية لتعزيز المهارات.\nركزت على التفكير الناقد والتعلم التعاوني.\nدمجت التقنية والألعاب التعليمية.\nصممت لتناسب مختلف أنماط التعلم.\nنفذت في بيئة صفية محفزة.",
    desc2: "تقسيم الطلاب إلى مجموعات تعاونية.\nتوزيع المهام والأدوار على المجموعات.\nاستخدام وسائل تعليمية تفاعلية.\nتخصيص وقت للمناقشة والعرض.\nتقديم تغذية راجعة فورية.",
    desc3: "1. تفاعل إيجابي من جميع الطلاب مع الأنشطة\n2. تنمية مهارات العمل الجماعي والتعاون\n3. تحسن في قدرة الطلاب على التعبير عن الأفكار\n4. زيادة ثقة الطلاب بأنفسهم\n5. تحقيق الأهداف التعليمية المخطط لها بنسبة 90%",
    desc4: "1. الاستمرار في تطبيق الأنشطة التفاعلية بشكل دوري\n2. تنويع أساليب التقويم المستخدمة\n3. تخصيص وقت كافٍ لكل نشاط\n4. تدريب الطلاب على مهارات الحوار والمناقشة\n5. توثيق الأنشطة الناجحة في بنك الأنشطة المدرسية"
  },
  "تقرير نشاط إثرائي": {
    desc1: "نشاط إثرائي خارج الإطار الدراسي.\nهدف إلى تنمية مواهب الطلاب وصقل مهاراتهم.\nغطى مجالات فنية وأدبية وعلمية.\nشارك فيه طلاب بمختلف اهتماماتهم.\nنظم في بيئة جاذبة ومحفزة.",
    desc2: "تحديد المجالات الإثرائية المطلوبة.\nدعوة الطلاب للمشاركة حسب اهتماماتهم.\nتوفير المواد والأدوات اللازمة.\nتنظيم ورش العمل والجلسات التدريبية.\nمتابعة تقدم المشاركين أسبوعياً.",
    desc3: "1. اكتشاف مواهب جديدة لدى 25 طالباً\n2. تنمية الثقة بالنفس لدى المشاركين\n3. إنتاج أعمال فنية وأدبية متميزة\n4. زيادة الانتماء للمدرسة والمجتمع\n5. رضا أولياء الأمور عن الأنشطة الإثرائية",
    desc4: "1. استمرار النشاط الإثرائي كبرنامج دائم\n2. تخصيص مساحة مناسبة للأنشطة الإثرائية\n3. تدريب معلمين متخصصين في المجالات المختلفة\n4. مشاركة الأعمال في معارض ومناسبات\n5. توفير جوائز تشجيعية للمتميزين"
  },
  "تقرير خطة علاجية": {
    desc1: "خطة علاجية شاملة للطلاب المتعثرين.\nهدفت لرفع المستوى التحصيلي.\nتجاوزت الصعوبات التعليمية.\nركزت على المواد الأساسية.\nصممت برامج فردية وجماعية.",
    desc2: "تشخيص الصعوبات التعليمية لكل طالب.\nوضع أهداف علاجية قابلة للقياس.\nتصميم برامج علاجية فردية وجماعية.\nتنفيذ جلسات علاجية مكثفة.\nمتابعة التقدم وتعديل الخطة.",
    desc3: "1. تحسن ملحوظ في مستوى 18 طالباً من أصل 25\n2. ارتفاع درجات الطلاب في الاختبارات\n3. تحسن في دافعية التعلم لدى الطلاب المتعثرين\n4. انخفاض نسبة الغياب بين الطلاب المستهدفين\n5. رضا أولياء الأمور عن الخطة العلاجية",
    desc4: "1. الاستمرار في المتابعة للطلاب الذين يحتاجون مزيداً من الوقت\n2. تدريب المعلمين على استراتيجيات العلاج الفعالة\n3. توفير مواد تعليمية علاجية إضافية\n4. عقد لقاءات دورية مع أولياء الأمور\n5. توثيق الحالات الناجحة للاستفادة منها مستقبلاً"
  },
  "تقرير تكريم المتميزين": {
    desc1: "حفل تكريم للطلاب المتميزين بمختلف المجالات.\nهدف لتحفيز الطلاب وتعزيز التنافس الإيجابي.\nشمل المجالات الدراسية والسلوكية.\nتضمن الرياضية والفنية والإبداعية.\nنظم بحضور أولياء الأمور.",
    desc2: "تحديد معايير التميز والتفوق.\nترشيح الطلاب المتميزين من قبل المعلمين.\nتشكيل لجنة لاختيار المكرمين.\nإعداد شهادات التقدير والهدايا.\nتنظيم حفل التكريم.",
    desc3: "1. تكريم 35 طالباً وطالبة في مختلف المجالات\n2. ارتفاع الروح المعنوية لدى الطلاب المكرمين\n3. تحفيز باقي الطلاب للسعي نحو التميز\n4. تعزيز الشراكة مع أولياء الأمور\n5. تغطية إعلامية إيجابية للفعالية",
    desc4: "1. جعل التكريم حدثاً سنوياً للمدرسة\n2. تنويع مجالات التكريم لتشمل جميع المواهب\n3. ربط التكريم بجوائز معنوية ومادية\n4. توثيق إنجازات المتميزين في سجلات المدرسة\n5. إشراك الطلاب في تنظيم فعاليات التكريم"
  }
};

// دالة تحويل التاريخ الميلادي إلى هجري (تقريبية)
function toHijri(gregorianDate) {
  if (!gregorianDate) return '';
  
  try {
    // فصل اليوم والشهر والسنة
    const parts = gregorianDate.split('/');
    if (parts.length !== 3) return '';
    
    let day = parseInt(parts[0]);
    let month = parseInt(parts[1]);
    let year = parseInt(parts[2]);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return '';
    
    // تحويل تقريبي (هذا للعرض فقط، للدقة الكاملة تحتاج مكتبة متخصصة)
    // معادلة تقريبية: السنة الهجرية = (الميلادية - 622) × 33 ÷ 32
    const hijriYear = Math.floor((year - 622) * 33 / 32);
    
    // نفس اليوم والشهر تقريباً (مع تعديل بسيط)
    let hijriMonth = month;
    let hijriDay = day;
    
    // تعديل للأشهر التي لها فرق
    if (month === 1 && day < 10) {
      hijriMonth = 10;
      hijriYear -= 1;
    }
    
    return `${hijriDay}/${hijriMonth}/${hijriYear} هـ`;
  } catch (e) {
    return '';
  }
}

// تحديث جميع نسخ التقرير في الوقت الحقيقي
function updateAllReports() {
  // اسم المدرسة في جميع الصفحات
  schoolElement.textContent = schoolInput.value;
  schoolElement2.textContent = schoolInput.value;
  schoolElement3.textContent = schoolInput.value;
  
  // المنطقة في جميع الصفحات
  const regionText = regionInput.value ? `إدارة التعليم بمنطقة ${regionInput.value}` : 'إدارة التعليم بمنطقة ________';
  regionElement.textContent = regionText;
  regionElement2.textContent = regionText;
  regionElement3.textContent = regionText;
  
  // عنوان التقرير في جميع الصفحات
  titleElement.textContent = reportType.value;
  titleElement2.textContent = reportType.value;
  titleElement3.textContent = reportType.value;
  
  // تاريخ التنفيذ في جميع الصفحات
  dateElement.textContent = dateInput.value;
  dateElement2.textContent = dateInput.value;
  dateElement3.textContent = dateInput.value;
  
  // التاريخ الهجري في جميع الصفحات
  hijriDateElement.textContent = hijriDateInput.value;
  hijriDateElement2.textContent = hijriDateInput.value;
  hijriDateElement3.textContent = hijriDateInput.value;
  
  // المستهدفون في جميع الصفحات
  targetElement.textContent = targetInput.value;
  targetElement2.textContent = targetInput.value;
  targetElement3.textContent = targetInput.value;
  
  // عدد المستفيدين في جميع الصفحات
  countElement.textContent = countInput.value;
  countElement2.textContent = countInput.value;
  countElement3.textContent = countInput.value;
  
  // المحتوى
  desc1Element.textContent = desc1Input.value;
  desc2Element.textContent = desc2Input.value;
  desc3Element.textContent = desc3Input.value;
  desc4Element.textContent = desc4Input.value;
}

// إضافة المستمعين للأحداث
schoolInput.addEventListener('input', updateAllReports);
regionInput.addEventListener('input', updateAllReports);
reportType.addEventListener('change', () => {
  updateAllReports();
});
dateInput.addEventListener('input', () => {
  updateAllReports();
  // تحديث التاريخ الهجري تلقائياً
  if (dateInput.value) {
    hijriDateInput.value = toHijri(dateInput.value);
    updateAllReports();
  }
});
hijriDateInput.addEventListener('input', updateAllReports);
targetInput.addEventListener('input', updateAllReports);
countInput.addEventListener('input', updateAllReports);
desc1Input.addEventListener('input', () => {
  desc1Element.textContent = desc1Input.value;
  checkLines(desc1Input.value, 'desc1Input');
});
desc2Input.addEventListener('input', () => {
  desc2Element.textContent = desc2Input.value;
  checkLines(desc2Input.value, 'desc2Input');
});
desc3Input.addEventListener('input', () => desc3Element.textContent = desc3Input.value);
desc4Input.addEventListener('input', () => desc4Element.textContent = desc4Input.value);

// تحقق من عدد الأسطر
function checkLines(text, fieldId) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const field = document.getElementById(fieldId);
  
  if (lines.length > 5) {
    field.style.borderColor = '#ff6b6b';
    field.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.1)';
  } else {
    field.style.borderColor = '';
    field.style.boxShadow = '';
  }
}

// تحميل النصوص الافتراضية
function loadDefaultTexts() {
  const selectedReport = reportType.value;
  
  if (!selectedReport) {
    alert('⚠️ الرجاء اختيار نوع التقرير أولاً');
    reportType.focus();
    return;
  }
  
  if (confirm(`هل تريد تحميل النصوص الافتراضية لتقرير "${selectedReport}"؟\n(يمكنك تعديلها لاحقاً كما تشاء)`)) {
    const texts = defaultTexts[selectedReport];
    
    desc1Input.value = texts.desc1;
    desc2Input.value = texts.desc2;
    desc3Input.value = texts.desc3;
    desc4Input.value = texts.desc4;
    
    // تحديث المعاينة
    desc1Element.textContent = texts.desc1;
    desc2Element.textContent = texts.desc2;
    desc3Element.textContent = texts.desc3;
    desc4Element.textContent = texts.desc4;
    
    // تحقق من عدد الأسطر
    checkLines(texts.desc1, 'desc1Input');
    checkLines(texts.desc2, 'desc2Input');
    
    alert('✅ تم تحميل النصوص الافتراضية بنجاح\nيمكنك الآن تعديلها كما تريد');
  }
}

// مسح حقل معين
function clearField(fieldId) {
  const field = document.getElementById(fieldId);
  field.value = '';
  
  // تحديث المعاينة
  if (fieldId === 'desc1Input') desc1Element.textContent = '';
  if (fieldId === 'desc2Input') desc2Element.textContent = '';
  if (fieldId === 'desc3Input') desc3Element.textContent = '';
  if (fieldId === 'desc4Input') desc4Element.textContent = '';
  
  // إعادة تعيين اللون
  field.style.borderColor = '';
  field.style.boxShadow = '';
}

// تحميل الصور
imageInput.addEventListener('change', function(e) {
  const preview = document.getElementById('preview');
  const container = document.getElementById('imagesContainer');
  
  preview.innerHTML = '';
  container.innerHTML = '';
  
  const files = Array.from(e.target.files);
  
  files.forEach((file, index) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      // صورة المعاينة
      const previewImg = document.createElement('img');
      previewImg.src = e.target.result;
      previewImg.title = `صورة ${index + 1}`;
      preview.appendChild(previewImg);
      
      // صورة التقرير
      const reportImg = document.createElement('img');
      reportImg.src = e.target.result;
      reportImg.alt = `شاهد ${index + 1}`;
      container.appendChild(reportImg);
    };
    reader.readAsDataURL(file);
  });
});

// تحقق من عدد الأسطر قبل الطباعة
function validateLinesBeforePrint() {
  const desc1Lines = desc1Input.value.split('\n').filter(line => line.trim() !== '').length;
  const desc2Lines = desc2Input.value.split('\n').filter(line => line.trim() !== '').length;
  
  if (desc1Lines > 5) {
    alert('⚠️ الوصف المختصر يحتوي على أكثر من 5 أسطر\nالرجاء تقليل عدد الأسطر إلى 5 أسطر بالضبط');
    desc1Input.focus();
    return false;
  }
  
  if (desc2Lines > 5) {
    alert('⚠️ إجراءات التنفيذ تحتوي على أكثر من 5 أسطر\nالرجاء تقليل عدد الأسطر إلى 5 أسطر بالضبط');
    desc2Input.focus();
    return false;
  }
  
  return true;
}

// توليد التقرير
function generateReport() {
  // التحقق من الحقول المطلوبة
  if (!schoolInput.value.trim()) {
    alert('⚠️ الرجاء إدخال اسم المدرسة');
    schoolInput.focus();
    return;
  }
  
  if (!reportType.value) {
    alert('⚠️ الرجاء اختيار نوع التقرير');
    reportType.focus();
    return;
  }
  
  if (!dateInput.value.trim()) {
    alert('⚠️ الرجاء إدخال تاريخ التنفيذ');
    dateInput.focus();
    return;
  }
  
  // تحقق من عدد الأسطر
  if (!validateLinesBeforePrint()) {
    return;
  }
  
  // تحديث جميع نسخ التقرير
  updateAllReports();
  
  // تعيين قيم افتراضية إذا كانت فارغة
  if (!regionInput.value.trim()) {
    regionElement.textContent = regionElement2.textContent = regionElement3.textContent = 'إدارة التعليم بمنطقة ________';
  }
  
  if (!hijriDateInput.value.trim()) {
    hijriDateElement.textContent = hijriDateElement2.textContent = hijriDateElement3.textContent = 'غير محدد';
  }
  
  if (!targetInput.value.trim()) {
    targetElement.textContent = targetElement2.textContent = targetElement3.textContent = 'غير محدد';
  }
  
  if (!countInput.value.trim()) {
    countElement.textContent = countElement2.textContent = countElement3.textContent = 'غير محدد';
  }
  
  if (!desc1Input.value.trim()) {
    desc1Element.textContent = 'لا يوجد وصف';
  }
  
  if (!desc2Input.value.trim()) {
    desc2Element.textContent = 'لا توجد إجراءات محددة';
  }
  
  if (!desc3Input.value.trim()) {
    desc3Element.textContent = 'لا توجد نتائج مسجلة';
  }
  
  if (!desc4Input.value.trim()) {
    desc4Element.textContent = 'لا توجد توصيات';
  }
  
  // إظهار رسالة نجاح
  alert('✅ تم إنشاء التقرير بنجاح! جارٍ فتح نافذة الطباعة...');
  
  // تأخير بسيط لضمان تحديث العناصر
  setTimeout(() => {
    window.print();
  }, 500);
}

// مسح النموذج
function resetForm() {
  if (confirm('هل تريد مسح جميع الحقول؟')) {
    schoolInput.value = '';
    regionInput.value = '';
    reportType.selectedIndex = 0;
    dateInput.value = '';
    hijriDateInput.value = '';
    targetInput.value = '';
    countInput.value = '';
    desc1Input.value = '';
    desc2Input.value = '';
    desc3Input.value = '';
    desc4Input.value = '';
    imageInput.value = '';
    
    // مسح المعاينة
    document.getElementById('preview').innerHTML = '';
    document.getElementById('imagesContainer').innerHTML = '';
    
    // إعادة تعيين التقرير
    updateAllReports();
    
    // إعادة تعيين القيم الخاصة
    desc1Element.textContent = '';
    desc2Element.textContent = '';
    desc3Element.textContent = '';
    desc4Element.textContent = '';
    
    alert('✅ تم مسح النموذج بنجاح');
  }
}

// تعيين تاريخ افتراضي
window.onload = function() {
  const today = new Date();
  const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  dateInput.value = formattedDate;
  
  // تحويل التاريخ إلى هجري
  hijriDateInput.value = toHijri(formattedDate);
  
  // تحديث جميع النسخ بالتاريخ
  updateAllReports();
};
</script>

</body>
</html>