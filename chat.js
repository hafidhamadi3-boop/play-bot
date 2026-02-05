/**
 * X-PAY Messenger Engine 🚀 - Fixed Version
 */

// 1. صمام الأمان: التأكد من أن قاعدة البيانات معرفة
// إذا كان الملف الرئيسي لم يمرر db، سنحاول جلبه من نافذة المتصفح
const _db = window.db || (typeof firebase !== 'undefined' ? firebase.database() : null);

window.currentReplyId = null;

// 2. نظام إرسال الرسائل (مع معالجة الأخطاء)
function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user || { first_name: "مستخدم X", id: 0 };

    if (text === "") return;

    if (!_db) {
        alert("خطأ: لم يتم الاتصال بقاعدة البيانات. تأكد من إعدادات Firebase.");
        return;
    }

    // إشارة بصرية للمستخدم (اختياري)
    const sendBtn = document.querySelector('button[onclick="sendMessage()"]');
    if(sendBtn) sendBtn.style.opacity = "0.5";

    const newMessageRef = _db.ref('messages').push();
    newMessageRef.set({
        userId: user.id,
        username: user.first_name,
        text: text,
        timestamp: Date.now(),
        replyTo: window.currentReplyId || null,
        reactions: {}
    }).then(() => {
        input.value = "";
        cancelReply();
        window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
        if(sendBtn) sendBtn.style.opacity = "1";
    }).catch((error) => {
        console.error("Firebase Send Error:", error);
        alert("فشل الإرسال: " + error.message);
        if(sendBtn) sendBtn.style.opacity = "1";
    });
}

// 3. نظام جلب الرسائل
function loadMessages() {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer || !_db) return;

    _db.ref('messages').limitToLast(40).on('value', (snapshot) => {
        chatContainer.innerHTML = "";
        
        snapshot.forEach((child) => {
            const msg = child.val();
            const msgId = child.key;
            const isMe = msg.userId === (window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 0);
            
            const hueShift = (msg.timestamp % 25); 

            const msgHTML = `
                <div class="message ${isMe ? 'sent' : 'received'}" id="msg-${msgId}">
                    ${!isMe ? `<small class="msg-author">${msg.username}</small>` : ''}
                    <div class="msg-bubble" 
                         style="${isMe ? `filter: hue-rotate(${hueShift}deg);` : ''}"
                         onclick="addReaction('${msgId}', '❤️')"
                         oncontextmenu="event.preventDefault(); prepareReply('${msgId}', '${msg.username}', '${msg.text}')">
                        ${msg.replyTo ? `<div class="reply-preview">💬 رداً على رسالة سابقة</div>` : ''}
                        <div class="msg-text">${msg.text}</div>
                    </div>
                    <div class="msg-reactions">
                        ${msg.reactions ? renderReactions(msg.reactions) : ''}
                    </div>
                </div>
            `;
            chatContainer.insertAdjacentHTML('beforeend', msgHTML);
        });
        
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
    }, (error) => {
        console.error("Firebase Read Error:", error);
    });
}

// 4. الدوال المساعدة (تفاعلات وردود)
function addReaction(msgId, emoji) {
    if (!_db) return;
    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 0;
    _db.ref(`messages/${msgId}/reactions/${userId}`).set(emoji);
    window.Telegram?.WebApp?.HapticFeedback.impactOccurred('light');
}

function renderReactions(reactions) {
    const uniqueEmojis = [...new Set(Object.values(reactions))].slice(0, 3).join('');
    return uniqueEmojis;
}

function prepareReply(msgId, username, text) {
    window.currentReplyId = msgId;
    const input = document.getElementById('chat-input');
    if(input) {
        input.placeholder = `الرد على ${username}...`;
        input.focus();
    }
}

function cancelReply() {
    window.currentReplyId = null;
    const input = document.getElementById('chat-input');
    if(input) input.placeholder = "...";
}

// 5. التشغيل
document.addEventListener('DOMContentLoaded', () => {
    // ننتظر قليلاً للتأكد من تحميل Firebase في الملف الرئيسي
    setTimeout(loadMessages, 1000);
});
