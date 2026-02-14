const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');

async function songCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || 
                     message.message?.extendedTextMessage?.text || '';

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: 'Usage: .song <judul lagu>'
            }, { quoted: message });
        }

        // Search video
        const search = await yts(text);
        if (!search.videos.length) {
            return await sock.sendMessage(chatId, {
                text: '❌ Lagu tidak ditemukan.'
            }, { quoted: message });
        }

        const video = search.videos[0];

        await sock.sendMessage(chatId, {
            image: { url: video.thumbnail },
            caption: `🎵 Downloading: *${video.title}*`
        }, { quoted: message });

        // Ambil audio info
        const info = await ytdl.getInfo(video.url);

        const format = ytdl.chooseFormat(info.formats, {
            quality: 'highestaudio',
            filter: 'audioonly'
        });

        // Download ke buffer
        const stream = ytdl.downloadFromInfo(info, { format });

        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);

        if (!buffer || buffer.length === 0) {
            throw new Error('Buffer kosong');
        }

        // Kirim ke WhatsApp
        await sock.sendMessage(chatId, {
            audio: buffer,
            mimetype: 'audio/mpeg',
            fileName: `${video.title}.mp3`,
            ptt: false
        }, { quoted: message });

    } catch (err) {
        console.error('Song command error:', err);

        await sock.sendMessage(chatId, {
            text: '❌ Gagal download lagu.'
        }, { quoted: message });
    }
}

module.exports = songCommand;