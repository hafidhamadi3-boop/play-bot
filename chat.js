/**
 * X-PAY Messenger Engine 🚀 - Pro Max Version (Updated)
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

// --- 3. التعامل مع اللمس المطور (السحب للرد والضغط المطول) ---
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
    if (moveX > 20) { // بدأت عملية السحب لليمين
        clearTimeout(touchTimer); // إلغاء الضغط المطول فور التحريك
        element.style.transform = `translateX(${Math.min(moveX, 80)}px)`;
        element.style.transition = "none"; 
    }
}

function handleTouchEnd(element, msgId, username, text) {
    let finalMoveX = 0;
    const transformValue = element.style.transform;
    if (transformValue && transformValue.includes('translateX')) {
        finalMoveX = parseInt(transformValue.replace(/[^\d.]/g, ''));
    }

    // إعادة الرسالة لمكانها بنعومة
    element.style.transition = "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    element.style.transform = 'translateX(0)';
    clearTimeout(touchTimer);

    // إذا سحب المستخدم أكثر من 60 بكسل، نفذ الرد
    if (finalMoveX > 60) {
        prepareReply(msgId, username, text);
    }
}

// --- 4. نظام التفاعلات والردود الموثوق ---
function showEmojiPicker(msgId) {
    const emojis = ['❤️', '🔥', '👍', '😂', '😮', '😢'];
    const picker = document.createElement('div');
    picker.className = 'emoji-picker-popup';
    
    emojis.forEach(emoji => {
        const span = document.createElement('span');
        span.innerText = emoji;
        span.onclick = () => {
            toggleReaction(msgId, emoji); // استخدام الدالة الجديدة للتبديل
            picker.remove();
        };
        picker.appendChild(span);
    });
    document.body.appendChild(picker);
    
    setTimeout(() => {
        document.onclick = () => { picker.remove(); document.onclick = null; };
    }, 100);
}

// دالة ذكية: إذا كان التفاعل موجوداً تحذفه، وإذا لم يكن تضعه
function toggleReaction(msgId, emoji) {
    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 0;
    const reactionRef = _db.ref(`messages/${msgId}/reactions/${userId}`);

    reactionRef.once('value').then((snapshot) => {
        const currentEmoji = snapshot.val();
        if (currentEmoji === emoji) {
            // إذا كان نفس الإيموجي، قم بإزالته (إلغاء التفاعل)
            reactionRef.remove();
            window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('warning');
        } else {
            // إذا كان مختلفاً أو غير موجود، ضعه
            reactionRef.set(emoji);
            window.Telegram?.WebApp?.HapticFeedback.impactOccurred('light');
        }
    });
}

function renderReactions(reactions) {
    // عرض أول 3 تفاعلات فريدة
    const uniqueReactions = [...new Set(Object.values(reactions))];
    return uniqueReactions.slice(0, 3).join('');
}

function prepareReply(msgId, username, text) {
    window.currentReplyId = msgId;
    const chatWindow = document.querySelector('.chat-window');
    const chatInputContainer = document.querySelector('.chat-window div:last-child');
    
    let replyBar = document.getElementById('reply-preview-bar');
    if (!replyBar) {
        replyBar = document.createElement('div');
        replyBar.id = 'reply-preview-bar';
        chatWindow.insertBefore(replyBar, chatInputContainer);
    }

    replyBar.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
            <i class="fas fa-reply" style="color:var(--accent);"></i>
            <div style="white-space:nowrap;">
                <b style="display:block; font-size:10px;">الرد على ${username}</b>
                <span style="font-size:12px; opacity:0.8;">${text.substring(0, 30)}...</span>
            </div>
        </div>
        <i class="fas fa-times-circle" onclick="cancelReply()" style="cursor:pointer; font-size:18px;"></i>
    `;
    
    replyBar.style.display = 'flex';
    document.getElementById('chat-input').focus();
    window.Telegram?.WebApp?.HapticFeedback.impactOccurred('medium');
}

function cancelReply() {
    window.currentReplyId = null;
    const replyBar = document.getElementById('reply-preview-bar');
    if (replyBar) {
        replyBar.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => setTimeout(loadMessages, 500));
