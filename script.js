/**
 * X-PAY Main Engine 🚀 - User Version
 */

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
const storage = firebase.storage(); 

// تهيئة Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// معرف الإدارة (لأغراض التحقق البصري فقط هنا)
const ADMIN_ID = 1954301817; 

/**
 * نظام جلب وعرض المنشورات للمستخدمين
 */
function loadPosts() {
    const postsContainer = document.getElementById('news-feed');
    if (!postsContainer) return;

    db.ref('posts').orderByChild('timestamp').on('value', (snapshot) => {
        postsContainer.innerHTML = ''; 
        snapshot.forEach((childSnapshot) => {
            const post = childSnapshot.val();
            const postId = childSnapshot.key;
            
            // التحقق إذا كان المستخدم الحالي هو المدير لإظهار أزرار التحكم (يتم تفعيلها برمجياً أيضاً من admin.js)
            const isAdmin = (tg.initDataUnsafe?.user?.id === ADMIN_ID || window.location.hash.includes("admin"));

            const postHTML = `
                <div class="post-card" id="post-${postId}">
                    <img src="${post.image || 'https://via.placeholder.com/300'}" class="post-img">
                    <div class="post-content">
                        <span class="post-tag">${post.tag || 'NEWS'}</span>
                        <h3 class="post-title">${post.title}</h3>
                        <p class="post-excerpt">${post.excerpt}</p>
                        <div class="post-footer">
                            <button class="react-btn" onclick="handleReaction('like', this)">
                                👍 <span class="reaction-count">0</span>
                            </button>
                            <div class="admin-controls" style="display: ${isAdmin ? 'flex' : 'none'};">
                                <button class="admin-btn edit" onclick="editPost('${postId}')">📝</button>
                                <button class="admin-btn delete" onclick="deletePost(this, '${postId}')">🗑️</button>
                            </div>                                               
                        </div>
                    </div>
                </div>`;
            postsContainer.insertAdjacentHTML('afterbegin', postHTML);
        });
        
        // استدعاء التحقق من الإدارة من ملف admin.js إذا كان موجوداً
        if (typeof checkAdminPrivileges === 'function') {
            checkAdminPrivileges();
        }
    });
}

/**
 * نظام التفاعلات (الإعجابات)
 */
function handleReaction(type, btn) {
    tg.HapticFeedback.impactOccurred('light');
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
 * نظام تجميع الأرباح (Coins Effect)
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
 * التحكم في الواجهة (القائمة والدردشة)
 */
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
        const isActive = sidebar.classList.contains('active');
        document.body.style.overflow = isActive ? 'hidden' : '';
        tg.HapticFeedback.impactOccurred('medium');
    }
}

function toggleChat() {
    const chat = document.getElementById('chat-window');
    if (chat) {
        chat.classList.toggle('active');
        document.body.style.overflow = chat.classList.contains('active') ? 'hidden' : '';
        tg.HapticFeedback.impactOccurred('light');
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
 * التشغيل النهائي عند تحميل الصفحة
 */
window.onload = () => {
    const savedLang = localStorage.getItem('preferredLang') || 'ar';
    changeLanguage(savedLang);

    loadPosts(); 
    if (typeof loadMessages === 'function') loadMessages();

    if (tg.initDataUnsafe?.user) {
        const userField = document.getElementById('username_side');
        if (userField) userField.innerText = tg.initDataUnsafe.user.first_name;
    }
};

/**
 * تحديث شريط النشاط المباشر
 */
setInterval(() => {
    const activityBar = document.getElementById('live-activity');
    if (activityBar) {
        const users = Math.floor(Math.random() * 500 + 4000).toLocaleString();
        const mining = (Math.random() * 15).toFixed(1);
        activityBar.innerText = `👤 ${users} مستخدم نشط | ⛏️ تعدين ${mining} XPC...`;
    }
}, 5000);
