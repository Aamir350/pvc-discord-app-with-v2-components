const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');
const packageJson = require('../../../package.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Shows info about the bot (version, creator, GitHub link).'),

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

    const aboutText = new TextDisplayBuilder()
      .setContent(
        `# ${packageJson.name}\n` +
        `**Version:** ${packageJson.version}\n` +
        `**Author:** ${packageJson.author}\n` +
        `**Description:** ${packageJson.description}\n\n` +
        `### Links\n` +
        `[GitHub](https://github.com/ZarCodeX/pvc-discord-app-with-v2-components)`
      );

    const separator = new SeparatorBuilder();
    const container = new ContainerBuilder()
      .setAccentColor(parseInt(config.color.replace('#', ''), 16))
      .addSeparatorComponents(separator)
      .addTextDisplayComponents(aboutText)
      .addSeparatorComponents(separator);

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  },
};
