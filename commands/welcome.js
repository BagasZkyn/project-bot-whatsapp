const { handleWelcome } = require('../lib/welcome');
const { isWelcomeOn, getWelcome } = require('../lib/index');
const { channelInfo } = require('../lib/messageConfig');
const fetch = require('node-fetch');

async function welcomeCommand(sock, chatId, message, match) {
    // Check if it's a group
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: 'This command can only be used in groups.' });
        return;
    }

    // Extract match from message
    const text = message.message?.conversation || 
                message.message?.extendedTextMessage?.text || '';
    const matchText = text.split(' ').slice(1).join(' ');

    await handleWelcome(sock, chatId, message, matchText);
}

async function handleJoinEvent(sock, id, participants) {
    // Check if welcome is enabled for this group
    const isWelcomeEnabled = await isWelcomeOn(id);
    if (!isWelcomeEnabled) return;

    // Get custom welcome message
    const customMessage = await getWelcome(id);

    // Get group metadata
    const groupMetadata = await sock.groupMetadata(id);
    const groupName = groupMetadata.subject;
    const groupDesc = groupMetadata.desc || 'No description available';

    // Send welcome message for each new participant
    for (const participant of participants) {
        // Handle case where participant might be an object or string
        let participantString;
        let pushName = null;
        
        if (typeof participant === 'string') {
            participantString = participant;
        } else if (typeof participant === 'object') {
            participantString = participant.id || participant.jid || participant.toString();
            // Check for notify/push name in participant object
            pushName = participant.notify || participant.name || participant.pushName || null;
        } else {
            participantString = participant.toString();
        }
        
        const user = participantString.split('@')[0];
        
        // Get user's display name with multiple fallback methods
        let displayName = user; // Default to phone number
        
        // Method 1: Check if participant object has notify/pushName
        if (pushName) {
            displayName = pushName;
            console.log(`Got name from participant.notify: ${displayName}`);
        }
        
        // Method 2: Try to get from group participants (might have 'notify' field)
        if (displayName === user) {
            try {
                const userParticipant = groupMetadata.participants.find(p => p.id === participantString);
                if (userParticipant) {
                    if (userParticipant.notify) {
                        displayName = userParticipant.notify;
                        console.log(`Got name from group participant.notify: ${displayName}`);
                    } else if (userParticipant.name) {
                        displayName = userParticipant.name;
                        console.log(`Got name from group participant.name: ${displayName}`);
                    }
                }
            } catch (e) {
                console.log('Could not get name from group participants');
            }
        }
        
        // Method 3: Try business profile (only works for business accounts)
        if (displayName === user) {
            try {
                const contact = await sock.getBusinessProfile(participantString);
                if (contact && contact.name) {
                    displayName = contact.name;
                    console.log(`Got name from business profile: ${displayName}`);
                }
            } catch (e) {
                console.log('Not a business account or could not fetch profile');
            }
        }
        
        // Method 4: Try from sock.contacts if available
        if (displayName === user && sock.contacts) {
            try {
                const contact = sock.contacts[participantString];
                if (contact && (contact.notify || contact.name)) {
                    displayName = contact.notify || contact.name;
                    console.log(`Got name from sock.contacts: ${displayName}`);
                }
            } catch (e) {
                console.log('Could not get from sock.contacts');
            }
        }
        
        // Method 5: Try using onWhatsApp to get verified name
        if (displayName === user) {
            try {
                const [result] = await sock.onWhatsApp(participantString);
                if (result && result.notify) {
                    displayName = result.notify;
                    console.log(`Got name from onWhatsApp: ${displayName}`);
                }
            } catch (e) {
                console.log('Could not get from onWhatsApp');
            }
        }
        
        console.log(`Final display name for ${user}: ${displayName}`);
        
        // Process custom message with variables
        let finalMessage;
        if (customMessage) {
            finalMessage = customMessage
                .replace(/{user}/g, `@${displayName}`)
                .replace(/{group}/g, groupName)
                .replace(/{description}/g, groupDesc);
        } else {
            // Default message if no custom message is set
            const now = new Date();
            const timeString = now.toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
            
            finalMessage = `╭╼━≪•𝙽𝙴𝚆 𝙼𝙴𝙼𝙱𝙴𝚁•≫━╾╮\n┃𝚆𝙴𝙻𝙲𝙾𝙼𝙴: @${displayName} 👋\n┃Member count: #${groupMetadata.participants.length}\n┃𝚃𝙸𝙼𝙴: ${timeString}⏰\n╰━━━━━━━━━━━━━━━╯\n\n*@${displayName}* Welcome to *${groupName}*! 🎉\n*Group 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽*\n${groupDesc}\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ Knight Bot*`;
        }
        
        // Try to send with image first
        let imageSent = false;
        try {
            // Get user profile picture
            let profilePicUrl = `https://img.pyrocdn.com/dbKUgahg.png`; // Default avatar
            try {
                const profilePic = await sock.profilePictureUrl(participantString, 'image');
                if (profilePic) {
                    profilePicUrl = profilePic;
                }
            } catch (profileError) {
                console.log('Could not fetch profile picture, using default');
            }
            
            // Construct API URL - use displayName, not user number!
            const apiUrl = `https://api.some-random-api.com/welcome/img/2/gaming3?type=join&textcolor=green&username=${encodeURIComponent(displayName)}&guildName=${encodeURIComponent(groupName)}&memberCount=${groupMetadata.participants.length}&avatar=${encodeURIComponent(profilePicUrl)}`;
            
            console.log(`API URL username param: ${displayName}`);
            
            // Fetch the welcome image
            const response = await fetch(apiUrl);
            if (response.ok) {
                const imageBuffer = await response.buffer();
                
                // Send welcome image with caption
                await sock.sendMessage(id, {
                    image: imageBuffer,
                    caption: finalMessage,
                    mentions: [participantString],
                    ...channelInfo
                });
                imageSent = true;
            }
        } catch (imageError) {
            console.log('Image generation failed, falling back to text:', imageError.message);
        }
        
        // Send text message if image failed
        if (!imageSent) {
            await sock.sendMessage(id, {
                text: finalMessage,
                mentions: [participantString],
                ...channelInfo
            });
        }
    }
}

module.exports = { welcomeCommand, handleJoinEvent };