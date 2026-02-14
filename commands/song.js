const axios = require('axios');
const yts = require('yt-search');

const API_BASE = 'https://api.akuari.my.id/downloader/ytmp3?link=';

async function songCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation ||
                     message.message?.extendedTextMessage?.text || '';

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: 'Usage: .song <judul lagu>'
            }, { quoted: message });
        }

        // 🔎 Search YouTube
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

        // 📡 Request ke API downloader
        const apiUrl = API_BASE + encodeURIComponent(video.url);
        const res = await axios.get(apiUrl, { timeout: 60000 });

        if (!res.data || !res.data.result || !res.data.result.url) {
            throw new Error('API gagal');
        }

        const downloadUrl = res.data.result.url;

        // 📥 Download audio jadi buffer
        const audioRes = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 90000
        });

        const buffer = Buffer.from(audioRes.data);

        if (!buffer || buffer.length === 0) {
            throw new Error('Buffer kosong');
        }

        // 📤 Kirim ke WhatsApp
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