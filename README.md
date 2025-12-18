<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>نظام إعداد التقارير - شواهد وظيفية</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>
body {
    font-family: Arial, "Traditional Arabic";
    background: #f5f7fa;
    margin: 0;
    padding: 0;
}
.container {
    max-width: 900px;
    margin: 40px auto;
    background: #fff;
    padding: 30px;
    border-radius: 10px;
}
h1 {
    text-align: center;
    color: #2c5aa0;
}
label {
    font-weight: bold;
    display: block;
    margin-top: 20px;
}
input, textarea, select {
    width: 100%;
    padding: 10px;
    margin-top: 5px;
}
textarea {
    min-height: 120px;
}
button {
    margin-top: 30px;
    padding: 15px;
    width: 100%;
    background: #2c5aa0;
    color: #fff;
    border: none;
    font-size: 18px;
    cursor: pointer;
}
button:hover {
    background: #1e3d6f;
}
</style>
</head>

<body>
<div class="container">
<h1>نظام إعداد التقارير</h1>

<label>اسم المنطقة</label>
<input id="region" value="الرياض">

<label>اسم المدرسة</label>
<input id="school" value="مدرسة النموذجية الثانوية">

<label>مدير المدرسة</label>
<input id="principal" value="أ. علي محمد أحمد">

<label>معد التقرير</label>
<input id="reporter" value="أ. أحمد عبدالله السعيد">

<label>عنوان التقرير</label>
<input id="title" value="تقرير تنفيذ استراتيجية">

<label>تاريخ البرنامج (هجري)</label>
<input id="date" value="1447-06-12">

<label>مكان التنفيذ</label>
<input id="location" value="قاعة مصادر التعلم">

<label>المستهدفون</label>
<input id="target" value="طلاب الصف الثالث ثانوي">

<label>عدد المستفيدين</label>
<input id="beneficiaries" value="25">

<label>تابع للمناهج</label>
<select id="curriculum">
<option>نعم</option>
<option>لا</option>
</select>

<label>وصف مختصر لما تم تنفيذه</label>
<textarea id="description">تم تنفيذ الاستراتيجية وفق الخطة المعتمدة...</textarea>

<label>إجراءات التنفيذ (افصل بفاصلة)</label>
<textarea id="procedures">إعداد الخطة, توزيع الطلاب, تنفيذ النشاط</textarea>

<label>النتائج (افصل بفاصلة)</label>
<textarea id="results">تفاعل إيجابي, تنمية التعاون</textarea>

<label>التوصيات</label>
<textarea id="recommendations">الاستمرار في تطبيق الاستراتيجية</textarea>

<label>الصور (حد أقصى صورتان)</label>
<input type="file" id="images" accept="image/*" multiple>

<button onclick="exportWord()">إنشاء ملف Word</button>
</div>

<script>
function exportWord() {

const files = document.getElementById("images").files;
let imagesHTML = "";

Array.from(files).slice(0,2).forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = function(e) {
        imagesHTML += `
        <p style="text-align:center;">
            <img src="${e.target.result}" width="400"><br>
            صورة (${i+1})
        </p>`;
        if (i === Math.min(files.length,2)-1) buildDoc(imagesHTML);
    };
    reader.readAsDataURL(file);
});

if (files.length === 0) buildDoc("");

function buildDoc(images) {

const html = `
<html dir="rtl">
<head>
<meta charset="UTF-8">
<style>
body{font-family:Arial,Traditional Arabic;font-size:14pt;}
table{width:100%;border-collapse:collapse;}
td{border:1px solid #000;padding:8px;}
h2{text-align:center;}
.section{font-weight:bold;font-size:16pt;margin-top:20px;}
</style>
</head>
<body>

<h2>الإدارة العامة للتعليم بمنطقة ${region.value}</h2>
<h2>${title.value}</h2>

<p><b>تاريخ البرنامج:</b> ${date.value}</p>

<div class="section">البيانات الأساسية</div>
<table>
<tr><td>المدرسة</td><td>${school.value}</td></tr>
<tr><td>مدير المدرسة</td><td>${principal.value}</td></tr>
<tr><td>معد التقرير</td><td>${reporter.value}</td></tr>
<tr><td>مكان التنفيذ</td><td>${location.value}</td></tr>
<tr><td>المستهدفون</td><td>${target.value}</td></tr>
<tr><td>عدد المستفيدين</td><td>${beneficiaries.value}</td></tr>
<tr><td>تابع للمناهج</td><td>${curriculum.value}</td></tr>
</table>

<div class="section">وصف مختصر لما تم تنفيذه</div>
<p>${description.value}</p>

<div class="section">إجراءات التنفيذ</div>
<ul>${procedures.value.split(',').map(p=>`<li>${p}</li>`).join('')}</ul>

<div class="section">النتائج</div>
<ul>${results.value.split(',').map(r=>`<li>${r}</li>`).join('')}</ul>

<div class="section">التوصيات</div>
<p>${recommendations.value}</p>

${images}

<table style="margin-top:40px">
<tr>
<td style="text-align:center">مدير المدرسة<br>${principal.value}<br>____________</td>
<td style="text-align:center">معد التقرير<br>${reporter.value}<br>____________</td>
</tr>
</table>

<p style="text-align:center;color:gray;font-size:12pt;">
تم إنشاء هذا التقرير بواسطة نظام إعداد التقارير
</p>

</body>
</html>
`;

const blob = new Blob([html], {type:"application/msword"});
const a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = "تقرير.doc";
a.click();
}
}
</script>

</body>
</html>
