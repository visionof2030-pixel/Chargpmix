<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نظام إعداد التقارير - أداء الواجبات الوظيفية</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
    <style>
        :root {
            --primary-color: #2c5aa0;
            --primary-dark: #1e3d6f;
            --primary-light: #4a7bc8;
            --secondary-color: #f0f4f8;
            --light-color: #f9f9f9;
            --dark-color: #333;
            --gray-color: #666;
            --border-color: #ddd;
            --success-color: #28a745;
            --warning-color: #ffc107;
            --danger-color: #dc3545;
            --shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
            --shadow-lg: 0 5px 25px rgba(0, 0, 0, 0.1);
            --radius: 10px;
            --transition: all 0.3s ease;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Segoe UI', 'Cairo', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
            color: var(--dark-color);
            line-height: 1.6;
            min-height: 100vh;
            padding: 0;
            direction: rtl;
        }

        .header {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
            color: white;
            padding: 25px 20px;
            text-align: center;
            position: fixed;
            top: 0;
            width: 100%;
            z-index: 1000;
            box-shadow: var(--shadow-lg);
        }

        .header h1 {
            font-size: 26px;
            margin-bottom: 8px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .header-subtitle {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 300;
        }

        .main-container {
            margin-top: 120px;
            padding: 0 20px 40px;
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
        }

        .report-form-container {
            background-color: white;
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            padding: 40px;
            margin-bottom: 30px;
            border: 1px solid rgba(255,255,255,0.2);
            position: relative;
            overflow: hidden;
        }

        .report-form-container::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 100%;
            height: 5px;
            background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-light) 100%);
        }

        .section-header {
            color: var(--primary-color);
            border-right: 5px solid var(--primary-color);
            padding-right: 20px;
            margin: 40px 0 25px;
            font-size: 24px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 12px;
            position: relative;
        }

        .section-header i {
            font-size: 22px;
            background: rgba(44, 90, 160, 0.1);
            padding: 10px;
            border-radius: 8px;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .section-subtitle {
            color: var(--gray-color);
            font-size: 16px;
            margin-bottom: 30px;
            padding-right: 25px;
            line-height: 1.7;
        }

        .form-group {
            margin-bottom: 30px;
        }

        .form-label {
            display: block;
            margin-bottom: 12px;
            font-weight: 600;
            color: var(--dark-color);
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .form-label i {
            color: var(--primary-color);
            font-size: 18px;
        }

        .form-label.required::after {
            content: " *";
            color: var(--danger-color);
            font-weight: bold;
        }

        .form-input, .form-select, .form-textarea {
            width: 100%;
            padding: 16px;
            border: 2px solid var(--border-color);
            border-radius: var(--radius);
            font-size: 16px;
            font-family: inherit;
            transition: var(--transition);
            background-color: white;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 4px rgba(44, 90, 160, 0.15);
        }

        .form-textarea {
            min-height: 140px;
            resize: vertical;
            line-height: 1.8;
        }

        .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }

        .form-example {
            font-size: 14px;
            color: var(--gray-color);
            margin-top: 8px;
            font-style: italic;
            padding-right: 5px;
        }

        .upload-section {
            margin-top: 40px;
            border-top: 2px dashed var(--border-color);
            padding-top: 40px;
        }

        .upload-area {
            border: 3px dashed var(--border-color);
            border-radius: var(--radius);
            padding: 50px 30px;
            text-align: center;
            background-color: var(--light-color);
            cursor: pointer;
            transition: var(--transition);
            margin-bottom: 25px;
            position: relative;
            overflow: hidden;
        }

        .upload-area:hover {
            border-color: var(--primary-color);
            background-color: rgba(44, 90, 160, 0.02);
            transform: translateY(-2px);
        }

        .upload-area.dragover {
            border-color: var(--primary-color);
            background-color: rgba(44, 90, 160, 0.05);
            animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(44, 90, 160, 0.2); }
            70% { box-shadow: 0 0 0 15px rgba(44, 90, 160, 0); }
            100% { box-shadow: 0 0 0 0 rgba(44, 90, 160, 0); }
        }

        .upload-icon {
            font-size: 56px;
            color: var(--primary-color);
            margin-bottom: 20px;
            opacity: 0.8;
        }

        .upload-text {
            font-size: 18px;
            color: var(--dark-color);
            margin-bottom: 12px;
            font-weight: 500;
        }

        .upload-hint {
            font-size: 15px;
            color: var(--gray-color);
            max-width: 500px;
            margin: 0 auto;
        }

        .image-preview {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }

        .preview-item {
            position: relative;
            border-radius: var(--radius);
            overflow: hidden;
            box-shadow: var(--shadow);
            border: 1px solid var(--border-color);
            transition: var(--transition);
        }

        .preview-item:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-lg);
        }

        .preview-img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            display: block;
            transition: var(--transition);
        }

        .preview-item:hover .preview-img {
            transform: scale(1.05);
        }

        .preview-remove {
            position: absolute;
            top: 15px;
            left: 15px;
            background: rgba(220, 53, 69, 0.9);
            color: white;
            border: none;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: var(--transition);
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .preview-remove:hover {
            background: var(--danger-color);
            transform: scale(1.1);
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: var(--radius);
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: var(--transition);
            text-decoration: none;
            min-height: 55px;
            box-shadow: 0 4px 12px rgba(44, 90, 160, 0.2);
            position: relative;
            overflow: hidden;
        }

        .btn::after {
            content: '';
            position: absolute;
            top: 50%;
            right: 50%;
            width: 0;
            height: 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            transform: translate(50%, -50%);
            transition: width 0.6s, height 0.6s;
        }

        .btn:hover::after {
            width: 300px;
            height: 300px;
        }

        .btn:hover {
            background-color: var(--primary-dark);
            transform: translateY(-3px);
            box-shadow: 0 6px 18px rgba(44, 90, 160, 0.3);
        }

        .btn:active {
            transform: translateY(-1px);
        }

        .btn-secondary {
            background-color: #6c757d;
        }

        .btn-secondary:hover {
            background-color: #5a6268;
        }

        .btn-success {
            background-color: var(--success-color);
        }

        .btn-success:hover {
            background-color: #218838;
        }

        .btn-outline {
            background-color: transparent;
            border: 2px solid var(--primary-color);
            color: var(--primary-color);
            box-shadow: none;
        }

        .btn-outline:hover {
            background-color: var(--primary-color);
            color: white;
        }

        .btn-block {
            width: 100%;
        }

        .action-buttons {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            padding-top: 40px;
            border-top: 2px solid var(--border-color);
            gap: 20px;
            flex-wrap: wrap;
        }

        .instruction-box {
            background: linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 100%);
            border-right: 5px solid var(--primary-color);
            padding: 25px;
            border-radius: var(--radius);
            margin-bottom: 40px;
            box-shadow: var(--shadow);
            position: relative;
            overflow: hidden;
        }

        .instruction-box::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 100px;
            height: 100px;
            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='%232c5aa0' fill-opacity='0.05' d='M0,0 L100,0 L100,100 Z'/%3E%3C/svg%3E");
            background-size: cover;
        }

        .instruction-box h3 {
            color: var(--primary-color);
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 22px;
        }

        .instruction-box p {
            color: var(--dark-color);
            font-size: 16px;
            line-height: 1.8;
            position: relative;
            z-index: 1;
        }

        .success-message {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.9);
            background: white;
            padding: 40px;
            border-radius: var(--radius);
            box-shadow: 0 15px 40px rgba(0,0,0,0.2);
            text-align: center;
            z-index: 3000;
            opacity: 0;
            visibility: hidden;
            transition: var(--transition);
            max-width: 500px;
            width: 90%;
        }

        .success-message.active {
            opacity: 1;
            visibility: visible;
            transform: translate(-50%, -50%) scale(1);
        }

        .success-icon {
            font-size: 70px;
            color: var(--success-color);
            margin-bottom: 25px;
            animation: bounce 1s ease;
        }

        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
            40% {transform: translateY(-20px);}
            60% {transform: translateY(-10px);}
        }

        .success-title {
            font-size: 26px;
            color: var(--primary-color);
            margin-bottom: 15px;
            font-weight: 700;
        }

        .success-details {
            color: var(--gray-color);
            font-size: 16px;
            margin-bottom: 25px;
            line-height: 1.8;
        }

        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(5px);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 4000;
            flex-direction: column;
            gap: 25px;
        }

        .loading-overlay.active {
            display: flex;
            animation: fadeIn 0.3s ease;
        }

        .loading-spinner {
            width: 60px;
            height: 60px;
            border: 5px solid var(--border-color);
            border-top: 5px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .loading-text {
            font-size: 18px;
            color: var(--primary-color);
            font-weight: 600;
        }

        @media (max-width: 992px) {
            .form-row {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 22px;
            }
            
            .main-container {
                padding: 0 15px 30px;
                margin-top: 110px;
            }
            
            .report-form-container {
                padding: 30px;
            }
        }

        @media (max-width: 768px) {
            .header {
                padding: 20px 15px;
            }
            
            .header h1 {
                font-size: 20px;
            }
            
            .section-header {
                font-size: 20px;
            }
            
            .action-buttons {
                flex-direction: column;
            }
            
            .action-buttons .btn {
                width: 100%;
            }
            
            .scroll-indicator {
                bottom: 20px;
                left: 20px;
                width: 50px;
                height: 50px;
            }
        }

        @media (max-width: 576px) {
            .header h1 {
                font-size: 18px;
            }
            
            .header-subtitle {
                font-size: 14px;
            }
            
            .main-container {
                padding: 0 10px 20px;
                margin-top: 100px;
            }
            
            .report-form-container {
                padding: 20px;
            }
            
            .section-header {
                font-size: 18px;
            }
            
            .form-input, .form-select, .form-textarea {
                padding: 14px;
                font-size: 15px;
            }
            
            .success-message {
                padding: 30px 20px;
            }
        }

        ::-webkit-scrollbar {
            width: 12px;
        }

        ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }

        ::webkit-scrollbar-thumb {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
            border-radius: 10px;
            border: 3px solid #f1f1f1;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--primary-dark);
        }

        .form-input.invalid, .form-select.invalid, .form-textarea.invalid {
            border-color: var(--danger-color);
            background-color: rgba(220, 53, 69, 0.05);
        }

        .validation-error {
            color: var(--danger-color);
            font-size: 14px;
            margin-top: 5px;
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .validation-error i {
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-spinner"></div>
        <div class="loading-text" id="loadingText">جاري معالجة البيانات...</div>
    </div>

    <div class="success-message" id="successMessage">
        <div class="success-icon">
            <i class="fas fa-check-circle"></i>
        </div>
        <h3 class="success-title" id="successTitle">تم إنشاء التقرير بنجاح!</h3>
        <p class="success-details" id="successDetails">جاري تحميل الملف...</p>
        <button class="btn btn-success" id="closeSuccessMessage">
            <i class="fas fa-check"></i> موافق
        </button>
    </div>

    <div class="header">
        <h1>نظام إعداد التقارير - أداء الواجبات الوظيفية</h1>
        <div class="header-subtitle">الإدارة العامة للتعليم بمنطقة الرياض</div>
    </div>

    <div class="main-container">
        <div class="instruction-box">
            <h3><i class="fas fa-info-circle"></i> تعليمات إعداد التقرير</h3>
            <p>يرجى تعبئة جميع الحقول المطلوبة (*) بدقة لتتمكن من إنشاء التقرير بشكل صحيح. يمكنك حفظ العمل كمسودة والعودة إليه لاحقاً.</p>
        </div>

        <div class="report-form-container">
            <div class="form-section">
                <h2 class="section-header"><i class="fas fa-file-signature"></i> اختيار نوع التقرير</h2>
                <p class="section-subtitle">اختر نوع التقرير المناسب لهذا البند من القائمة التالية</p>
                
                <div class="form-group">
                    <label class="form-label required"><i class="fas fa-tasks"></i> أداء الواجبات الوظيفية (البند رقم 1)</label>
                    <select class="form-select" id="reportType">
                        <option value="">اختر نوع التقرير...</option>
                        <option value="strategy" selected>تقرير تنفيذ استراتيجية</option>
                        <option value="activity-session">تقرير حصة النشاط</option>
                        <option value="class-activities">تقرير أنشطة داخل الفصل</option>
                        <option value="remedial">تقرير نشاط إلزائي</option>
                        <option value="visits">تقرير تبادل الزيارات</option>
                    </select>
                    <div id="reportTypeError" class="validation-error" style="display: none;">
                        <i class="fas fa-exclamation-circle"></i> هذا الحقل مطلوب
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h2 class="section-header"><i class="fas fa-database"></i> البيانات الرئيسية</h2>
                <p class="section-subtitle">البيانات الرئيسية التي ستظهر في رأس التقرير النهائي</p>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label required"><i class="fas fa-map-marker-alt"></i> اسم المنطقة</label>
                        <input type="text" class="form-input" id="region" placeholder="مثال: الرياض" value="الرياض">
                        <div class="form-example">مثال: الرياض، مكة المكرمة، المدينة المنورة</div>
                        <div id="regionError" class="validation-error" style="display: none;">
                            <i class="fas fa-exclamation-circle"></i> هذا الحقل مطلوب
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label required"><i class="fas fa-school"></i> اسم المدرسة</label>
                        <input type="text" class="form-input" id="school" placeholder="اسم المدرسة" value="مدرسة النموذجية الثانوية">
                        <div id="schoolError" class="validation-error" style="display: none;">
                            <i class="fas fa-exclamation-circle"></i> هذا الحقل مطلوب
                        </div>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label required"><i class="fas fa-user-tie"></i> مدير المدرسة</label>
                        <input type="text" class="form-input" id="principal" placeholder="مدير المدرسة" value="أ. علي محمد أحمد">
                        <div class="form-example">مثال: أ. علي محمد أحمد، د. محمد بن عبدالله</div>
                        <div id="principalError" class="validation-error" style="display: none;">
                            <i class="fas fa-exclamation-circle"></i> هذا الحقل مطلوب
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label required"><i class="fas fa-user-edit"></i> معد التقرير</label>
                        <input type="text" class="form-input" id="reporter" placeholder="معد التقرير" value="أ. أحمد عبدالله السعيد">
                        <div class="form-example">مثال: أ. أحمد عبدالله السعيد، م. خالد محمد</div>
                        <div id="reporterError" class="validation-error" style="display: none;">
                            <i class="fas fa-exclamation-circle"></i> هذا الحقل مطلوب
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label required"><i class="fas fa-heading"></i> عنوان التقرير</label>
                    <input type="text" class="form-input" id="reportTitle" placeholder="عنوان التقرير" value="تقرير تنفيذ استراتيجية">
                    <div id="reportTitleError" class="validation-error" style="display: none;">
                        <i class="fas fa-exclamation-circle"></i> هذا الحقل مطلوب
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label required"><i class="fas fa-book"></i> تابع للمناهج (نعم/لا)</label>
                    <select class="form-select" id="curriculumRelated">
                        <option value="نعم" selected>نعم</option>
                        <option value="لا">لا</option>
                    </select>
                    <div id="curriculumRelatedError" class="validation-error" style="display: none;">
                        <i class="fas fa-exclamation-circle"></i> هذا الحقل مطلوب
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h2 class="section-header"><i class="fas fa-calendar-alt"></i> تفاصيل البرنامج</h2>
                <p class="section-subtitle">التفاصيل الزمنية والمكانية للبرنامج المنفذ</p>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label required"><i class="fas fa-calendar"></i> تاريخ البرنامج (هجري)</label>
                        <input type="text" class="form-input" id="programDate" placeholder="1447-06-12" value="1447-06-12">
                        <div class="form-example">التاريخ الهجري بالصيغة: 1447-06-12</div>
                        <div id="programDateError" class="validation-error" style="display: none;">
                            <i class="fas fa-exclamation-circle"></i> هذا الحقل مطلوب
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label required"><i class="fas fa-map-marker"></i> مكان التنفيذ</label>
                        <input type="text" class="form-input" id="location" placeholder="مثال: قاعة مصادر التعلم" value="قاعة مصادر التعلم">
                        <div class="form-example">مثال: قاعة مصادر التعلم، الفصل الدراسي، الساحة المدرسية</div>
                        <div id="locationError" class="validation-error" style="display: none;">
                            <i class="fas fa-exclamation-circle"></i> هذا الحقل مطلوب
                        </div>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label required"><i class="fas fa-users"></i> المستهدفون</label>
                        <input type="text" class="form-input" id="target" placeholder="مثال: طلاب الصف الثالث ثانوي" value="طلاب الصف الثالث ثانوي">
                        <div class="form-example">مثال: طلاب الصف الثالث ثانوي، معلمو المرحلة الابتدائية</div>
                        <div id="targetError" class="validation-error" style="display: none;">
                            <i class="fas fa-exclamation-circle"></i> هذا الحقل مطلوب
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label required"><i class="fas fa-user-check"></i> عدد المستفيدين</label>
                        <input type="number" class="form-input" id="beneficiaries" placeholder="مثال: 25 طالباً" value="25" min="1">
                        <div class="form-example">أدخل عدد المستفيدين من البرنامج (رقم فقط)</div>
                        <div id="beneficiariesError" class="validation-error" style="display: none;">
                            <i class="fas fa-exclamation-circle"></i> هذا الحقل مطلوب
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h2 class="section-header"><i class="fas fa-align-left"></i> وصف النشاط</h2>
                <p class="section-subtitle">وصف شامل وواضح للنشاط الذي تم تنفيذه</p>
                
                <div class="form-group">
                    <label class="form-label required"><i class="fas fa-clipboard-list"></i> وصف مختصر لما تم تنفيذه</label>
                    <textarea class="form-textarea" id="description" placeholder="وصف مختصر لما تم تنفيذه في النشاط">تم تنفيذ استراتيجية التدريس وفق الخطة المعتمدة، مع توزيع الطلاب على مجموعات عمل تعاونية وتنويع الأنشطة بما يناسب ميولهم واحتياجاتهم. تم تطبيق استراتيجية التعلم النشط من خلال أنشطة عملية وتفاعلية.</textarea>
                    <div class="form-example">يجب أن يتضمن الوصف ملخصاً واضحاً وشاملاً للنشاط المنفذ</div>
                    <div id="descriptionError" class="validation-error" style="display: none;">
                        <i class="fas fa-exclamation-circle"></i> هذا الحقل مطلوب
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h2 class="section-header"><i class="fas fa-tasks"></i> إجراءات التنفيذ</h2>
                <p class="section-subtitle">الخطوات والإجراءات التي تم اتباعها لتنفيذ النشاط</p>
                
                <div class="form-group">
                    <label class="form-label required"><i class="fas fa-list-ol"></i> إجراءات التنفيذ (افصل بين النقاط بفاصلة)</label>
                    <textarea class="form-textarea" id="procedures" placeholder="أدخل إجراءات التنفيذ">إعداد خطة حصة النشاط وتحديد الأهداف والأنشطة المناسبة, توزيع الطلاب إلى مجموعات عمل وتوضيح المهام لكل مجموعة, توفير المواد والأدوات اللازمة للنشاط, متابعة تنفيذ الطلاب للنشاط وتقديم التوجيه اللازم, تقييم مخرجات النشاط من قبل الطلاب والمعلم</textarea>
                    <div class="form-example">أدخل كل إجراء في سطر جديد أو افصل بين النقاط بفاصلة (,) كل إجراء يجب أن يكون جملة كاملة</div>
                    <div id="proceduresError" class="validation-error" style="display: none;">
                        <i class="fas fa-exclamation-circle"></i> هذا الحقل مطلوب
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h2 class="section-header"><i class="fas fa-chart-line"></i> النتائج</h2>
                <p class="section-subtitle">النتائج المتحققة والأثر الإيجابي للنشاط</p>
                
                <div class="form-group">
                    <label class="form-label required"><i class="fas fa-chart-bar"></i> النتائج (افصل بين النقاط بفاصلة)</label>
                    <textarea class="form-textarea" id="results" placeholder="أدخل النتائج المتحققة">تفاعل إيجابي من الطلاب أثناء تنفيذ استراتيجية التدريس, تنمية روح التعاون والعمل الجماعي بين الطلاب, اكتشاف مواهب الطلاب في مجالات متنوعة, تطبيق المعرفة النظرية في أنشطة عملية, زيادة دافعية الطلاب للتعلم والمشاركة</textarea>
                    <div class="form-example">اذكر النتائج الإيجابية التي تحققت من تنفيذ النشاط بشكل واضح ومفصل</div>
                    <div id="resultsError" class="validation-error" style="display: none;">
                        <i class="fas fa-exclamation-circle"></i> هذا الحقل مطلوب
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h2 class="section-header"><i class="fas fa-lightbulb"></i> التوصيات</h2>
                <p class="section-subtitle">توصيات للتحسين والتطوير في المستقبل</p>
                
                <div class="form-group">
                    <label class="form-label required"><i class="fas fa-comments"></i> التوصيات</label>
                    <textarea class="form-textarea" id="recommendations" placeholder="أدخل التوصيات">الاستمرار في تنويع استراتيجيات التدريس وتوثيق الممارسات المميزة لإثراء التجارب المستقبلية. توفير المزيد من الموارد والأدوات اللازمة للأنشطة العملية. تشجيع الطلاب المبدعين للمشاركة في المسابقات والمنافسات الخارجية. عقد ورش عمل للمعلمين لتبادل الخبرات في مجال استراتيجيات التدريس الحديثة.</textarea>
                    <div class="form-example">قدم توصيات واضحة وعملية للتحسين والتطوير في المستقبل</div>
                    <div id="recommendationsError" class="validation-error" style="display: none;">
                        <i class="fas fa-exclamation-circle"></i> هذا الحقل مطلوب
                    </div>
                </div>
            </div>

            <div class="form-section upload-section">
                <h2 class="section-header"><i class="fas fa-images"></i> الصور المرفقة بالتقرير</h2>
                <p class="section-subtitle">صور توثيقية للنشاط المنفذ (صورتان كحد أقصى)</p>
                
                <div class="upload-area" id="uploadArea">
                    <div class="upload-icon">
                        <i class="fas fa-cloud-upload-alt"></i>
                    </div>
                    <div class="upload-text">انقر لرفع الصور أو اسحبها إلى هنا</div>
                    <div class="upload-hint">الحجم الأقصى: 5MB لكل صورة | الصيغ المدعومة: JPG, PNG, GIF | الحد الأقصى: صورتان</div>
                    <input type="file" id="imageUpload" accept="image/*" multiple style="display: none;">
                </div>
                
                <div class="image-preview" id="imagePreview"></div>
                
                <div class="form-group" style="margin-top: 20px;">
                    <label class="form-label"><i class="fas fa-tips"></i> نصائح للصور المرفقة:</label>
                    <ul style="padding-right: 20px; color: var(--gray-color); font-size: 14px; line-height: 1.8;">
                        <li>صورة توثيق تنفيذ النشاط داخل الصف أو ساحة المدرسة</li>
                        <li>صورة لأعمال أو منتجات الطلاب الناتجة عن النشاط</li>
                        <li>صورة لعرض الطلاب لمخرجاتهم أو مشاركتهم في النشاط</li>
                        <li>يفضل إرفاق صور واضحة توثق التنفيذ أو النماذج أو أعمال الطلاب</li>
                    </ul>
                </div>
            </div>

            <div class="action-buttons">
                <button class="btn btn-secondary" id="saveDraft">
                    <i class="fas fa-save"></i> حفظ كمسودة
                </button>
                
                <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                    <button class="btn btn-outline" id="previewReport">
                        <i class="fas fa-eye"></i> معاينة التقرير
                    </button>
                    <button class="btn btn-success" id="submitReport">
                        <i class="fas fa-check-circle"></i> تصدير التقرير HTML
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="scroll-indicator" id="scrollToTop">
        <i class="fas fa-arrow-up"></i>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const uploadArea = document.getElementById('uploadArea');
            const imageUpload = document.getElementById('imageUpload');
            const imagePreview = document.getElementById('imagePreview');
            const scrollToTopBtn = document.getElementById('scrollToTop');
            const saveDraftBtn = document.getElementById('saveDraft');
            const previewReportBtn = document.getElementById('previewReport');
            const submitReportBtn = document.getElementById('submitReport');
            const loadingOverlay = document.getElementById('loadingOverlay');
            const loadingText = document.getElementById('loadingText');
            const successMessage = document.getElementById('successMessage');
            const successTitle = document.getElementById('successTitle');
            const successDetails = document.getElementById('successDetails');
            const closeSuccessMessage = document.getElementById('closeSuccessMessage');
            
            let uploadedImages = [];
            let currentReportData = null;
            
            function setupEventListeners() {
                uploadArea.addEventListener('click', function() {
                    imageUpload.click();
                });
                
                uploadArea.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    this.classList.add('dragover');
                });
                
                uploadArea.addEventListener('dragleave', function() {
                    this.classList.remove('dragover');
                });
                
                uploadArea.addEventListener('drop', function(e) {
                    e.preventDefault();
                    this.classList.remove('dragover');
                    const files = e.dataTransfer.files;
                    handleImageUpload(files);
                });
                
                imageUpload.addEventListener('change', function(e) {
                    const files = e.target.files;
                    handleImageUpload(files);
                });
                
                scrollToTopBtn.addEventListener('click', function() {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                
                window.addEventListener('scroll', function() {
                    if (window.scrollY > 300) {
                        scrollToTopBtn.classList.add('visible');
                    } else {
                        scrollToTopBtn.classList.remove('visible');
                    }
                });
                
                saveDraftBtn.addEventListener('click', saveAsDraft);
                previewReportBtn.addEventListener('click', previewReport);
                submitReportBtn.addEventListener('click', exportToHTML);
                
                document.querySelectorAll('.form-input, .form-textarea, .form-select').forEach(input => {
                    input.addEventListener('blur', function() {
                        validateField(this);
                    });
                    
                    input.addEventListener('input', function() {
                        if (this.value.trim()) {
                            this.classList.remove('invalid');
                            const errorDiv = document.getElementById(`${this.id}Error`);
                            if (errorDiv) errorDiv.style.display = 'none';
                        }
                    });
                });
                
                closeSuccessMessage.addEventListener('click', function() {
                    successMessage.classList.remove('active');
                });
            }
            
            function handleImageUpload(files) {
                if (uploadedImages.length + files.length > 4) {
                    showError('يمكنك رفع 4 صور كحد أقصى فقط');
                    return;
                }
                
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    
                    if (!file.type.startsWith('image/')) {
                        showError('الرجاء رفع ملفات صور فقط (JPG, PNG, GIF)');
                        continue;
                    }
                    
                    if (file.size > 5 * 1024 * 1024) {
                        showError('حجم الصورة يجب أن يكون أقل من 5MB');
                        continue;
                    }
                    
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        uploadedImages.push({
                            data: e.target.result,
                            name: file.name,
                            type: file.type
                        });
                        updateImagePreview();
                    };
                    
                    reader.readAsDataURL(file);
                }
                
                imageUpload.value = '';
            }
            
            function updateImagePreview() {
                imagePreview.innerHTML = '';
                
                uploadedImages.forEach((imgData, index) => {
                    const item = document.createElement('div');
                    item.className = 'preview-item';
                    
                    item.innerHTML = `
                        <img src="${imgData.data}" class="preview-img" alt="صورة ${index + 1}">
                        <button class="preview-remove" data-index="${index}">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    
                    imagePreview.appendChild(item);
                });
                
                document.querySelectorAll('.preview-remove').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const index = parseInt(this.dataset.index);
                        uploadedImages.splice(index, 1);
                        updateImagePreview();
                    });
                });
            }
            
            function loadInitialData() {
                const savedDraft = localStorage.getItem('reportDraft');
                if (savedDraft) {
                    try {
                        const draftData = JSON.parse(savedDraft);
                        if (confirm('يوجد تقرير محفوظ كمسودة. هل تريد استكماله؟')) {
                            loadDraftData(draftData);
                        }
                    } catch (e) {
                        console.error('Error loading draft:', e);
                    }
                }
            }
            
            function loadDraftData(draftData) {
                document.getElementById('reportType').value = draftData.type || 'strategy';
                document.getElementById('reportTitle').value = draftData.title || 'تقرير تنفيذ استراتيجية';
                document.getElementById('curriculumRelated').value = draftData.curriculumRelated || 'نعم';
                document.getElementById('programDate').value = draftData.programDate || '1447-06-12';
                document.getElementById('location').value = draftData.location || '';
                document.getElementById('target').value = draftData.target || '';
                document.getElementById('beneficiaries').value = draftData.beneficiaries || '25';
                document.getElementById('description').value = draftData.description || '';
                document.getElementById('procedures').value = draftData.procedures ? (Array.isArray(draftData.procedures) ? draftData.procedures.join(', ') : draftData.procedures) : '';
                document.getElementById('results').value = draftData.results ? (Array.isArray(draftData.results) ? draftData.results.join(', ') : draftData.results) : '';
                document.getElementById('recommendations').value = draftData.recommendations || '';
                
                if (draftData.images && draftData.images.length > 0) {
                    uploadedImages = [...draftData.images];
                    updateImagePreview();
                }
                
                showSuccess('تم تحميل بيانات المسودة بنجاح');
            }
            
            function validateField(field) {
                const errorDiv = document.getElementById(`${field.id}Error`);
                
                if (field.hasAttribute('required') && !field.value.trim()) {
                    field.classList.add('invalid');
                    if (errorDiv) errorDiv.style.display = 'flex';
                    return false;
                }
                
                field.classList.remove('invalid');
                if (errorDiv) errorDiv.style.display = 'none';
                return true;
            }
            
            function validateForm() {
                let isValid = true;
                const requiredFields = document.querySelectorAll('[required]');
                
                requiredFields.forEach(field => {
                    if (!validateField(field)) {
                        isValid = false;
                    }
                });
                
                return isValid;
            }
            
            function saveAsDraft() {
                if (!validateForm()) {
                    showError('يرجى ملء جميع الحقول المطلوبة قبل الحفظ');
                    return;
                }
                
                const reportData = collectReportData();
                reportData.status = 'draft';
                reportData.savedAt = new Date().toLocaleString('ar-SA');
                
                localStorage.setItem('reportDraft', JSON.stringify(reportData));
                
                showSuccess('تم حفظ التقرير كمسودة بنجاح!\n' + reportData.savedAt);
            }
            
            function previewReport() {
                if (!validateForm()) {
                    showError('يرجى ملء جميع الحقول المطلوبة قبل المعاينة');
                    return;
                }
                
                currentReportData = collectReportData();
                currentReportData.reportNumber = generateReportNumber();
                
                const previewWindow = window.open('', '_blank');
                previewWindow.document.write(generateFullSiteHTML(currentReportData));
                previewWindow.document.close();
            }
            
            function exportToHTML() {
                if (!validateForm()) {
                    showError('يرجى ملء جميع الحقول المطلوبة قبل الإنشاء');
                    return;
                }
                
                currentReportData = collectReportData();
                currentReportData.status = 'completed';
                currentReportData.submissionDate = new Date().toLocaleDateString('ar-SA');
                currentReportData.reportNumber = generateReportNumber();
                
                showLoading('جاري إنشاء التقرير بصيغة HTML...');
                
                try {
                    const htmlContent = generateFullSiteHTML(currentReportData);
                    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                    saveAs(blob, `تقرير_${currentReportData.reportNumber}.html`);
                    
                    currentReportData.exportedAt = new Date().toLocaleString('ar-SA');
                    localStorage.setItem('lastReport', JSON.stringify(currentReportData));
                    
                    hideLoading();
                    showExportSuccess();
                    
                } catch (error) {
                    hideLoading();
                    showError(`حدث خطأ أثناء التصدير: ${error.message}`);
                }
            }
            
            function collectReportData() {
                return {
                    type: document.getElementById('reportType').value,
                    region: document.getElementById('region').value,
                    school: document.getElementById('school').value,
                    principal: document.getElementById('principal').value,
                    reporter: document.getElementById('reporter').value,
                    title: document.getElementById('reportTitle').value,
                    curriculumRelated: document.getElementById('curriculumRelated').value,
                    programDate: document.getElementById('programDate').value,
                    location: document.getElementById('location').value,
                    target: document.getElementById('target').value,
                    beneficiaries: document.getElementById('beneficiaries').value,
                    description: document.getElementById('description').value,
                    procedures: document.getElementById('procedures').value.split(',').map(p => p.trim()).filter(p => p),
                    results: document.getElementById('results').value.split(',').map(r => r.trim()).filter(r => r),
                    recommendations: document.getElementById('recommendations').value,
                    images: [...uploadedImages]
                };
            }
            
            function generateFullSiteHTML(reportData) {
                return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportData.title} - الإدارة العامة للتعليم بمنطقة ${reportData.region}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #2c5aa0;
            --primary-dark: #1e3d6f;
            --primary-light: #4a7bc8;
            --secondary-color: #f0f4f8;
            --light-color: #ffffff;
            --dark-color: #333333;
            --gray-color: #666666;
            --border-color: #e0e0e0;
            --success-color: #28a745;
            --shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            --radius: 8px;
            --transition: all 0.3s ease;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.8;
            color: var(--dark-color);
            background-color: #f8fafc;
            direction: rtl;
        }

        .site-header {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
            color: white;
            padding: 25px 0;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            position: sticky;
            top: 0;
            z-index: 1000;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            flex-wrap: wrap;
            gap: 20px;
        }

        .logo-section {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .logo {
            width: 70px;
            height: 70px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }

        .logo i {
            font-size: 32px;
            color: var(--primary-color);
        }

        .site-title h1 {
            font-size: 28px;
            margin-bottom: 5px;
            font-weight: 800;
        }

        .site-title p {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 300;
        }

        .report-meta {
            display: flex;
            flex-direction: column;
            gap: 10px;
            background: rgba(255,255,255,0.1);
            padding: 15px 20px;
            border-radius: var(--radius);
            backdrop-filter: blur(10px);
        }

        .meta-item {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
        }

        .meta-item i {
            color: #ffd700;
        }

        .main-nav {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: var(--radius);
            padding: 15px;
            margin-top: 10px;
        }

        .nav-menu {
            display: flex;
            list-style: none;
            gap: 30px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .nav-menu a {
            color: white;
            text-decoration: none;
            font-weight: 600;
            font-size: 18px;
            padding: 10px 20px;
            border-radius: var(--radius);
            transition: var(--transition);
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .nav-menu a:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }

        .hero-section {
            background: linear-gradient(rgba(44, 90, 160, 0.9), rgba(30, 61, 111, 0.9)),
                        url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80');
            background-size: cover;
            background-position: center;
            padding: 100px 0;
            text-align: center;
            color: white;
            margin-bottom: 60px;
        }

        .hero-content h2 {
            font-size: 48px;
            margin-bottom: 20px;
            font-weight: 800;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .hero-content p {
            font-size: 22px;
            max-width: 800px;
            margin: 0 auto 30px;
            opacity: 0.95;
        }

        .report-section {
            background: white;
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            padding: 50px;
            margin-bottom: 40px;
            border: 1px solid var(--border-color);
        }

        .section-header {
            color: var(--primary-color);
            border-right: 5px solid var(--primary-color);
            padding-right: 20px;
            margin-bottom: 40px;
            font-size: 32px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .section-header i {
            font-size: 28px;
            background: rgba(44, 90, 160, 0.1);
            padding: 15px;
            border-radius: 12px;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }

        .info-card {
            background: var(--secondary-color);
            border-radius: var(--radius);
            padding: 30px;
            border-left: 5px solid var(--primary-color);
            transition: var(--transition);
        }

        .info-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow);
        }

        .info-card h4 {
            color: var(--primary-color);
            font-size: 20px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .info-card p {
            font-size: 18px;
            color: var(--dark-color);
            line-height: 1.6;
        }

        .content-card {
            background: white;
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 40px;
            margin-bottom: 30px;
            box-shadow: 0 2px 15px rgba(0,0,0,0.05);
        }

        .content-card h3 {
            color: var(--primary-color);
            font-size: 24px;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .content-card p {
            font-size: 18px;
            line-height: 1.8;
            color: var(--dark-color);
            text-align: justify;
            margin-bottom: 20px;
        }

        .list-container {
            padding-right: 20px;
        }

        .list-item {
            display: flex;
            align-items: flex-start;
            gap: 15px;
            margin-bottom: 20px;
            padding: 20px;
            background: var(--secondary-color);
            border-radius: var(--radius);
            border-right: 4px solid var(--primary-color);
            transition: var(--transition);
        }

        .list-item:hover {
            transform: translateX(-10px);
            background: white;
            box-shadow: var(--shadow);
        }

        .list-number {
            background: var(--primary-color);
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 20px;
            flex-shrink: 0;
        }

        .list-text {
            font-size: 18px;
            color: var(--dark-color);
            flex: 1;
        }

        .gallery-section {
            margin: 60px 0;
        }

        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 30px;
        }

        .gallery-item {
            border-radius: var(--radius);
            overflow: hidden;
            box-shadow: var(--shadow);
            transition: var(--transition);
            position: relative;
        }

        .gallery-item:hover {
            transform: translateY(-10px) scale(1.02);
        }

        .gallery-item img {
            width: 100%;
            height: 250px;
            object-fit: cover;
            display: block;
        }

        .gallery-caption {
            background: var(--primary-color);
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 18px;
        }

        .signatures-section {
            background: linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 100%);
            border-radius: var(--radius);
            padding: 60px;
            margin: 60px 0;
            text-align: center;
        }

        .signatures-grid {
            display: flex;
            justify-content: space-around;
            gap: 40px;
            margin-top: 40px;
            flex-wrap: wrap;
        }

        .signature-box {
            background: white;
            padding: 40px;
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            width: 300px;
            transition: var(--transition);
            border-top: 5px solid var(--primary-color);
        }

        .signature-box:hover {
            transform: translateY(-10px);
        }

        .signature-title {
            color: var(--primary-color);
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 20px;
        }

        .signature-name {
            font-size: 22px;
            color: var(--dark-color);
            margin-bottom: 30px;
            font-weight: 600;
        }

        .signature-line {
            width: 200px;
            height: 2px;
            background: var(--dark-color);
            margin: 30px auto 15px;
        }

        .signature-label {
            color: var(--gray-color);
            font-size: 18px;
            font-style: italic;
        }

        .site-footer {
            background: var(--primary-dark);
            color: white;
            padding: 60px 0 30px;
            margin-top: 80px;
        }

        .footer-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 40px;
            margin-bottom: 40px;
        }

        .footer-section h3 {
            font-size: 24px;
            margin-bottom: 25px;
            color: #ffd700;
        }

        .footer-section p {
            font-size: 16px;
            line-height: 1.8;
            opacity: 0.9;
        }

        .footer-bottom {
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid rgba(255,255,255,0.1);
            font-size: 16px;
            opacity: 0.8;
        }

        @media (max-width: 992px) {
            .header-top {
                flex-direction: column;
                text-align: center;
            }
            
            .nav-menu {
                gap: 15px;
            }
            
            .hero-content h2 {
                font-size: 36px;
            }
            
            .report-section {
                padding: 30px;
            }
        }

        @media (max-width: 768px) {
            .hero-section {
                padding: 60px 0;
            }
            
            .hero-content h2 {
                font-size: 28px;
            }
            
            .hero-content p {
                font-size: 18px;
            }
            
            .section-header {
                font-size: 24px;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .signatures-grid {
                flex-direction: column;
                align-items: center;
            }
            
            .gallery-grid {
                grid-template-columns: 1fr;
            }
        }

        .print-btn {
            position: fixed;
            bottom: 30px;
            left: 30px;
            background: var(--success-color);
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: var(--radius);
            cursor: pointer;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            transition: var(--transition);
            z-index: 100;
        }

        .print-btn:hover {
            background: #218838;
            transform: translateY(-3px);
        }
    </style>
</head>
<body>
    <header class="site-header">
        <div class="container">
            <div class="header-top">
                <div class="logo-section">
                    <div class="logo">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="site-title">
                        <h1>${reportData.title}</h1>
                        <p>الإدارة العامة للتعليم بمنطقة ${reportData.region}</p>
                    </div>
                </div>
                <div class="report-meta">
                    <div class="meta-item">
                        <i class="fas fa-hashtag"></i>
                        <span>رقم التقرير: ${reportData.reportNumber}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>تاريخ البرنامج: ${reportData.programDate}</span>
                    </div>
                </div>
            </div>
            <nav class="main-nav">
                <ul class="nav-menu">
                    <li><a href="#basic-info"><i class="fas fa-info-circle"></i> البيانات الأساسية</a></li>
                    <li><a href="#description"><i class="fas fa-clipboard-list"></i> وصف النشاط</a></li>
                    <li><a href="#procedures"><i class="fas fa-tasks"></i> إجراءات التنفيذ</a></li>
                    <li><a href="#results"><i class="fas fa-chart-line"></i> النتائج</a></li>
                    <li><a href="#recommendations"><i class="fas fa-lightbulb"></i> التوصيات</a></li>
                    ${reportData.images && reportData.images.length > 0 ? '<li><a href="#gallery"><i class="fas fa-images"></i> الصور المرفقة</a></li>' : ''}
                </ul>
            </nav>
        </div>
    </header>

    <section class="hero-section">
        <div class="container">
            <div class="hero-content">
                <h2>${reportData.title}</h2>
                <p>تقرير مفصل عن أنشطة وأداء الواجبات الوظيفية حسب المعايير المعتمدة</p>
                <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-top: 40px;">
                    <div style="background: rgba(255,255,255,0.2); padding: 15px 30px; border-radius: var(--radius); backdrop-filter: blur(10px);">
                        <div style="font-size: 18px; margin-bottom: 5px;">المدرسة</div>
                        <div style="font-size: 24px; font-weight: bold;">${reportData.school}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.2); padding: 15px 30px; border-radius: var(--radius); backdrop-filter: blur(10px);">
                        <div style="font-size: 18px; margin-bottom: 5px;">معد التقرير</div>
                        <div style="font-size: 24px; font-weight: bold;">${reportData.reporter}</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <main class="container">
        <section id="basic-info" class="report-section">
            <h2 class="section-header"><i class="fas fa-database"></i>البيانات الأساسية</h2>
            <div class="info-grid">
                <div class="info-card">
                    <h4><i class="fas fa-school"></i>المدرسة</h4>
                    <p>${reportData.school}</p>
                </div>
                <div class="info-card">
                    <h4><i class="fas fa-user-tie"></i>مدير المدرسة</h4>
                    <p>${reportData.principal}</p>
                </div>
                <div class="info-card">
                    <h4><i class="fas fa-user-edit"></i>معد التقرير</h4>
                    <p>${reportData.reporter}</p>
                </div>
                <div class="info-card">
                    <h4><i class="fas fa-map-marker"></i>مكان التنفيذ</h4>
                    <p>${reportData.location}</p>
                </div>
                <div class="info-card">
                    <h4><i class="fas fa-users"></i>المستهدفون</h4>
                    <p>${reportData.target}</p>
                </div>
                <div class="info-card">
                    <h4><i class="fas fa-user-check"></i>عدد المستفيدين</h4>
                    <p>${reportData.beneficiaries}</p>
                </div>
                <div class="info-card">
                    <h4><i class="fas fa-book"></i>تابع للمناهج</h4>
                    <p>${reportData.curriculumRelated}</p>
                </div>
            </div>
        </section>

        <section id="description" class="report-section">
            <h2 class="section-header"><i class="fas fa-clipboard-list"></i>وصف مختصر لما تم تنفيذه</h2>
            <div class="content-card">
                <p>${reportData.description}</p>
            </div>
        </section>

        ${reportData.procedures && reportData.procedures.length > 0 ? `
        <section id="procedures" class="report-section">
            <h2 class="section-header"><i class="fas fa-tasks"></i>إجراءات التنفيذ</h2>
            <div class="list-container">
                ${reportData.procedures.map((procedure, index) => `
                <div class="list-item">
                    <div class="list-number">${index + 1}</div>
                    <div class="list-text">${procedure}</div>
                </div>
                `).join('')}
            </div>
        </section>` : ''}

        ${reportData.results && reportData.results.length > 0 ? `
        <section id="results" class="report-section">
            <h2 class="section-header"><i class="fas fa-chart-line"></i>النتائج</h2>
            <div class="list-container">
                ${reportData.results.map((result, index) => `
                <div class="list-item">
                    <div class="list-number">${index + 1}</div>
                    <div class="list-text">${result}</div>
                </div>
                `).join('')}
            </div>
        </section>` : ''}

        <section id="recommendations" class="report-section">
            <h2 class="section-header"><i class="fas fa-lightbulb"></i>التوصيات</h2>
            <div class="content-card">
                <p>${reportData.recommendations}</p>
            </div>
        </section>

        ${reportData.images && reportData.images.length > 0 ? `
        <section id="gallery" class="report-section gallery-section">
            <h2 class="section-header"><i class="fas fa-images"></i>الصور المرفقة</h2>
            <div class="gallery-grid">
                ${reportData.images.map((img, idx) => `
                <div class="gallery-item">
                    <img src="${img.data}" alt="صورة ${idx + 1}">
                    <div class="gallery-caption">صورة ${idx + 1}: ${img.name}</div>
                </div>`).join('')}
            </div>
        </section>` : ''}

        <section class="signatures-section">
            <h2 class="section-header"><i class="fas fa-signature"></i>التوقيعات</h2>
            <div class="signatures-grid">
                <div class="signature-box">
                    <div class="signature-title">مدير المدرسة</div>
                    <div class="signature-name">${reportData.principal}</div>
                    <div class="signature-line"></div>
                    <div class="signature-label">التوقيع</div>
                </div>
                <div class="signature-box">
                    <div class="signature-title">معد التقرير</div>
                    <div class="signature-name">${reportData.reporter}</div>
                    <div class="signature-line"></div>
                    <div class="signature-label">التوقيع</div>
                </div>
            </div>
        </section>
    </main>

    <footer class="site-footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>نظام إعداد التقارير</h3>
                    <p>نظام إلكتروني متكامل لإعداد وتوثيق التقارير الوظيفية وفق المعايير المعتمدة في وزارة التعليم.</p>
                </div>
                <div class="footer-section">
                    <h3>معلومات التقرير</h3>
                    <p>رقم التقرير: ${reportData.reportNumber}</p>
                    <p>تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-SA')}</p>
                    <p>الإصدار: 1.0</p>
                </div>
                <div class="footer-section">
                    <h3>اتصل بنا</h3>
                    <p>الإدارة العامة للتعليم بمنطقة ${reportData.region}</p>
                    <p>البريد الإلكتروني: info@edu.sa</p>
                    <p>الهاتف: 0111234567</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>جميع الحقوق محفوظة © ${new Date().getFullYear()} - نظام إعداد التقارير الإلكتروني</p>
            </div>
        </div>
    </footer>

    <button class="print-btn" onclick="window.print()">
        <i class="fas fa-print"></i> طباعة التقرير
    </button>

    <script>
        // تنفيذ التنقل السلس
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if(targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if(targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // إضافة تأثيرات للعناصر عند التمرير
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // مراقبة العناصر لإضافة تأثيرات
        document.querySelectorAll('.info-card, .list-item, .gallery-item, .signature-box').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(el);
        });
    </script>
</body>
</html>`;
            }
            
            function generateReportNumber() {
                const prefix = 'REP';
                const year = new Date().getFullYear();
                const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
                const day = new Date().getDate().toString().padStart(2, '0');
                const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                return `${prefix}-${year}${month}${day}-${random}`;
            }
            
            function resetForm() {
                document.getElementById('programDate').value = '1447-06-12';
                document.getElementById('location').value = '';
                document.getElementById('target').value = '';
                document.getElementById('beneficiaries').value = '25';
                document.getElementById('description').value = '';
                document.getElementById('procedures').value = '';
                document.getElementById('results').value = '';
                document.getElementById('recommendations').value = '';
                
                uploadedImages = [];
                imagePreview.innerHTML = '';
                
                localStorage.removeItem('reportDraft');
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            
            function showLoading(text) {
                loadingText.textContent = text;
                loadingOverlay.classList.add('active');
            }
            
            function hideLoading() {
                loadingOverlay.classList.remove('active');
            }
            
            function showError(message) {
                alert(`❌ ${message}`);
            }
            
            function showSuccess(message) {
                alert(`✅ ${message}`);
            }
            
            function showExportSuccess() {
                successTitle.textContent = 'تم إنشاء التقرير بنجاح!';
                successDetails.textContent = `تم تصدير التقرير بصيغة HTML.\nرقم التقرير: ${currentReportData.reportNumber}`;
                successMessage.classList.add('active');
                
                setTimeout(() => {
                    if (confirm('هل تريد إعادة تعيين النموذج لبدء تقرير جديد؟')) {
                        successMessage.classList.remove('active');
                        resetForm();
                    }
                }, 5000);
            }
            
            setupEventListeners();
            loadInitialData();
            
            setInterval(() => {
                if (validateForm()) {
                    const reportData = collectReportData();
                    reportData.status = 'draft';
                    reportData.autoSaved = new Date().toLocaleTimeString('ar-SA');
                    localStorage.setItem('reportDraft', JSON.stringify(reportData));
                }
            }, 30000);
        });
    </script>
</body>
</html>