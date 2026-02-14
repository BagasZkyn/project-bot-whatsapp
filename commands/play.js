const yts = require('yt-search');
const ytdl = require('ytdl-core');

async function playCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || 
                     message.message?.extendedTextMessage?.text;

        const searchQuery = text.split(' ').slice(1).join(' ').trim();

        if (!searchQuery) {
            return await sock.sendMessage(chatId, { 
                text: "Masukkan judul lagu!\nContoh: .play perfect ed sheeran"
            });
        }

        // Cari video
        const search = await yts(searchQuery);
        const video = search.videos[0];

        if (!video) {
            return await sock.sendMessage(chatId, { 
                text: "Lagu tidak ditemukan!"
            });
        }

        await sock.sendMessage(chatId, {
            text: "⏳ Sedang memproses download..."
        });

        const url = video.url;

        // Ambil audio format
        const audioStream = ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio'
        });

        // Kirim audio
        await sock.sendMessage(chatId, {
            audio: audioStream,
            mimetype: 'audio/mpeg',
            fileName: `${video.title}.mp3`
        }, { quoted: message });

    } catch (err) {
        console.error(err);
        await sock.sendMessage(chatId, {
            text: "❌ Download gagal, coba lagi nanti."
        });
    }
}

module.exports = playCommand;