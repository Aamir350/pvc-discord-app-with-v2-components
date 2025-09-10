

// If you don't know what you are doing, then it is recommended that not to edit this file as its the important file for the pvc system
// Developer: ZarCodeX

// if you have any question, join Zarco HQ: https://discord.gg/6YVmxA4Qsf

// ❤️ Leave a ⭐ star on the repo, this will help me a lot:  
// https://github.com/ZarCodeX/pvc-discord-app-with-v2-components

// ❤️ Subscribe to my YouTube channel, this will motivate me to create more opensource bot codes:  
// https://www.youtube.com/@ZarCodeX


const {
  ChannelType,
  TextDisplayBuilder,
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ChannelSelectMenuBuilder,
  MessageFlags,
  ButtonStyle,
  MediaGalleryBuilder,
  PermissionsBitField,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const client = require('../../index');

client.pvcSetupSessions = new Map();

module.exports = {
  name: 'setupPVC',
};

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isButton() && interaction.customId.startsWith('pvc_setup_start')) {
      const guildId = interaction.customId.split('-')[1];
      const sessionId = `${guildId}_${interaction.user.id}`;
      const configPath = path.join(__dirname, '../../../data', guildId, 'PVC', 'pvc.json');
      if (fs.existsSync(configPath)) {
        const alreadySetupText = new TextDisplayBuilder().setContent(
          `❌ PVC system is already set up for this server.`
        );
        const alreadySetupContainer = new ContainerBuilder()
          .setAccentColor(0x0099ff)
          .addTextDisplayComponents(alreadySetupText);
        return interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [alreadySetupContainer.toJSON()],
        });
      }
      client.pvcSetupSessions.set(sessionId, { userId: interaction.user.id, step: 1 });
      const categorySelect = new ChannelSelectMenuBuilder()
        .setCustomId(`pvc_step1_category-${sessionId}`)
        .setChannelTypes(ChannelType.GuildCategory)
        .setPlaceholder('Select the category for PVCs');
      const step1Text = new TextDisplayBuilder().setContent(`
Select the category where the PVCs will be created. Under this category, the vc will be created.
`);
      const row = new ActionRowBuilder().addComponents(categorySelect);
      const container = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents(step1Text)
        .addActionRowComponents(row);
      return interaction.update({
        flags: MessageFlags.IsComponentsV2,
        components: [container.toJSON()],
      });
    }

    if (interaction.isChannelSelectMenu() && interaction.customId.startsWith('pvc_step')) {
      const sessionId = interaction.customId.split('-')[1];
      const session = client.pvcSetupSessions.get(sessionId);
      if (!session || interaction.user.id !== session.userId) {
        const errText = new TextDisplayBuilder().setContent(
          `❌ Only the original user can interact with this setup!`
        );
        const errContainer = new ContainerBuilder()
          .setAccentColor(0x0099ff)
          .addTextDisplayComponents(errText);
        return interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [errContainer.toJSON()],
        });
      }

      if (interaction.customId.startsWith('pvc_step1_category')) {
        const categoryId = interaction.values[0];
        const categoryChannel = interaction.guild.channels.cache.get(categoryId);
        if (!categoryChannel) {
          const noChannelText = new TextDisplayBuilder().setContent(`❌ Selected category not found.`);
          const noChannelContainer = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(noChannelText);
          return interaction.update({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [noChannelContainer.toJSON()],
          });
        }
        const requiredPerms = new PermissionsBitField([
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.ManageChannels,
          PermissionsBitField.Flags.ManageRoles,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.EmbedLinks,
          PermissionsBitField.Flags.AttachFiles,
          PermissionsBitField.Flags.UseExternalEmojis,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.Speak,
          PermissionsBitField.Flags.Stream,
          PermissionsBitField.Flags.MuteMembers,
          PermissionsBitField.Flags.DeafenMembers,
          PermissionsBitField.Flags.MoveMembers,
          PermissionsBitField.Flags.UseVAD,
        ]);
        const botPerms = categoryChannel.permissionsFor(interaction.guild.members.me);
        if (!botPerms || !botPerms.has(requiredPerms)) {
          const noPermText = new TextDisplayBuilder().setContent(
            `❌ I lack required permissions in the selected category.`
          );
          const noPermContainer = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(noPermText);
          return interaction.update({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [noPermContainer.toJSON()],
          });
        }
        session.categoryId = categoryId;
        const voiceSelect = new ChannelSelectMenuBuilder()
          .setCustomId(`pvc_step2_voice-${sessionId}`)
          .setChannelTypes(ChannelType.GuildVoice)
          .setPlaceholder('Select the generator voice channel');
        const step2Text = new TextDisplayBuilder().setContent(`
Select a generator vc, where user will join and the pvc will be created.
`);
        const row = new ActionRowBuilder().addComponents(voiceSelect);
        const container = new ContainerBuilder()
          .setAccentColor(0x0099ff)
          .addTextDisplayComponents(step2Text)
          .addActionRowComponents(row);
        return interaction.update({
          flags: MessageFlags.IsComponentsV2,
          components: [container.toJSON()],
        });
      }

      if (interaction.customId.startsWith('pvc_step2_voice')) {
        const voiceId = interaction.values[0];
        const voiceChannel = interaction.guild.channels.cache.get(voiceId);
        if (!voiceChannel) {
          const noChannelText = new TextDisplayBuilder().setContent(`❌ Selected voice channel not found.`);
          const noChannelContainer = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(noChannelText);
          return interaction.update({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [noChannelContainer.toJSON()],
          });
        }
        const requiredPerms = new PermissionsBitField([
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.ManageChannels,
          PermissionsBitField.Flags.ManageRoles,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.Speak,
        ]);
        const botPerms = voiceChannel.permissionsFor(interaction.guild.members.me);
        if (!botPerms || !botPerms.has(requiredPerms)) {
          const noPermText = new TextDisplayBuilder().setContent(
            `❌ I lack required permissions in the selected voice channel.`
          );
          const noPermContainer = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(noPermText);
          return interaction.update({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [noPermContainer.toJSON()],
          });
        }
        session.voiceId = voiceId;
        const textSelect = new ChannelSelectMenuBuilder()
          .setCustomId(`pvc_step3_text-${sessionId}`)
          .setChannelTypes(ChannelType.GuildText)
          .setPlaceholder('Select a text channel for PVC controls');
        const step3Text = new TextDisplayBuilder().setContent(`
Select a text channel, where the interface of the pvc will be sent, and users can use it to manage the pvc.
`);
        const row = new ActionRowBuilder().addComponents(textSelect);
        const container = new ContainerBuilder()
          .setAccentColor(0x0099ff)
          .addTextDisplayComponents(step3Text)
          .addActionRowComponents(row);
        return interaction.update({
          flags: MessageFlags.IsComponentsV2,
          components: [container.toJSON()],
        });
      }

      if (interaction.customId.startsWith('pvc_step3_text')) {
        const textId = interaction.values[0];
        const textChannel = interaction.guild.channels.cache.get(textId);
        if (!textChannel) {
          const noChannelText = new TextDisplayBuilder().setContent(`❌ Selected text channel not found.`);
          const noChannelContainer = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(noChannelText);
          return interaction.update({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [noChannelContainer.toJSON()],
          });
        }
        const requiredPerms = new PermissionsBitField([
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.ManageChannels,
          PermissionsBitField.Flags.ManageRoles,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
        ]);
        const botPerms = textChannel.permissionsFor(interaction.guild.members.me);
        if (!botPerms || !botPerms.has(requiredPerms)) {
          const noPermText = new TextDisplayBuilder().setContent(
            `❌ I lack required permissions in the selected text channel.`
          );
          const noPermContainer = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(noPermText);
          return interaction.update({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [noPermContainer.toJSON()],
          });
        }
        session.textId = textId;
        const dataDir = path.join(__dirname, '../../../data', interaction.guild.id, 'PVC');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(
          path.join(dataDir, 'pvc.json'),
          JSON.stringify({
            categoryId: session.categoryId,
            generatorId: session.voiceId,
            controlChannelId: session.textId,
          }, null, 2)
        );
        client.pvcSetupSessions.delete(sessionId);

        const doneText = new TextDisplayBuilder().setContent(`
✅ The PVC setup is now complete!

The **Category ID** is 
${session.categoryId}
, where generated voice channels will be created.  
The **Generator VC** is <#${session.voiceId}>, users can join to generate PVCs.  
The **Control Panel** is sent to <#${session.textId}>, where you can manage PVCs.

❤️ Leave a ⭐ star on the repo, this will help me a lot:  
-# https://github.com/ZarCodeX/pvc-discord-app-with-v2-components

❤️ Subscribe to my YouTube channel, this will motivate me to create more opensource bot codes:  
-# https://www.youtube.com/@ZarCodeX
`);

        const doneContainer = new ContainerBuilder()
          .setAccentColor(0x0099ff)
          .addTextDisplayComponents(doneText);
        await interaction.update({
          flags: MessageFlags.IsComponentsV2,
          components: [doneContainer.toJSON()],
        });

        try {
          const imagePath = path.join(__dirname, '../../assets/pvc.png');
          const controlText = new TextDisplayBuilder().setContent(
            '### Use the buttons below to control your voice channel'
          );
          const controlImage = new MediaGalleryBuilder().addItems([
            { media: { url: 'attachment://pvc.png' } },
          ]);

          const rowOne = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('1346076399672361042')
              .setCustomId(`LockChannel-${interaction.guild.id}`),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('1346076412351746158')
              .setCustomId(`UnlockChannel-${interaction.guild.id}`),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('1346076397374013440')
              .setCustomId(`HideChannel-${interaction.guild.id}`),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('1346076409839489106')
              .setCustomId(`UnhideChannel-${interaction.guild.id}`),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('1346076390596018327')
              .setCustomId(`Delete_Channel-${interaction.guild.id}`)
          );

          const rowTwo = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('1378282756567728189')
              .setCustomId(`Set_Bitrate-${interaction.guild.id}`),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('1378282706365841478')
              .setCustomId(`Set_Region-${interaction.guild.id}`),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('1346076417544421399')
              .setCustomId(`Customize_UserLimit-${interaction.guild.id}`),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('1346076393418526780')
              .setCustomId(`Disconnect-${interaction.guild.id}`),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('1346076405305446461')
              .setCustomId(`RenameChannel-${interaction.guild.id}`)
          );

          const controlContainer = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(controlText)
            .addMediaGalleryComponents(controlImage)
            .addActionRowComponents(rowOne, rowTwo);

          const textChannel = interaction.guild.channels.cache.get(session.textId);
          if (!textChannel) throw new Error('Control channel not found');

          const controlMsg = await textChannel.send({
            flags: MessageFlags.IsComponentsV2,
            files: [{ attachment: imagePath, name: 'pvc.png' }],
            components: [controlContainer.toJSON()],
          });

          let pvcConfigRaw = fs.readFileSync(path.join(dataDir, 'pvc.json'));
          let pvcConfigData = JSON.parse(pvcConfigRaw);
          pvcConfigData.controlMessageId = controlMsg.id;
          fs.writeFileSync(
            path.join(dataDir, 'pvc.json'),
            JSON.stringify(pvcConfigData, null, 2)
          );
        } catch (err) {
          console.error('Send Control Panel Error:', err);
        }
      }
    }
  } catch (error) {
    const errorText = new TextDisplayBuilder().setContent(
      `❌ Something went wrong. Please try again.`
    );
    const errorContainer = new ContainerBuilder()
      .setAccentColor(0x0099ff)
      .addTextDisplayComponents(errorText);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [errorContainer.toJSON()],
      });
    } else {
      await interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [errorContainer.toJSON()],
      });
    }
  }
});