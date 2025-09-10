// src/slashCommands/PVC/remove.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, MessageFlags, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove the Temporary Voice Channel (PVC) system configuration from this server.'),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    const memberPerms = interaction.member.permissions;

    // Member permission check
    if (!memberPerms.has(PermissionsBitField.Flags.ManageChannels)) {
      const errorText = new TextDisplayBuilder().setContent(`❌ You need **Manage Channels** permission to remove the PVC system.`);
      const container = new ContainerBuilder()
        .addTextDisplayComponents(errorText);

      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container.toJSON()],
      });
    }

    // Remove UI confirmation
    const removalText = new TextDisplayBuilder()
      .setContent(
        `## Remove Temporary Voice Channel System\n\nThis will remove PVC configs from this server. Are you sure you want to continue?\n` +
        `⚠ Existing channels and categories will remain intact.`
      );

    const removeButton = new ButtonBuilder()
      .setCustomId(`pvc_remove-${interaction.guild.id}`)
      .setLabel('Remove PVC System')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🔴');

    const buttonRow = new ActionRowBuilder().addComponents(removeButton);
    const separator = new SeparatorBuilder();

    const container = new ContainerBuilder()
      .addSeparatorComponents(separator)
      .addTextDisplayComponents(removalText)
      .addActionRowComponents(buttonRow)
      .addSeparatorComponents(separator);

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [container.toJSON()],
    });

    // Optionally remove PVC message file if exists
    const dataDir = path.join(__dirname, '../../../data', interaction.guild.id, 'PVC');
    const pvcFile = path.join(dataDir, 'pvc_message.json');
    if (fs.existsSync(pvcFile)) fs.unlinkSync(pvcFile);
  },
};



// If you don't know what you are doing, then it is recommended that not to edit this file because it may break bot and cause errors
// Developer: ZarCodeX

// if you have any question, join Zarco HQ: https://discord.gg/6YVmxA4Qsf

// ❤️ Leave a ⭐ star on the repo, this will help me a lot:  
// https://github.com/ZarCodeX/pvc-discord-app-with-v2-components

// ❤️ Subscribe to my YouTube channel, this will motivate me to create more opensource bot codes:  
// https://www.youtube.com/@ZarCodeX