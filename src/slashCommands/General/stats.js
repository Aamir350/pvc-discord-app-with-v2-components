const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Shows bot statistics (guild count, users, channels, memory usage).'),

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

    const guildCount = client.guilds.cache.size;
    const channelCount = client.channels.cache.size;
    const userCount = client.users.cache.size; // This only counts cached users

    const memoryUsage = process.memoryUsage();
    const rss = (memoryUsage.rss / 1024 / 1024).toFixed(2); // Resident Set Size in MB
    const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2); // Heap Used in MB

    const statsText = new TextDisplayBuilder()
      .setContent(
        `**Guilds:** ${guildCount}\n` +
        `**Channels:** ${channelCount}\n` +
        `**Users:** ${userCount}\n` +
        `**Memory Usage:** ${rss} MB (RSS), ${heapUsed} MB (Heap Used)`
      );

    const separator = new SeparatorBuilder();
    const container = new ContainerBuilder()
      .setAccentColor(parseInt(config.color.replace('#', ''), 16))
      .addSeparatorComponents(separator)
      .addTextDisplayComponents(statsText)
      .addSeparatorComponents(separator);

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  },
};
