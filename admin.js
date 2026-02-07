/**
 * X-PAY Admin Panel Module 🛠️
 * المسؤول عن: النشر، التعديل، الحذف، وإدارة شريط الأخبار
 */

// 1. التحقق الذكي من الإدارة
function checkAdminPrivileges() {
    const userId = tg.initDataUnsafe?.user?.id;
    const isAdmin = (userId === ADMIN_ID || window.location.hash.includes("admin"));
    
    if (isAdmin) {
        console.log("Admin Mode Active ✅");
        
        // إظهار زر النشر الرئيسي
        const addBtn = document.getElementById('admin-add-post');
        if (addBtn) addBtn.style.display = 'flex';

        // إظهار أزرار التحكم في كل منشور
        document.querySelectorAll('.admin-controls').forEach(el => {
            el.style.display = 'flex';
        });
    }
}

// 2. دالة النشر (أخبار أو أحداث)
function openPostModal() {
    const type = confirm("اضغط OK لنشر (خبر NEWS) أو Cancel لنشر (حدث EVENT)") ? "NEWS" : "EVENT";
    const title = prompt("العنوان:");
    const excerpt = prompt("الوصف المختصر:");
    const imageURL = prompt("رابط الصورة المباشر:", "https://");

    if (title && excerpt && imageURL) {
        db.ref('posts').push({
            title,
            excerpt,
            image: imageURL,
            timestamp: Date.now(),
            admin_id: ADMIN_ID,
            tag: type
        }).then(() => {
            tg.showAlert("تم النشر بنجاح! 🚀");
        }).catch(err => {
            tg.showAlert("خطأ في النشر: " + err.message);
        });
    }
}

// 3. دالة تعديل منشور موجود
function editPost(postId) {
    db.ref('posts/' + postId).once('value').then((snapshot) => {
        const post = snapshot.val();
        if (!post) return;

        const newTitle = prompt("تعديل العنوان:", post.title);
        const newExcerpt = prompt("تعديل الوصف:", post.excerpt);
        const newImage = prompt("تعديل رابط الصورة:", post.image);

        if (newTitle && newExcerpt && newImage) {
            db.ref('posts/' + postId).update({
                title: newTitle,
                excerpt: newExcerpt,
                image: newImage
            }).then(() => {
                tg.showAlert("تم التحديث بنجاح! ✨");
            });
        }
    });
}

// 4. دالة الحذف النهائي
function deletePost(btn, postId) {
    tg.showConfirm("هل أنت متأكد من حذف هذا المنشور نهائياً؟", (ok) => {
        if (ok) {
            db.ref('posts/' + postId).remove().then(() => {
                tg.HapticFeedback.notificationOccurred('success');
                // حذف الكارت من الواجهة فوراً
                const card = btn.closest('.post-card');
                if (card) card.remove();
            });
        }
    });
}

// 5. تعديل شريط الأخبار المتحرك (Ticker)
function updateTicker() {
    const newText = prompt("أدخل نص شريط الأخبار الجديد:");
    if (newText) {
        db.ref('settings/ticker').set(newText).then(() => {
            tg.showAlert("تم تحديث الشريط! 🔥");
        });
    }
}

// 6. استلام تحديثات شريط الأخبار فورياً
db.ref('settings/ticker').on('value', (snapshot) => {
    const tickerText = document.getElementById('ticker-text');
    if (tickerText && snapshot.val()) {
        tickerText.innerText = snapshot.val();
    }
});

/**
 * مراقب التغييرات (MutationObserver)
 * وظيفته: مراقبة صفحة الأخبار، وإذا ظهر منشور جديد، يقوم فوراً بإظهار أزرار الحذف والتعديل لك
 */
const observer = new MutationObserver(() => {
    checkAdminPrivileges();
});

observer.observe(document.body, { childList: true, subtree: true });

// التحقق عند التحميل لأول مرة
window.addEventListener('load', checkAdminPrivileges);
