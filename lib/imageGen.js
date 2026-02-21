const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const { parsePhoneNumber } = require('libphonenumber-js');

// Register a default font (if you want custom fonts, you can load them here)
// GlobalFonts.registerFromPath(path.join(__dirname, '../assets/fonts/MyFont.ttf'), 'MyFont'); 

/**
 * Helper to fetch image buffer from URL
 */
async function fetchImageBuffer(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.buffer();
    } catch (e) {
        console.error('Failed to fetch image buffer for URL:', url, e.message);
        throw e;
    }
}

/**
 * Creates a circular clipping mask for avatars
 */
function drawCircularAvatar(ctx, avatarImage, x, y, radius) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    // Draw the image
    ctx.drawImage(avatarImage, x, y, radius * 2, radius * 2);

    // Draw an outline around the avatar
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
}

/**
 * Generates the Welcome Image
 */
async function generateWelcomeImage(displayName, userNumber, profilePicUrl, groupName, memberCount) {
    const width = 1024;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Draw Background
    let bgImage;
    const bgPath = path.join(__dirname, '../assets/welcome_bg.png');
    if (fs.existsSync(bgPath)) {
        bgImage = await loadImage(bgPath);
    } else {
        // Fallback simple background if custom one doesn't exist
        ctx.fillStyle = '#1e1e2f';
        ctx.fillRect(0, 0, width, height);
    }
    if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, width, height);
    }

    // Dark overlay for better text readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Avatar
    try {
        let avatarBuffer;
        if (profilePicUrl && profilePicUrl !== 'https://img.pyrocdn.com/dbKUgahg.png') {
            try {
                avatarBuffer = await fetchImageBuffer(profilePicUrl);
            } catch (fetchError) {
                console.log("Failed to fetch profile picture, using default.");
            }
        }

        // If fetch failed OR no URL provided, load fallback
        if (!avatarBuffer) {
            const defaultAvatarPath = path.join(__dirname, '../assets/default_avatar.png');
            if (fs.existsSync(defaultAvatarPath)) {
                avatarBuffer = fs.readFileSync(defaultAvatarPath);
            }
        }

        if (avatarBuffer) {
            const avatarImage = await loadImage(avatarBuffer);
            drawCircularAvatar(ctx, avatarImage, 60, height / 2 - 120, 120);
        } else {
            // Draw placeholder gray circle if absolutely no avatar available (local file missing)
            ctx.fillStyle = '#666666';
            ctx.beginPath();
            ctx.arc(60 + 120, height / 2, 120, 0, Math.PI * 2);
            ctx.fill();
        }
    } catch (e) {
        console.log("Error in avatar drawing:", e.message);
    }

    // 3. Draw Texts
    const textStartX = 340;

    // "WELCOME" Title
    ctx.font = 'bold 60px Arial'; // Using standard Arial, change if utilizing GlobalFonts
    ctx.fillStyle = '#00ffaa'; // Neon green
    ctx.fillText('WELCOME', textStartX, 150);

    // Username
    ctx.font = 'bold 50px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(displayName.substring(0, 20) + (displayName.length > 20 ? '...' : ''), textStartX, 220);

    // Format User Number
    let formattedNumber = '';
    const rawNum = String(userNumber).replace(/\D/g, ''); // digits only

    try {
        const pn = parsePhoneNumber('+' + rawNum);
        if (pn && pn.isValid()) {
            formattedNumber = pn.formatInternational().replace(/ /g, '-');
        } else {
            formattedNumber = '+' + rawNum;
        }
    } catch (e) {
        // Fallback for simple grouping if parsing fails
        if (rawNum.startsWith('62')) {
            const match = rawNum.match(/^(\d{2})(\d{3,4})(\d{4})(\d{3,4})?$/);
            if (match) {
                formattedNumber = `+${match[1]}-${match[2]}-${match[3]}` + (match[4] ? `-${match[4]}` : '');
            } else {
                formattedNumber = '+' + rawNum;
            }
        } else {
            formattedNumber = '+' + rawNum;
        }
    }

    // User Number (Subtitle) - always draw if we have a number string
    if (formattedNumber) {
        ctx.font = '30px Arial';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(formattedNumber, textStartX, 270);
    }

    // Separation Line
    ctx.beginPath();
    ctx.moveTo(textStartX, 300);
    ctx.lineTo(width - 60, 300);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Group info and Member Count
    ctx.font = '35px Arial';
    ctx.fillStyle = '#e0e0e0';
    ctx.fillText(`Joined: ${groupName.substring(0, 25)}`, textStartX, 360);

    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#00ffaa';
    ctx.fillText(`Member #${memberCount}`, textStartX, 410);

    return canvas.toBuffer('image/png');
}

/**
 * Generates the Goodbye Image
 */
async function generateGoodbyeImage(displayName, userNumber, profilePicUrl, groupName, memberCount) {
    const width = 1024;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Draw Background
    let bgImage;
    const bgPath = path.join(__dirname, '../assets/goodbye_bg.png');
    if (fs.existsSync(bgPath)) {
        bgImage = await loadImage(bgPath);
    } else {
        ctx.fillStyle = '#2f1e1e';
        ctx.fillRect(0, 0, width, height);
    }
    if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, width, height);
    }

    // Dark overlay for better text readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Avatar
    try {
        let avatarBuffer;
        if (profilePicUrl && profilePicUrl !== 'https://img.pyrocdn.com/dbKUgahg.png') {
            try {
                avatarBuffer = await fetchImageBuffer(profilePicUrl);
            } catch (fetchError) {
                console.log("Failed to fetch profile picture, using default.");
            }
        }

        // If fetch failed OR no URL provided, load fallback
        if (!avatarBuffer) {
            const defaultAvatarPath = path.join(__dirname, '../assets/default_avatar.png');
            if (fs.existsSync(defaultAvatarPath)) {
                avatarBuffer = fs.readFileSync(defaultAvatarPath);
            }
        }

        if (avatarBuffer) {
            const avatarImage = await loadImage(avatarBuffer);
            drawCircularAvatar(ctx, avatarImage, 60, height / 2 - 120, 120);
        } else {
            ctx.fillStyle = '#666666';
            ctx.beginPath();
            ctx.arc(60 + 120, height / 2, 120, 0, Math.PI * 2);
            ctx.fill();
        }
    } catch (e) {
        console.log("Error in avatar drawing:", e.message);
    }

    // 3. Draw Texts
    const textStartX = 340;

    // "GOODBYE" Title
    ctx.font = 'bold 60px Arial';
    ctx.fillStyle = '#ff4444'; // Red
    ctx.fillText('GOODBYE', textStartX, 150);

    // Username
    ctx.font = 'bold 50px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(displayName.substring(0, 20) + (displayName.length > 20 ? '...' : ''), textStartX, 220);

    // Format User Number
    let formattedNumber = '';
    const rawNum = String(userNumber).replace(/\D/g, '');

    try {
        const pn = parsePhoneNumber('+' + rawNum);
        if (pn && pn.isValid()) {
            formattedNumber = pn.formatInternational().replace(/ /g, '-');
        } else {
            formattedNumber = '+' + rawNum;
        }
    } catch (e) {
        if (rawNum.startsWith('62')) {
            const match = rawNum.match(/^(\d{2})(\d{3,4})(\d{4})(\d{3,4})?$/);
            if (match) {
                formattedNumber = `+${match[1]}-${match[2]}-${match[3]}` + (match[4] ? `-${match[4]}` : '');
            } else {
                formattedNumber = '+' + rawNum;
            }
        } else {
            formattedNumber = '+' + rawNum;
        }
    }

    // User Number (Subtitle) - always draw if we have a number string
    if (formattedNumber) {
        ctx.font = '30px Arial';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(formattedNumber, textStartX, 270);
    }

    // Separation Line
    ctx.beginPath();
    ctx.moveTo(textStartX, 300);
    ctx.lineTo(width - 60, 300);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Group info and Member Count
    ctx.font = '35px Arial';
    ctx.fillStyle = '#e0e0e0';
    ctx.fillText(`Left: ${groupName.substring(0, 25)}`, textStartX, 360);

    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#ff4444';
    ctx.fillText(`${memberCount} members left`, textStartX, 410);

    return canvas.toBuffer('image/png');
}

module.exports = {
    generateWelcomeImage,
    generateGoodbyeImage
};
