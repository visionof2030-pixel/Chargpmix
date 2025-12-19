<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>أداة إعداد التقارير</title>

<!-- مكتبة Word -->
<script src="https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>

<style>
body {
  font-family: Arial, sans-serif;
  background: #f2f7f6;
  margin: 0;
  padding: 20px;
  color: #333;
}

.tool {
  max-width: 900px;
  margin: auto;
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.tool h1 {
  text-align: center;
  color: #0a3b40;
  margin-bottom: 25px;
  font-size: 28px;
}

.tool label {
  font-weight: bold;
  display: block;
  margin-top: 14px;
  color: #2c5f63;
}

.tool input,
.tool textarea,
.tool select {
  width: 100%;
  padding: 12px;
  margin-top: 6px;
  border-radius: 12px;
  border: 2px solid #cfd8dc;
  font-size: 15px;
  font-family: Arial, sans-serif;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.tool input:focus,
.tool textarea:focus,
.tool select:focus {
  border-color: #0a3b40;
  outline: none;
}

.date-row {
  display: flex;
  gap: 15px;
  margin-top: 6px;
}

.date-row div {
  flex: 1;
}

.date-row input {
  width: 100%;
}

.auto-text-btn {
  background: #e8f4f3;
  color: #0a3b40;
  border: 1px solid #0a3b40;
  border-radius: 8px;
  padding: 8px 12px;
  margin: 8px 0;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
}

.auto-text-btn:hover {
  background: #d0e8e6;
}

.buttons-row {
  display: flex;
  gap: 15px;
  margin-top: 25px;
}

.buttons-row button {
  flex: 1;
}

button {
  padding: 14px;
  background: #0a3b40;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

button:hover {
  background: #0c4a50;
  transform: translateY(-2px);
}

button:active {
  transform: translateY(0);
}

.alt {
  background: #455a64;
}

.alt:hover {
  background: #546e7a;
}

.preview-section {
  margin-top: 25px;
  padding: 20px;
  background: #f8fdfc;
  border-radius: 12px;
  border: 1px dashed #0a3b40;
}

.preview-section h3 {
  color: #0a3b40;
  margin-top: 0;
}

@media print {
  .tool {
    box-shadow: none;
    padding: 15px;
  }
  
  button, .auto-text-btn, .preview-section {
    display: none !important;
  }
}
</style>
</head>

<body>

<div class="tool">
  <h1>أداة إعداد التقارير التعليمية</h1>
  
  <label>المنطقة التعليمية</label>
  <input id="region" placeholder="أدخل المنطقة التعليمية">
  
  <label>عنوان التقرير</label>
  <select id="title">
    <option value="">-- اختر نوع التقرير --</option>
    <option value="تقرير أنشطة صفية">تقرير أنشطة صفية</option>
    <option value="تقرير زيارة ميدانية">تقرير زيارة ميدانية</option>
    <option value="تقرير ورشة عمل">تقرير ورشة عمل</option>
    <option value="تقرير دورة تدريبية">تقرير دورة تدريبية</option>
    <option value="تقرير فعالية مدرسية">تقرير فعالية مدرسية</option>
    <option value="تقرير أنشطة لاصفية">تقرير أنشطة لاصفية</option>
  </select>
  
  <label>تاريخ التنفيذ</label>
  <div class="date-row">
    <div>
      <label style="font-size: 14px; font-weight: normal;">التاريخ الميلادي</label>
      <input id="date" type="date">
    </div>
    <div>
      <label style="font-size: 14px; font-weight: normal;">التاريخ الهجري</label>
      <input id="hijriDate" placeholder="أدخل التاريخ الهجري">
    </div>
  </div>
  
  <label>المستهدفون</label>
  <input id="target" value="الطلاب" placeholder="الفئة المستهدفة">
  
  <label>عدد المستفيدين</label>
  <input id="count" type="number" placeholder="أدخل عدد المستفيدين">
  
  <label>وصف مختصر للنشاط</label>
  <button type="button" class="auto-text-btn" onclick="fillDesc1()">إضافة نص تلقائي</button>
  <textarea id="desc1" placeholder="وصف مختصر للنشاط وأهدافه"></textarea>
  
  <label>إجراءات التنفيذ</label>
  <button type="button" class="auto-text-btn" onclick="fillDesc2()">إضافة نص تلقائي</button>
  <textarea id="desc2" placeholder="الخطوات والإجراءات المتبعة في تنفيذ النشاط"></textarea>
  
  <label>النتائج</label>
  <button type="button" class="auto-text-btn" onclick="fillDesc3()">إضافة نص تلقائي</button>
  <textarea id="desc3" placeholder="النتائج والتأثيرات المتحققة من النشاط"></textarea>
  
  <label>التوصيات</label>
  <button type="button" class="auto-text-btn" onclick="fillDesc4()">إضافة نص تلقائي</button>
  <textarea id="desc4" placeholder="التوصيات والمقترحات للتطوير"></textarea>
  
  <label>إرفاق الصور (اختياري)</label>
  <input type="file" id="imagesInput" multiple accept="image/*">
  
  <div class="preview-section">
    <h3>معاينة التقرير</h3>
    <p><strong>المنطقة التعليمية:</strong> <span id="previewRegion">-</span></p>
    <p><strong>عنوان التقرير:</strong> <span id="previewTitle">-</span></p>
    <p><strong>تاريخ التنفيذ:</strong> <span id="previewDate">-</span> (هجري: <span id="previewHijriDate">-</span>)</p>
    <p><strong>المستهدفون:</strong> <span id="previewTarget">-</span></p>
    <p><strong>عدد المستفيدين:</strong> <span id="previewCount">-</span></p>
  </div>
  
  <div class="buttons-row">
    <button onclick="window.print()">📄 تصدير PDF</button>
    <button class="alt" onclick="exportWord()">📝 تصدير Word</button>
  </div>
</div>

<script>
// نص تلقائي للوصف المختصر
function fillDesc1() {
  const desc1 = document.getElementById('desc1');
  desc1.value = "يهدف هذا النشاط إلى تنمية مهارات الطلاب في مجال " + 
                (document.getElementById('title').value || "النشاط") + 
                "، حيث تم تصميمه بما يتناسب مع المرحلة العمرية للمستهدفين " + 
                "ويهدف إلى تحقيق الأهداف التعليمية المرجوة من خلال أساليب تدريس تفاعلية وتشاركية.";
}

// نص تلقائي لإجراءات التنفيذ
function fillDesc2() {
  const desc2 = document.getElementById('desc2');
  desc2.value = "1. التحضير المسبق للمواد والأدوات اللازمة للنشاط.\n" +
                "2. تقسيم الطلاب إلى مجموعات عمل صغيرة.\n" +
                "3. تقديم شرح مفصل عن أهداف النشاط وخطوات التنفيذ.\n" +
                "4. توزيع المهام على الطلاب وتشجيع العمل الجماعي.\n" +
                "5. توفير الدعم والإرشاد اللازم أثناء تنفيذ النشاط.\n" +
                "6. تخصيص وقت لعرض نتائج عمل كل مجموعة.\n" +
                "7. فتح باب النقاش والتحليل للنتائج المتحققة.";
}

// نص تلقائي للنتائج
function fillDesc3() {
  const desc3 = document.getElementById('desc3');
  desc3.value = "1. تفاعل إيجابي من قبل الطلاب مع محتوى النشاط.\n" +
                "2. تحسن ملحوظ في فهم المفاهيم والمهارات المستهدفة.\n" +
                "3. تنمية روح العمل الجماعي والتعاون بين الطلاب.\n" +
                "4. تطوير مهارات التفكير النقدي وحل المشكلات.\n" +
                "5. رفع مستوى الثقة بالنفس والقدرة على التعبير لدى المشاركين.\n" +
                "6. تحقيق الأهداف التعليمية المخطط لها بنسبة عالية.";
}

// نص تلقائي للتوصيات
function fillDesc4() {
  const desc4 = document.getElementById('desc4');
  desc4.value = "1. تكرار مثل هذه الأنشطة لتعزيز التعلم النشط.\n" +
                "2. توفير المزيد من الموارد والأدوات التعليمية الداعمة.\n" +
                "3. إشراك أولياء الأمور في بعض الأنشطة لتعزيز الشراكة المجتمعية.\n" +
                "4. تدريب المعلمين على أساليب جديدة في تنفيذ الأنشطة الصفية.\n" +
                "5. تخصيص جوائز وتقدير للمتميزين في الأنشطة لتشجيع المشاركة.\n" +
                "6. تقييم فعالية الأنشطة بشكل دوري والتطوير المستمر.";
}

// تحديث معاينة التقرير عند تغيير المدخلات
document.querySelectorAll('input, select, textarea').forEach(element => {
  element.addEventListener('input', updatePreview);
});

function updatePreview() {
  document.getElementById('previewRegion').textContent = document.getElementById('region').value || '-';
  document.getElementById('previewTitle').textContent = document.getElementById('title').value || '-';
  
  const date = document.getElementById('date').value;
  const hijriDate = document.getElementById('hijriDate').value;
  document.getElementById('previewDate').textContent = date ? new Date(date).toLocaleDateString('ar-SA') : '-';
  document.getElementById('previewHijriDate').textContent = hijriDate || '-';
  
  document.getElementById('previewTarget').textContent = document.getElementById('target').value || '-';
  document.getElementById('previewCount').textContent = document.getElementById('count').value || '-';
}

// ضبط التاريخ الميلادي الحالي كقيمة افتراضية
window.onload = function() {
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  document.getElementById('date').value = formattedDate;
  
  // يمكن إضافة تحويل التاريخ الميلادي إلى هجري هنا باستخدام مكتبة مناسبة
  // للتبسيط، سنتركه للمستخدم لإدخاله يدوياً
  updatePreview();
};

// تصدير إلى Word
async function exportWord() {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = window.docx;

  // جمع البيانات
  const region = document.getElementById('region').value || 'غير محدد';
  const title = document.getElementById('title').value || 'تقرير أنشطة صفية';
  const date = document.getElementById('date').value ? 
               new Date(document.getElementById('date').value).toLocaleDateString('ar-SA') : 'غير محدد';
  const hijriDate = document.getElementById('hijriDate').value || 'غير محدد';
  const target = document.getElementById('target').value || 'الطلاب';
  const count = document.getElementById('count').value || 'غير محدد';
  const desc1 = document.getElementById('desc1').value || 'لا يوجد وصف';
  const desc2 = document.getElementById('desc2').value || 'لا توجد إجراءات';
  const desc3 = document.getElementById('desc3').value || 'لا توجد نتائج';
  const desc4 = document.getElementById('desc4').value || 'لا توجد توصيات';

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // العنوان الرئيسي
        new Paragraph({
          children: [new TextRun({ text: "وزارة التعليم", bold: true, size: 32 })],
          alignment: "CENTER"
        }),
        
        new Paragraph({
          children: [new TextRun({ text: "الإدارة العامة للتعليم", bold: true, size: 28 })],
          alignment: "CENTER"
        }),
        
        new Paragraph(""),
        
        // عنوان التقرير
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: 36, color: "0a3b40" })],
          alignment: "CENTER",
          heading: HeadingLevel.TITLE
        }),
        
        new Paragraph(""),
        new Paragraph(""),
        
        // معلومات التقرير الأساسية
        new Paragraph({ children: [new TextRun({ text: "معلومات التقرير", bold: true, size: 28 })] }),
        new Paragraph(""),
        
        new Paragraph("المنطقة التعليمية: " + region),
        new Paragraph("تاريخ التنفيذ (ميلادي): " + date),
        new Paragraph("تاريخ التنفيذ (هجري): " + hijriDate),
        new Paragraph("المستهدفون: " + target),
        new Paragraph("عدد المستفيدين: " + count),
        
        new Paragraph(""),
        new Paragraph({ children: [new TextRun({ text: "وصف مختصر للنشاط", bold: true, size: 28 })] }),
        new Paragraph(""),
        new Paragraph(desc1),
        
        new Paragraph(""),
        new Paragraph({ children: [new TextRun({ text: "إجراءات التنفيذ", bold: true, size: 28 })] }),
        new Paragraph(""),
        new Paragraph(desc2),
        
        new Paragraph({ text: " ", pageBreakBefore: true }),
        
        new Paragraph({ children: [new TextRun({ text: "النتائج", bold: true, size: 28 })] }),
        new Paragraph(""),
        new Paragraph(desc3),
        
        new Paragraph(""),
        new Paragraph({ children: [new TextRun({ text: "التوصيات", bold: true, size: 28 })] }),
        new Paragraph(""),
        new Paragraph(desc4),
        
        new Paragraph({ text: " ", pageBreakBefore: true }),
        
        // التوقيعات
        new Paragraph({ children: [new TextRun({ text: "التوقيعات", bold: true, size: 32 })] }),
        new Paragraph(""),
        new Paragraph(""),
        new Paragraph("اسم المعلم/المشرف: ____________________"),
        new Paragraph("التوقيع: ____________________"),
        new Paragraph(""),
        new Paragraph(""),
        new Paragraph("مدير المدرسة/المشرف العام: ____________________"),
        new Paragraph("التوقيع: ____________________"),
        new Paragraph(""),
        new Paragraph("ختم المدرسة"),
        new Paragraph(""),
        new Paragraph(""),
        new Paragraph({ 
          text: "تاريخ الإصدار: " + new Date().toLocaleDateString('ar-SA'), 
          alignment: "LEFT" 
        }),
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "التقرير_" + new Date().getTime() + ".docx");
}
</script>

</body>
</html>