const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');
const { runtime, formatDate, getTime } = require('../lib/myfunc');

async function helpCommand(sock, chatId, message) {
    try {
        const senderId = message.sender || message.key.participant || message.key.remoteJid || '';
        const pushingName = message.pushName || message.pushname || 'User';
        const isGroup = chatId.endsWith('@g.us');

        // 1. Determine User Role
        let role = 'User';
        const isOwner = senderId && (senderId.split('@')[0] === settings.ownerNumber || senderId === settings.ownerNumber + '@s.whatsapp.net');

        let isSenderAdmin = false;
        if (isGroup) {
            const adminCheck = await isAdmin(sock, chatId, senderId);
            isSenderAdmin = adminCheck.isSenderAdmin;
        }

        if (isOwner) {
            role = 'Owner';
        } else if (isSenderAdmin) {
            role = 'Admin';
        }

        // 2. Dynamic Info
        const timeNow = getTime('HH:mm:ss');
        const dateNow = formatDate(Date.now());
        const upTime = runtime(process.uptime());

        // Dynamic Greeting
        const hour = parseInt(getTime('H'));
        let greeting = 'Selamat Malam';
        if (hour >= 5 && hour < 11) greeting = 'Selamat Pagi';
        else if (hour >= 11 && hour < 15) greeting = 'Selamat Siang';
        else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';

        // 3. Construct Menu Text
        let helpMessage = `👋 ${greeting}, *${pushingName}*!

╔══════ ⟬ *INFORMATION* ⟭ ══════
║ 👤 *User:* ${pushingName}
║ 🎖️ *Role:* ${role}
║ 📅 *Date:* ${dateNow}
║ ⌚ *Time:* ${timeNow} (WIB)
║ ⏳ *Uptime:* ${upTime}
║ 🤖 *Version:* ${settings.version || '3.0.6'}
╚═══════════════════════════

*LIST MENU :*

╭── ⟬ *GENERAL* ⟭
│ ➤ .ping / .menu / .help
│ ➤ .alive / .owner / .jid / .url
│ ➤ .quote / .joke / .fact / .news
│ ➤ .tts / .trt / .ss / .vv
│ ➤ .weather / .news / .lyrics
│ ➤ .8ball / .groupinfo / .staff
╰─────────────────────────

╭── ⟬ *TOOLS & AI* ⟭
│ ➤ .gpt / .gemini / .imagine
│ ➤ .flux / .sora / .remini
│ ➤ .removebg / .blur / .crop
╰─────────────────────────

╭── ⟬ *DOWNLOADER* ⟭
│ ➤ .play / .song / .video
│ ➤ .spotify / .tiktok / .igs
│ ➤ .instagram / .facebook
╰─────────────────────────

╭── ⟬ *IMAGE & STICKER* ⟭
│ ➤ .sticker / .simage / .take
│ ➤ .attp / .tgsticker / .meme
│ ➤ .emojimix
╰─────────────────────────

╭── ⟬ *FUN & GAMES* ⟭
│ ➤ .tictactoe / .trivia
│ ➤ .truth / .dare / .guess
│ ➤ .character / .ship / .simp
│ ➤ .insult / .compliment / .flirt
│ ➤ .wasted / .passed / .jail
╰─────────────────────────

╭── ⟬ *TEXT MAKER* ⟭
│ ➤ .neon / .glow / .devil
│ ➤ .snow / .ice / .thunder
│ ➤ .matrix / .hacker / .fire
╰─────────────────────────`;

        // Admin Only Section
        if (isSenderAdmin || isOwner || !isGroup) {
            helpMessage += `

╭── ⟬ *ADMIN ONLY* ⟭
│ ➤ .kick / .add / .ban / .warn
│ ➤ .promote / .demote / .mute
│ ➤ .unmute / .del / .clear
│ ➤ .antilink / .antibadword
│ ➤ .antitag / .chatbot / .welcome
│ ➤ .goodbye / .tagall / .hidetag
│ ➤ .setgname / .setgdesc / .setgpp
╰─────────────────────────`;
        }

        // Owner Only Section
        if (isOwner) {
            helpMessage += `

╭── ⟬ *OWNER ONLY* ⟭
│ ➤ .mode / .setpp / .update
│ ➤ .clearsession / .cleartmp
│ ➤ .autoreact / .autostatus
│ ➤ .autotyping / .autoread
│ ➤ .anticall / .pmblocker
╰─────────────────────────`;
        }

        helpMessage += `\n\n_Powered by ${settings.botOwner || 'NathanKanaeru'}_`;

        // 4. Send Message
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '12036316998@newsletter',
                newsletterName: 'Nathan Studios',
                serverMessageId: -1
            },
            externalAdReply: {
                title: settings.botName || 'Nathan Bot',
                body: 'Managing Group Automatically',
                thumbnailUrl: 'https://i.ibb.co.id/596/nathan.jpg', // Dynamic or static thumbnail
                sourceUrl: 'https://github.com/NathanKanaeru',
                mediaType: 1,
                renderLargerThumbnail: true
            }
        };

        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(chatId, {
                image: fs.readFileSync(imagePath),
                caption: helpMessage,
                contextInfo
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: helpMessage,
                contextInfo
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: 'Terjadi kesalahan saat menampilkan menu.' });
    }
}

module.exports = helpCommand;
