

// If you don't know what you are doing, then it is recommended that not to edit this file as its the important file for the bot
// Developer: ZarCodeX

// if you have any question, join Zarco HQ: https://discord.gg/6YVmxA4Qsf

// ❤️ Leave a ⭐ star on the repo, this will help me a lot:  
// https://github.com/ZarCodeX/pvc-discord-app-with-v2-components

// ❤️ Subscribe to my YouTube channel, this will motivate me to create more opensource bot codes:  
// https://www.youtube.com/@ZarCodeX


const { MessageFlags, TextDisplayBuilder, ContainerBuilder } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(client, interaction) {
        try {
            // Check if method exists before calling
            if (typeof interaction.isChatInputCommand !== 'function' || !interaction.isChatInputCommand()) return;

            // Block commands in DMs
            if (!interaction.guild) {
                const accentColor = parseInt(config.color.replace('#', ''), 16);
                const dmBlock = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${config.crossmark_emoji} This command can only be used in a server.`)
                    );

                return interaction.reply({
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                    components: [dmBlock],
                }).catch(console.error);
            }

            // Run command
            const command = client.slash.get(interaction.commandName);
            if (!command) return;

            await command.run(client, interaction, interaction.options);

        } catch (err) {
            console.error('[INTERACTION ERROR]', err);

            // Safe reply helper
            const safeReply = async (content) => {
                try {
                    if (interaction && typeof interaction.isRepliable === 'function' && interaction.isRepliable()) {
                        if (interaction.deferred || interaction.replied) {
                            await interaction.editReply(content);
                        } else {
                            await interaction.reply(content);
                        }
                    } else if (interaction && typeof interaction.reply === 'function') {
                        await interaction.reply(content);
                    }
                } catch (e) {
                    console.error('[SAFE REPLY ERROR]', e);
                }
            };

            const errorBlock = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ An unexpected error occurred while handling this interaction.')
                );

            await safeReply({ flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2, components: [errorBlock] });
        }
    },
};
