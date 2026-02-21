const isAdmin = require('../lib/isAdmin');

async function ensureGroupAndAdmin(sock, chatId, senderId, message, command) {
    const isGroup = chatId.endsWith('@g.us');
    if (!isGroup) {
        await sock.sendMessage(chatId, { text: 'This command can only be used in groups.' }, { quoted: message });
        return { ok: false };
    }

    // Check admin status of sender and bot
    const adminStatus = await isAdmin(sock, chatId, senderId);
    if (!adminStatus.isBotAdmin) {
        await sock.sendMessage(chatId, { text: 'Please make the bot an admin first.' }, { quoted: message });
        return { ok: false };
    }
    if (!adminStatus.isSenderAdmin) {
        await sock.sendMessage(chatId, { text: 'Only group admins can use this command.' }, { quoted: message });
        return { ok: false };
    }
    
    return { ok: true };
}

async function gcCloseCommand(sock, chatId, senderId, message) {
    const check = await ensureGroupAndAdmin(sock, chatId, senderId, message, 'gc close');
    if (!check.ok) return;

    try {
        await sock.groupSettingUpdate(chatId, 'announcement');
        await sock.sendMessage(chatId, { text: '✅ Group has been closed. Only admins can send messages.' }, { quoted: message });
    } catch (e) {
        console.error('Error closing group:', e);
        await sock.sendMessage(chatId, { text: '❌ Failed to close the group.' }, { quoted: message });
    }
}

async function gcOpenCommand(sock, chatId, senderId, message) {
    const check = await ensureGroupAndAdmin(sock, chatId, senderId, message, 'gc open');
    if (!check.ok) return;

    try {
        await sock.groupSettingUpdate(chatId, 'not_announcement');
        await sock.sendMessage(chatId, { text: '✅ Group has been opened. All participants can send messages.' }, { quoted: message });
    } catch (e) {
        console.error('Error opening group:', e);
        await sock.sendMessage(chatId, { text: '❌ Failed to open the group.' }, { quoted: message });
    }
}

module.exports = {
    gcCloseCommand,
    gcOpenCommand
};
