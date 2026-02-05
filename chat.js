/**
 * X-PAY Messenger Engine 🚀
 * النسخة الاحترافية (فقاعات، ردود، تفاعلات)
 */

// متغير عالمي لتخزين معرف الرسالة التي يتم الرد عليها
window.currentReplyId = null;

// 1. نظام إرسال الرسائل (يدعم الرد)
function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const user = tg.initDataUnsafe?.user || { first_name: "مستخدم X", id: 0 };

    if (text !== "") {
        const newMessageRef = db.ref('messages').push();
        newMessageRef.set({
            userId: user.id,
            username: user.first_name,
            text: text,
            timestamp: Date.now(),
            replyTo: window.currentReplyId || null, // تخزين معرف الرد إن وجد
            reactions: {}
        }).then(() => {
            input.value = "";
            cancelReply(); // إلغاء وضع الرد بعد الإرسال
            tg.HapticFeedback.notificationOccurred('success');
        });
    }
}

// 2. نظام جلب وعرض الرسائل (Messenger Style)
function loadMessages() {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;

    db.ref('messages').limitToLast(40).on('value', (snapshot) => {
        chatContainer.innerHTML = "";
        
        snapshot.forEach((child) => {
            const msg = child.val();
            const msgId = child.key;
            const isMe = msg.userId === (tg.initDataUnsafe?.user?.id || 0);
            
            // حساب تدرج لوني متغير طفيف لكل رسالة
            const hueShift = (msg.timestamp % 25); 

            const msgHTML = `
                <div class="message ${isMe ? 'sent' : 'received'}" id="msg-${msgId}">
                    ${!isMe ? `<small class="msg-author">${msg.username}</small>` : ''}
                    
                    <div class="msg-bubble" 
                         style="${isMe ? `filter: hue-rotate(${hueShift}deg);` : ''}"
                         onclick="showReactionMenu('${msgId}')"
                         oncontextmenu="event.preventDefault(); prepareReply('${msgId}', '${msg.username}', '${msg.text}')">
                        
                        ${msg.replyTo ? `<div class="reply-preview">💬 رداً على رسالة سابقة</div>` : ''}
                        <div class="msg-text">${msg.text}</div>
                    </div>

                    ${msg.reactions ? renderReactions(msg.reactions) : ''}
                </div>
            `;
            chatContainer.insertAdjacentHTML('beforeend', msgHTML);
        });
        
        // التمرير التلقائي لآخر رسالة بسلاسة
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
    });
}

// 3. نظام التفاعلات (أيقونات متعددة)
function showReactionMenu(msgId) {
    // تفاعل سريع عند الضغط (إعجاب)
    addReaction(msgId, '❤️');
    tg.HapticFeedback.impactOccurred('light');
}

function addReaction(msgId, emoji) {
    const userId = tg.initDataUnsafe?.user?.id || 0;
    db.ref(`messages/${msgId}/reactions/${userId}`).set(emoji);
}

function renderReactions(reactions) {
    // عرض فريد للايموجيات المستخدمة
    const uniqueEmojis = [...new Set(Object.values(reactions))].slice(0, 3).join('');
    return `<div class="msg-reactions">${uniqueEmojis}</div>`;
}

// 4. نظام الرد (Swipe/Context)
function prepareReply(msgId, username, text) {
    window.currentReplyId = msgId;
    tg.HapticFeedback.impactOccurred('medium');
    
    // إظهار تنبيه بسيط للمستخدم بأنه بصدد الرد
    const input = document.getElementById('chat-input');
    input.placeholder = `الرد على ${username}...`;
    input.focus();
    
    // إضافة زر إلغاء الرد في الواجهة إذا أردت (اختياري)
    tg.showAlert(`أنت الآن ترد على: ${username}`);
}

function cancelReply() {
    window.currentReplyId = null;
    const input = document.getElementById('chat-input');
    if(input) input.placeholder = "...";
}

// 5. ربط ضغطة زر الـ Enter للإرسال
document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// تشغيل النظام
document.addEventListener('DOMContentLoaded', loadMessages);
