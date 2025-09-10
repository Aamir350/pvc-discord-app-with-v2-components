// src/slashCommands/PVC/setup.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, MessageFlags, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Initialize the Temporary Voice Channel (PVC) system on this server.'),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    const memberPerms = interaction.member.permissions;
    const botPerms = interaction.guild.members.me.permissions;

    // Member permission check
    if (!memberPerms.has(PermissionsBitField.Flags.ManageChannels)) {
      const errorText = new TextDisplayBuilder().setContent(`❌ You need **Manage Channels** permission to perform this setup.`);
      const container = new ContainerBuilder()
        .addTextDisplayComponents(errorText);

      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container.toJSON()],
      });
    }

    // Bot permission check
    if (!botPerms.has(PermissionsBitField.Flags.ManageChannels)) {
      const errorText = new TextDisplayBuilder().setContent(`❌ I need **Manage Channels** permission to configure the PVC system.`);
      const container = new ContainerBuilder()
        .addTextDisplayComponents(errorText);

      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container.toJSON()],
      });
    }

    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });

    // Setup UI
    const introText = new TextDisplayBuilder()
      .setContent(`## Temporary Voice Channel Setup\n\nClick the **Setup PVC System** button below to begin creating your PVC system.`);

    const startButton = new ButtonBuilder()
      .setCustomId(`pvc_setup_start-${interaction.guild.id}`)
      .setLabel('Setup PVC System')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🟢');

    const buttonRow = new ActionRowBuilder().addComponents(startButton);
    const separator = new SeparatorBuilder();

    const container = new ContainerBuilder()
      .addSeparatorComponents(separator)
      .addTextDisplayComponents(introText)
      .addActionRowComponents(buttonRow)
      .addSeparatorComponents(separator);

    const message = await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [container.toJSON()],
    });

    // Save PVC message ID
    const dataDir = path.join(__dirname, '../../../data', interaction.guild.id, 'PVC');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'pvc_message.json'), JSON.stringify({ messageId: message.id }, null, 2));

    // Follow-up confirmation
    const followUpText = new TextDisplayBuilder().setContent(`✅ PVC setup initialized! Click the button above to continue the setup process.`);
    const followUpContainer = new ContainerBuilder()
      .addTextDisplayComponents(followUpText);

    await interaction.followUp({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [followUpContainer.toJSON()],
    });
  },
};



// If you don't know what you are doing, then it is recommended that not to edit this file because it may break bot and cause errors
// Developer: ZarCodeX

// if you have any question, join Zarco HQ: https://discord.gg/6YVmxA4Qsf

// ❤️ Leave a ⭐ star on the repo, this will help me a lot:  
// https://github.com/ZarCodeX/pvc-discord-app-with-v2-components

// ❤️ Subscribe to my YouTube channel, this will motivate me to create more opensource bot codes:  
// https://www.youtube.com/@ZarCodeX