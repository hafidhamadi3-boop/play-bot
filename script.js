// تهيئة Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// --- إعدادات الإدارة (Admin Settings) ---
// استبدل 123456789 برقم الـ ID الخاص بك (يمكنك الحصول عليه من بوت @userinfobot)
const ADMIN_ID = 1954301817; 

/**
 * دالة التحقق من المالك وإظهار أدوات التحكم
 */
function checkAdminPrivileges() {
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const userId = tg.initDataUnsafe.user.id;

        if (userId === ADMIN_ID) {
            console.log("Admin Access Granted");
            // إظهار أزرار التحكم (تعديل وحذف)
            document.querySelectorAll('.admin-controls').forEach(el => {
                el.style.display = 'flex';
            });
            // إظهار زر إضافة منشور جديد
            const addBtn = document.querySelector('.admin-add-post');
            if (addBtn) addBtn.style.display = 'block';
        }
    }
}

/**
 * وظائف الإدارة
 */
function deletePost(btn) {
    tg.showConfirm("هل أنت متأكد من حذف هذا المنشور؟", (ok) => {
        if (ok) {
            const card = btn.closest('.post-card');
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            setTimeout(() => {
                card.remove();
                tg.HapticFeedback.notificationOccurred('success');
            }, 300);
        }
    });
}

function editPost(btn) {
    tg.showAlert("سيتم فتح محرر المنشورات في التحديث القادم!");
}

/**
 * دالة الانتقال السلس لقسم الألعاب
 */
function scrollToGames() {
    const gameList = document.getElementById('games-section');
    if (gameList) {
        gameList.scrollIntoView({ behavior: 'smooth' });
        tg.HapticFeedback.impactOccurred('medium');
    }
}

/**
 * نظام تغيير اللغات العالمي
 */
function changeLanguage(lang) {
    if (typeof translations === 'undefined') {
        console.error("Translations file (languages.js) is not loaded!");
        return;
    }
    
    const data = translations[lang];
    if (!data) return;

    document.documentElement.dir = data.dir;
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (data[key]) {
            element.innerText = data[key];
        }
    });

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
    const x = e.clientX || window.innerWidth / 2;
    const y = e.clientY || window.innerHeight / 2;

    for (let i = 0; i < 15; i++) {
        createCoin(x, y);
    }
    
    tg.HapticFeedback.notificationOccurred('success');
    
    const lang = localStorage.getItem('preferredLang') || 'ar';
    const alertMsg = lang === 'ar' ? "تمت إضافة الأرباح بنجاح! 💎" : "Success! Points added. 💎";
    tg.showAlert(alertMsg);
}

function createCoin(x, y) {
    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.innerHTML = '💎';
    
    const randomX = x + (Math.random() - 0.5) * 100;
    coin.style.left = randomX + 'px';
    coin.style.top = y + 'px';
    
    document.body.appendChild(coin);
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
        }
    });
}

/**
 * تهيئة التطبيق عند تحميل الصفحة
 */
window.onload = () => {
    const savedLang = localStorage.getItem('preferredLang') || 'ar';
    const selector = document.getElementById('langSelector');
    
    if (selector) selector.value = savedLang;
    
    if (typeof translations !== 'undefined') {
        changeLanguage(savedLang);
    }

    // فحص صلاحيات الإدارة
    checkAdminPrivileges();

    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const userNameField = document.getElementById('username_side');
        if (userNameField) {
            userNameField.innerText = tg.initDataUnsafe.user.first_name;
        }
    }
};

/**
 * تحديث شريط النشاط المباشر
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
