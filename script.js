// 1. إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC1Tb7gOIaRhp5Nw1GShKA-TptvOTUhiOU",
  authDomain: "xpayproject-28e43.firebaseapp.com",
  projectId: "xpayproject-28e43",
  storageBucket: "xpayproject-28e43.firebasestorage.app", // تم التأكد من اسم السلة للرفع
  messagingSenderId: "616308617423",
  appId: "1:616308617423:web:615d5ebe44bb66157c87ba",
  measurementId: "G-7ZHZDHX2NW",
  databaseURL: "https://xpayproject-28e43-default-rtdb.firebaseio.com"
};

// 2. تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage(); // تهيئة خدمة رفع الملفات

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
            document.querySelectorAll('.admin-controls').forEach(el => el.style.display = 'flex');
            const addBtn = document.getElementById('admin-add-post');
            if (addBtn) addBtn.style.display = 'block';
        }
    }
}

/**
 * فتح نافذة إضافة منشور مع دعم رفع الملفات (صور/فيديو)
 */
function openPostModal() {
    const title = prompt("عنوان الخبر:");
    const excerpt = prompt("وصف مختصر:");
    const imageURL = prompt("ضع رابط الصورة المباشر هنا (مثل رابط من imgbb أو postimages):", "https://");

    // التحقق من أن جميع الحقول ممتلئة
    if (title && excerpt && imageURL) {
        // الإشارة لمجلد المنشورات في قاعدة البيانات
        const postsRef = db.ref('posts'); 
        
        postsRef.push({
            title: title,
            excerpt: excerpt,
            image: imageURL,
            timestamp: Date.now(),
            admin_id: ADMIN_ID,
            tag: "NEWS" // يمكنك تغييرها يدوياً أو تركها هكذا
        }).then(() => {
            tg.showAlert("تم النشر بنجاح! سيظهر الخبر للجميع الآن. ✅");
        }).catch((error) => {
            console.error("Firebase Error:", error);
            tg.showAlert("حدث خطأ أثناء الاتصال بقاعدة البيانات.");
        });
    } else {
        tg.showAlert("يرجى ملء جميع الحقول للنشر.");
    }
}

/**
 * دالة جلب المنشورات من Firebase وعرضها ديناميكياً
 */
function loadPosts() {
    const postsContainer = document.getElementById('news-feed');
    if (!postsContainer) return;

    // استخدام المستمع المستمر .on لضمان التحديث التلقائي فور النشر
    db.ref('posts').orderByChild('timestamp').on('value', (snapshot) => {
        postsContainer.innerHTML = ''; 
        
        snapshot.forEach((childSnapshot) => {
            const post = childSnapshot.val();
            const postId = childSnapshot.key;

            // تحديد ما إذا كان الملف فيديو أم صورة لعرضه بشكل صحيح
            const mediaHTML = post.fileType && post.fileType.includes('video') 
                ? `<video src="${post.image}" controls class="post-img" style="max-height:300px; background:#000;"></video>` 
                : `<img src="${post.image || 'https://via.placeholder.com/300'}" class="post-img">`;

            const postHTML = `
                <div class="post-card" id="post-${postId}">
                    ${mediaHTML}
                    <div class="post-content">
                        <span class="post-tag">${post.tag || 'NEWS'}</span>
                        <h3 class="post-title">${post.title}</h3>
                        <p class="post-excerpt">${post.excerpt}</p>
                        <div class="post-footer">
                            <button class="react-btn" onclick="handleReaction('like', this)">
                                👍 <span class="reaction-count">0</span>
                            </button>
                            ${tg.initDataUnsafe?.user?.id === ADMIN_ID ? `
                                <div class="admin-controls" style="display:flex;">
                                    <button class="admin-btn delete" onclick="deletePost(this, '${postId}')">🗑️ حذف</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            postsContainer.insertAdjacentHTML('afterbegin', postHTML);
        });
    });
}

/**
 * حذف المنشور من الواجهة ومن Firebase مع حذف الملف من التخزين اختياريًا
 */
function deletePost(btn, postId) {
    tg.showConfirm("هل أنت متأكد من حذف هذا المنشور نهائياً؟", (ok) => {
        if (ok) {
            db.ref('posts/' + postId).remove().then(() => {
                tg.HapticFeedback.notificationOccurred('success');
            });
            const card = btn.closest('.post-card');
            card.style.opacity = '0';
            setTimeout(() => card.remove(), 300);
        }
    });
}

/**
 * نظام التفاعلات (Reactions)
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
 * تأثير العملات وتجميع الأرباح
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
 * التحكم بالقائمة الجانبية ومنع تمرير الخلفية
 */
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
        const isActive = sidebar.classList.contains('active');
        document.body.style.overflow = isActive ? 'hidden' : '';
        document.body.style.touchAction = isActive ? 'none' : '';
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
 * نظام اللغات والترجمة
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
 * تهيئة التطبيق
 */
window.onload = () => {
    const savedLang = localStorage.getItem('preferredLang') || 'ar';
    const selector = document.getElementById('langSelector');
    if (selector) selector.value = savedLang;
    changeLanguage(savedLang);

    checkAdminPrivileges();
    loadPosts(); // بدء جلب البيانات من Firebase

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
