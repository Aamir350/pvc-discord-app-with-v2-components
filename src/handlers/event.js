

// If you don't know what you are doing, then it is recommended that not to edit this file as its the important file for event loading of the bot
// Developer: ZarCodeX

// if you have any question, join Zarco HQ: https://discord.gg/6YVmxA4Qsf

// ❤️ Leave a ⭐ star on the repo, this will help me a lot:  
// https://github.com/ZarCodeX/pvc-discord-app-with-v2-components

// ❤️ Subscribe to my YouTube channel, this will motivate me to create more opensource bot codes:  
// https://www.youtube.com/@ZarCodeX


// ========================= EVENT HANDLER =========================
const fs = require('fs');
const colors = require('colors');

module.exports = (client) => {
    client.setMaxListeners(100);

    let loadedEvents = [];
    let skippedEvents = [];

    fs.readdirSync('./src/events/').forEach(dir => {
        const files = fs.readdirSync(`./src/events/${dir}`).filter(f => f.endsWith('.js'));

        for (const file of files) {
            const event = require(`../events/${dir}/${file}`);
            if (!event.name) {
                skippedEvents.push(file);
                continue;
            }

            if (event.once) {
                client.once(event.name, (...args) => event.execute(client, ...args));
            } else {
                client.on(event.name, (...args) => event.execute(client, ...args));
            }

            loadedEvents.push(`${event.name}${event.once ? ' (once)' : ''}`);
        }
    });

    // Build single box log
    const allEvents = [
        'LOADED EVENTS:',
        ...loadedEvents.map(name => `  • ${name}`),
        skippedEvents.length > 0 ? '\nSKIPPED EVENTS:' : '',
        ...skippedEvents.map(file => `  • ${file}`)
    ].join('\n');

    const boxLength = Math.max(...allEvents.split('\n').map(line => line.length)) + 4;
    const top = `╔${'─'.repeat(boxLength)}╗`;
    const bottom = `╚${'─'.repeat(boxLength)}╝`;
    console.log(colors.cyan(top));
    allEvents.split('\n').forEach(line => {
        console.log(colors.cyan(`║ ${line.padEnd(boxLength - 2)} ║`));
    });
    console.log(colors.cyan(bottom));

    console.log(colors.magenta('All events loaded successfully!'));
};
