const { handleJoinEvent } = require('./welcome');

async function testWelcomeCommand(sock, chatId, message, senderId) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: 'This command can only be used in groups.' }, { quoted: message });
        return;
    }

    // Admins only (for testing)
    const isAdmin = require('../lib/isAdmin');
    const adminStatus = await isAdmin(sock, chatId, senderId);
    if (!adminStatus.isSenderAdmin) {
        await sock.sendMessage(chatId, { text: 'Only group admins can use this test command.' }, { quoted: message });
        return;
    }

    let targetId = senderId;
    if (senderId.includes('@lid') && sock.user && sock.user.id) {
        // If testing from a linked device, Baileys provides a LID. 
        // Use the bot's own real JID instead so the phone number renders correctly.
        targetId = sock.user.id;
    }

    // Ensure we strip any device ports (e.g. :26) so it's a pure phone number
    const cleanId = targetId.split(':')[0] + '@s.whatsapp.net';

    try {
        await sock.sendMessage(chatId, { text: 'Testing welcome image generator...' }, { quoted: message });
        // Simulating a join event for the sender themselves to test it
        await handleJoinEvent(sock, chatId, [cleanId]);
    } catch (e) {
        console.error('Test welcome failed', e);
        await sock.sendMessage(chatId, { text: 'Test welcome failed: ' + e.message }, { quoted: message });
    }
}

module.exports = testWelcomeCommand;
