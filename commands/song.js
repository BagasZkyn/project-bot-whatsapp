const yts = require('yt-search');
const ytdl = require('ytdl-core');
const axios = require('axios');

async function songCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || 
                     message.message?.extendedTextMessage?.text || '';

        if (!text) {
            return await sock.sendMessage(chatId, { 
                text: 'Usage: .song <judul lagu / link youtube>' 
            }, { quoted: message });
        }

        let video;

        // Jika input adalah link youtube
        if (text.includes('youtube.com') || text.includes('youtu.be')) {
            const info = await ytdl.getInfo(text);
            video = {
                url: text,
                title: info.videoDetails.title,
                thumbnail: info.videoDetails.thumbnails.slice(-1)[0].url,
                timestamp: info.videoDetails.lengthSeconds
            };
        } else {
            const search = await yts(text);
            if (!search.videos.length) {
                return await sock.sendMessage(chatId, { 
                    text: '❌ Lagu tidak ditemukan.' 
                }, { quoted: message });
            }
            video = search.videos[0];
        }

        await sock.sendMessage(chatId, {
            image: { url: video.thumbnail },
            caption: `🎵 Downloading: *${video.title}*`
        }, { quoted: message });

        // Ambil audio langsung dari youtube
        const stream = ytdl(video.url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        });

        await sock.sendMessage(chatId, {
            audio: stream,
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