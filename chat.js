/**
 * X-PAY Messenger Engine 🚀 - Pro Max Version
 */

const _db = window.db || (typeof firebase !== 'undefined' ? firebase.database() : null);
window.currentReplyId = null;

// --- 1. نظام إرسال الرسائل ---
function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user || { first_name: "مستخدم X", id: 0 };

    if (text === "" || !_db) return;

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
    });
}

// --- 2. نظام جلب الرسائل وعرضها ---
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
                <div class="message ${isMe ? 'sent' : 'received'}" id="msg-${msgId}" 
                     ontouchstart="handleTouchStart(event, '${msgId}', '${msg.username}')" 
                     ontouchmove="handleTouchMove(event, this)" 
                     ontouchend="handleTouchEnd(this, '${msgId}', '${msg.username}', '${msg.text}')">
                    ${!isMe ? `<small class="msg-author">${msg.username}</small>` : ''}
                    <div class="msg-bubble" style="${isMe ? `filter: hue-rotate(${hueShift}deg);` : ''}">
                        ${msg.replyTo ? `<div class="reply-preview-in-chat">💬 رد على رسالة</div>` : ''}
                        <div class="msg-text">${msg.text}</div>
                    </div>
                    <div class="msg-reactions" id="react-container-${msgId}">
                        ${msg.reactions ? renderReactions(msg.reactions) : ''}
                    </div>
                </div>
            `;
            chatContainer.insertAdjacentHTML('beforeend', msgHTML);
        });
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
    });
}

// --- 3. التعامل مع اللمس (الضغط المطول والسحب للرد) ---
let touchStartX = 0;
let touchTimer = null;

function handleTouchStart(e, msgId, username) {
    touchStartX = e.touches[0].clientX;
    // الضغط المطول (نصف ثانية) لإظهار الايموجيات
    touchTimer = setTimeout(() => {
        showEmojiPicker(msgId);
        window.Telegram?.WebApp?.HapticFeedback.impactOccurred('heavy');
    }, 500);
}

function handleTouchMove(e, element) {
    let moveX = e.touches[0].clientX - touchStartX;
    if (moveX > 50) { // سحب لليمين
        element.style.transform = `translateX(${Math.min(moveX, 100)}px)`;
        clearTimeout(touchTimer); // إلغاء الضغط المطول إذا كان يسحب
    }
}

function handleTouchEnd(element, msgId, username, text) {
    let finalMoveX = parseInt(element.style.transform.replace('translateX(', '') || 0);
    element.style.transform = 'translateX(0)';
    clearTimeout(touchTimer);

    if (finalMoveX > 60) {
        prepareReply(msgId, username, text);
    }
}

// --- 4. نظام التفاعلات والردود ---
function showEmojiPicker(msgId) {
    const emojis = ['❤️', '🔥', '👍', '😂', '😮', '😢'];
    const picker = document.createElement('div');
    picker.className = 'emoji-picker-popup';
    emojis.forEach(emoji => {
        const span = document.createElement('span');
        span.innerText = emoji;
        span.onclick = () => {
            addReaction(msgId, emoji);
            picker.remove();
        };
        picker.appendChild(span);
    });
    document.body.appendChild(picker);
    
    // إغلاق عند الضغط في أي مكان آخر
    setTimeout(() => {
        document.onclick = () => { picker.remove(); document.onclick = null; };
    }, 100);
}

function addReaction(msgId, emoji) {
    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 0;
    _db.ref(`messages/${msgId}/reactions/${userId}`).set(emoji);
    window.Telegram?.WebApp?.HapticFeedback.impactOccurred('light');
}

function renderReactions(reactions) {
    return Object.values(reactions).slice(0, 3).join('');
}

function prepareReply(msgId, username, text) {
    window.currentReplyId = msgId;
    const input = document.getElementById('chat-input');
    const replyBar = document.getElementById('reply-preview-bar') || createReplyBar();
    replyBar.innerHTML = `<span>الرد على ${username}: ${text.substring(0,20)}...</span> <i class="fas fa-times" onclick="cancelReply()"></i>`;
    replyBar.style.display = 'flex';
    input.focus();
    window.Telegram?.WebApp?.HapticFeedback.impactOccurred('medium');
}

function createReplyBar() {
    const bar = document.createElement('div');
    bar.id = 'reply-preview-bar';
    document.querySelector('.chat-window').insertBefore(bar, document.querySelector('.chat-window div:last-child'));
    return bar;
}

function cancelReply() {
    window.currentReplyId = null;
    const bar = document.getElementById('reply-preview-bar');
    if(bar) bar.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => setTimeout(loadMessages, 500));
