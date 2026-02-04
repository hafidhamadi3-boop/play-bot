// تهيئة Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

/**
 * دالة الانتقال السلس لقسم الألعاب
 */
function scrollToGames() {
    const gameList = document.getElementById('games-section'); // تأكد أن الـ ID مطابق لما في HTML
    if (gameList) {
        gameList.scrollIntoView({ behavior: 'smooth' });
        tg.HapticFeedback.impactOccurred('medium');
    }
}

/**
 * نظام تغيير اللغات العالمي
 * @param {string} lang - رمز اللغة المختارة (ar, en, etc.)
 */
function changeLanguage(lang) {
    if (typeof translations === 'undefined') {
        console.error("Translations file (languages.js) is not loaded!");
        return;
    }
    
    const data = translations[lang];
    if (!data) return;

    // تحديث اتجاه الصفحة ولغتها
    document.documentElement.dir = data.dir;
    document.documentElement.lang = lang;

    // ترجمة جميع العناصر التي تحمل الواسم [data-i18n]
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (data[key]) {
            element.innerText = data[key];
        }
    });

    // حفظ الخيار في المتصفح واهتزاز خفيف
    localStorage.setItem('preferredLang', lang);
    tg.HapticFeedback.impactOccurred('medium');
}

/**
 * وظائف القائمة الجانبية والدردشة
 */
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
        tg.HapticFeedback.impactOccurred('medium');
    }
}

function toggleChat() {
    const chat = document.getElementById('chat-window');
    if (chat) {
        chat.classList.toggle('active');
        tg.HapticFeedback.impactOccurred('light');
    }
}

/**
 * نظام جمع الأرباح مع تأثير العملات المتساقطة
 */
function claimRewards(e) {
    // تحديد إحداثيات الضغطة لتوليد العملات منها
    const x = e.clientX || window.innerWidth / 2;
    const y = e.clientY || window.innerHeight / 2;

    for (let i = 0; i < 15; i++) {
        createCoin(x, y);
    }
    
    tg.HapticFeedback.notificationOccurred('success');
    
    // رسالة نجاح مترجمة (اختيارية)
    const lang = localStorage.getItem('preferredLang') || 'ar';
    const alertMsg = lang === 'ar' ? "تمت إضافة الأرباح بنجاح! 💎" : "Success! Points added. 💎";
    tg.showAlert(alertMsg);
}

function createCoin(x, y) {
    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.innerHTML = '💎';
    
    // إضافة عشوائية بسيطة لمكان سقوط العملات
    const randomX = x + (Math.random() - 0.5) * 100;
    coin.style.left = randomX + 'px';
    coin.style.top = y + 'px';
    
    document.body.appendChild(coin);
    
    // حذف العنصر بعد انتهاء الأنيميشن
    setTimeout(() => coin.remove(), 1000);
}

/**
 * عرض فيديو ترويجي
 */
function playPromo() {
    const lang = localStorage.getItem('preferredLang') || 'ar';
    const confirmTitle = lang === 'ar' ? "شاهد فيديو للحصول على نقاط؟" : "Watch video for points?";
    
    tg.showConfirm(confirmTitle, (ok) => {
        if (ok) {
            tg.showAlert(lang === 'ar' ? "جاري تحميل الإعلان..." : "Loading Ad...");
            // هنا يربط كود Adsgram مستقبلاً
        }
    });
}

/**
 * تهيئة التطبيق عند تحميل الصفحة
 */
window.onload = () => {
    // استعادة اللغة المفضلة
    const savedLang = localStorage.getItem('preferredLang') || 'ar';
    const selector = document.getElementById('langSelector');
    
    if (selector) selector.value = savedLang;
    
    // تطبيق الترجمة فوراً
    if (typeof translations !== 'undefined') {
        changeLanguage(savedLang);
    }

    // عرض اسم المستخدم من تيليجرام في القائمة الجانبية
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const userNameField = document.getElementById('username_side');
        if (userNameField) {
            userNameField.innerText = tg.initDataUnsafe.user.first_name;
        }
    }
};

/**
 * تحديث شريط النشاط المباشر بشكل دوري
 */
setInterval(() => {
    const lang = localStorage.getItem('preferredLang') || 'ar';
    const data = translations[lang] || {};
    
    const usersCount = Math.floor(Math.random() * 1000 + 4000);
    const miningAmount = (Math.random() * 20).toFixed(1);
    
    const activeText = data.live_active || "مستخدم نشط الآن";
    const miningText = data.live_mining || "جاري تعدين XPC الآن...";
    
    const activityBar = document.getElementById('live-activity');
    if (activityBar) {
        activityBar.innerText = `👤 ${usersCount.toLocaleString()} ${activeText} | ⛏️ ${miningAmount} ${miningText}`;
    }
}, 5000);
