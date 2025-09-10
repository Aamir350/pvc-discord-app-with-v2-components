const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Displays how long the bot has been running.'),

  /**
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').CommandInteraction} interaction
   */
  run: async (client, interaction) => {
    // Check app permissions
    const requiredAppPermissions = [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.EmbedLinks,
      PermissionsBitField.Flags.ReadMessageHistory,
    ];

    const appPerms = interaction.channel.permissionsFor(interaction.guild.members.me);
    const missingPerms = requiredAppPermissions.filter((perm) => !appPerms.has(perm));

    if (missingPerms.length > 0) {
      const permNames = missingPerms
        .map((perm) => Object.keys(PermissionsBitField.Flags).find((key) => PermissionsBitField.Flags[key] === perm))
        .join(', ');

      const errorText = new TextDisplayBuilder()
        .setContent(`⚠ **Missing Permissions**\nI need the following permissions to run this command: **${permNames}**`);

      const sep = new SeparatorBuilder();
      const container = new ContainerBuilder()
        .setAccentColor(parseInt(config.color.replace('#', ''), 16))
        .addSeparatorComponents(sep)
        .addTextDisplayComponents(errorText)
        .addSeparatorComponents(sep);

      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container],
      });
    }

    let totalSeconds = (client.uptime / 1000);
    let days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = Math.floor(totalSeconds % 60);

    let uptime = `${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds`;

    const uptimeText = new TextDisplayBuilder()
      .setContent(`I have been online for: ${uptime}`);

    const separator = new SeparatorBuilder();
    const container = new ContainerBuilder()
      .setAccentColor(parseInt(config.color.replace('#', ''), 16))
      .addSeparatorComponents(separator)
      .addTextDisplayComponents(uptimeText)
      .addSeparatorComponents(separator);

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  },
};
