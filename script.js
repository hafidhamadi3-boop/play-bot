// 1. إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC1Tb7gOIaRhp5Nw1GShKA-TptvOTUhiOU",
  authDomain: "xpayproject-28e43.firebaseapp.com",
  projectId: "xpayproject-28e43",
  storageBucket: "xpayproject-28e43.firebasestorage.app",
  messagingSenderId: "616308617423",
  appId: "1:616308617423:web:615d5ebe44bb66157c87ba",
  measurementId: "G-7ZHZDHX2NW",
  databaseURL: "https://xpayproject-28e43-default-rtdb.firebaseio.com"
};

// 2. تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// تهيئة Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// --- إعدادات الإدارة (Admin Settings) ---
const ADMIN_ID = 1954301817; 

/**
 * دالة التحقق من المالك وإظهار أدوات التحكم
 */
function checkAdminPrivileges() {
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const userId = tg.initDataUnsafe.user.id;
        if (userId === ADMIN_ID) {
            console.log("Admin Access Granted");
            // إظهار أزرار التحكم في المنشورات الموجودة حالياً
            document.querySelectorAll('.admin-controls').forEach(el => el.style.display = 'flex');
            // إظهار زر إضافة منشور جديد (باستخدام الـ ID الصحيح)
            const addBtn = document.getElementById('admin-add-post');
            if (addBtn) addBtn.style.display = 'block';
        }
    }
}

/**
 * فتح نافذة إضافة منشور (إضافة ذكية لـ Firebase)
 */
function openPostModal() {
    const title = prompt("عنوان المنشور:");
    const excerpt = prompt("وصف قصير:");
    if (title && excerpt) {
        const newPostRef = db.ref('posts').push();
        newPostRef.set({
            title: title,
            excerpt: excerpt,
            timestamp: Date.now(),
            likes: 0,
            loves: 0
        }).then(() => {
            tg.showAlert("تم النشر بنجاح! 🚀");
        });
    }
}

/**
 * حذف المنشور من الواجهة ومن Firebase
 */
function deletePost(btn, postId) {
    tg.showConfirm("هل أنت متأكد من حذف هذا المنشور نهائياً؟", (ok) => {
        if (ok) {
            // حذف من Firebase
            if (postId) db.ref('posts/' + postId).remove();

            // تأثير بصري للحذف
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
    tg.showAlert("خاصية التعديل ستتوفر في التحديث القادم!");
}

/**
 * نظام التفاعلات (Reactions) المطور
 */
function handleReaction(type, btn) {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    
    const countSpan = btn.querySelector('.reaction-count');
    if (countSpan) {
        let currentCount = parseInt(countSpan.innerText) || 0;
        
        if (btn.classList.contains('active')) {
            countSpan.innerText = currentCount - 1;
            btn.classList.remove('active');
            btn.style.color = ""; 
        } else {
            countSpan.innerText = currentCount + 1;
            btn.classList.add('active');
            btn.style.color = "var(--accent)"; 
        }
    }
}

/**
 * نظام جمع الأرباح (تأثير العملات)
 */
function claimRewards(e) {
    const x = e.clientX || window.innerWidth / 2;
    const y = e.clientY || window.innerHeight / 2;
    for (let i = 0; i < 15; i++) createCoin(x, y);
    
    tg.HapticFeedback.notificationOccurred('success');
    tg.showAlert("تمت إضافة الأرباح بنجاح! 💎");
}

function createCoin(x, y) {
    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.innerHTML = '💎';
    coin.style.left = (x + (Math.random() - 0.5) * 100) + 'px';
    coin.style.top = y + 'px';
    document.body.appendChild(coin);
    setTimeout(() => coin.remove(), 1000);
}

/**
 * القوائم والدردشة والتنقل
 */
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
        
        // منع التمرير في الصفحة الرئيسية عند فتح القائمة الجانبية
        if (sidebar.classList.contains('active')) {
            document.body.style.overflow = 'hidden'; // قفل التمرير
            document.body.style.touchAction = 'none'; // منع السحب في الخلفية
        } else {
            document.body.style.overflow = ''; // إعادة التمرير الطبيعي
            document.body.style.touchAction = ''; 
        }
        
        // اهتزاز الموبايل عند الفتح/الإغلاق
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }
    }
}

function toggleChat() {
    const chat = document.getElementById('chat-window');
    if (chat) {
        chat.classList.toggle('active');
        
        // اختيارياً: يمكنك قفل التمرير هنا أيضاً إذا كانت الدردشة لا تغطي الشاشة كاملة
        if (chat.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
}

function scrollToGames() {
    const section = document.getElementById('games-section');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        tg.HapticFeedback.impactOccurred('medium');
    }
}

/**
 * نظام اللغات
 */
function changeLanguage(lang) {
    if (typeof translations === 'undefined') return;
    const data = translations[lang];
    if (!data) return;

    document.documentElement.dir = data.dir || 'rtl';
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (data[key]) el.innerText = data[key];
    });

    localStorage.setItem('preferredLang', lang);
}

/**
 * تهيئة التطبيق عند التشغيل
 */
window.onload = () => {
    const savedLang = localStorage.getItem('preferredLang') || 'ar';
    const selector = document.getElementById('langSelector');
    if (selector) selector.value = savedLang;
    changeLanguage(savedLang);

    checkAdminPrivileges();

    // عرض اسم المستخدم من تليجرام
    if (tg.initDataUnsafe?.user) {
        const userField = document.getElementById('username_side');
        if (userField) userField.innerText = tg.initDataUnsafe.user.first_name;
    }
};

/**
 * شريط النشاط المباشر
 */
setInterval(() => {
    const activityBar = document.getElementById('live-activity');
    if (activityBar) {
        const users = Math.floor(Math.random() * 500 + 4000).toLocaleString();
        const mining = (Math.random() * 15).toFixed(1);
        activityBar.innerText = `👤 ${users} مستخدم نشط | ⛏️ تعدين ${mining} XPC...`;
    }
}, 5000);
