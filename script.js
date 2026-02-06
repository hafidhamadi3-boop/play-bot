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

// --- إعدادات الإدارة (Admin Settings) ---
const ADMIN_ID = 1954301817; 

/**
 * دالة التحقق من المالك وإظهار أدوات التحكم
 * تم تحسينها لتظهر الزر بناءً على المعرف الصريح
 */
/**
 * نظام الإدارة المطور - XPay
 */

function checkAdminPrivileges() {
    const userId = tg.initDataUnsafe?.user?.id;
    // استخدام includes لضمان عمل الهاش حتى لو تغير الرابط قليلاً
    const isAdmin = (userId === ADMIN_ID || window.location.hash.includes("admin"));
    
    if (isAdmin) {
        console.log("Admin Verified ✅");
        
        const addBtn = document.getElementById('admin-add-post');
        if (addBtn) {
            addBtn.style.setProperty('display', 'block', 'important');
        }

        // إظهار عناصر التحكم في المنشورات الموجودة فعلياً
        document.querySelectorAll('.admin-controls').forEach(el => {
            el.style.setProperty('display', 'flex', 'important');
        });
    }
}

function openPostModal() {
    // استخدام تأكيد من تليجرام بدلاً من البرومبت البسيط أحياناً يكون أفضل، 
    // لكن سنبقي على طلباتك مع إضافة صمام أمان
    const title = prompt("عنوان الخبر:");
    const excerpt = prompt("وصف مختصر:");
    const imageURL = prompt("رابط الصورة المباشر:", "https://");

    if (title && excerpt && imageURL) {
        // نستخدم المرجع المباشر للتأكد
        const postsRef = firebase.database().ref('posts'); 
        postsRef.push({
            title: title,
            excerpt: excerpt,
            image: imageURL,
            timestamp: Date.now(),
            admin_id: ADMIN_ID,
            tag: "NEWS"
        }).then(() => {
            tg.showAlert("تم النشر في مجتمع XPay بنجاح! 🚀");
        }).catch((err) => {
            alert("فشل النشر: " + err.message);
        });
    }
}

function loadPosts() {
    const postsContainer = document.getElementById('news-feed');
    if (!postsContainer) return;

    db.ref('posts').orderByChild('timestamp').on('value', (snapshot) => {
        postsContainer.innerHTML = ''; 
        snapshot.forEach((childSnapshot) => {
            const post = childSnapshot.val();
            const postId = childSnapshot.key;
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
        // استدعاء التحقق هنا داخل المستمع لضمان ظهور الزر بعد التحميل
        checkAdminPrivileges();
    });
}

/**
 * وظيفة التعديل الجديدة
 */
function editPost(postId) {
    db.ref('posts/' + postId).once('value').then((snapshot) => {
        const post = snapshot.val();
        const newTitle = prompt("تعديل العنوان:", post.title);
        const newExcerpt = prompt("تعديل الوصف:", post.excerpt);
        const newImage = prompt("تعديل رابط الصورة:", post.image);

        if (newTitle && newExcerpt && newImage) {
            db.ref('posts/' + postId).update({
                title: newTitle,
                excerpt: newExcerpt,
                image: newImage
            }).then(() => {
                tg.showAlert("تم تحديث المنشور بنجاح! ✨");
            });
        }
    });
}

/**
 * حذف المنشور
 */
function deletePost(btn, postId) {
    tg.showConfirm("هل أنت متأكد من حذف هذا المنشور نهائياً؟", (ok) => {
        if (ok) {
            db.ref('posts/' + postId).remove().then(() => {
                tg.HapticFeedback.notificationOccurred('success');
            });
            const card = btn.closest('.post-card');
            if (card) {
                card.style.opacity = '0';
                setTimeout(() => card.remove(), 300);
            }
        }
    });
}

/**
 * نظام التفاعلات
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
 * تجميع الأرباح
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
 * القائمة الجانبية
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
 * التشغيل النهائي
 */
window.onload = () => {
    const savedLang = localStorage.getItem('preferredLang') || 'ar';
    changeLanguage(savedLang);

    loadPosts(); 
    if (typeof loadMessages === 'function') loadMessages();
    checkAdminPrivileges();

    if (tg.initDataUnsafe?.user) {
        const userField = document.getElementById('username_side');
        if (userField) userField.innerText = tg.initDataUnsafe.user.first_name;
    }
};

/**
 * شريط النشاط
 */
setInterval(() => {
    const activityBar = document.getElementById('live-activity');
    if (activityBar) {
        const users = Math.floor(Math.random() * 500 + 4000).toLocaleString();
        const mining = (Math.random() * 15).toFixed(1);
        activityBar.innerText = `👤 ${users} مستخدم نشط | ⛏️ تعدين ${mining} XPC...`;
    }
}, 5000);
