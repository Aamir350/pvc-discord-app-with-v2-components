

// If you don't know what you are doing, then it is recommended that not to edit this file as its the important ready file for the bot
// Developer: ZarCodeX

// if you have any question, join Zarco HQ: https://discord.gg/6YVmxA4Qsf

// ❤️ Leave a ⭐ star on the repo, this will help me a lot:  
// https://github.com/ZarCodeX/pvc-discord-app-with-v2-components

// ❤️ Subscribe to my YouTube channel, this will motivate me to create more opensource bot codes:  
// https://www.youtube.com/@ZarCodeX


const { ActivityType } = require('discord.js');

module.exports = {
    name: 'clientReady',
    once: true,
    execute(client) {
        const tag = client.user.tag;
        const boxTitle = `BOT READY`;
        const boxMessage = `Logged in as ${tag}`;
        const maxLength = Math.max(boxTitle.length, boxMessage.length) + 4;
        console.log(`╔${'─'.repeat(maxLength)}╗`);
        console.log(`║ ${boxTitle.padEnd(maxLength - 2)} ║`);
        console.log(`╠${'─'.repeat(maxLength)}╣`);
        console.log(`║ ${boxMessage.padEnd(maxLength - 2)} ║`);
        console.log(`╚${'─'.repeat(maxLength)}╝`);

        client.user.setPresence({
            status: 'online',
            activities: [{
                name: 'Make sure to leave a star ⭐ on the repo',
                type: ActivityType.Custom,
            }],
        });
    },
};
