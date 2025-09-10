

// If you don't know what you are doing, then it is recommended that not to edit this file as its the main file for the pvc system
// Developer: ZarCodeX

// if you have any question, join Zarco HQ: https://discord.gg/6YVmxA4Qsf

// ❤️ Leave a ⭐ star on the repo, this will help me a lot:  
// https://github.com/ZarCodeX/pvc-discord-app-with-v2-components

// ❤️ Subscribe to my YouTube channel, this will motivate me to create more opensource bot codes:  
// https://www.youtube.com/@ZarCodeX


const {
  ChannelType,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  ContainerBuilder,
  EmbedBuilder,
  MessageFlags,
  GuildPremiumTier,
  MediaGalleryBuilder,
} = require('discord.js');
const client = require('../../index');
const fs = require('fs');
const path = require('path');

// --- JSON Database Functions ---
function sanitizeFilename(key) {
  return key.replace(/[^a-z0-9_]/gi, '_');
}

function getDBPath(guildId, key) {
  const sanitizedKey = sanitizeFilename(key);
  const dirPath = path.join(__dirname, '..\/..\/..\/data', guildId, 'PVC', 'temp');
  return path.join(dirPath, `${sanitizedKey}.json`);
}

function db_set(guildId, key, value) {
  try {
    const filePath = getDBPath(guildId, key);
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify({ value }));
  } catch (error) {
    console.error(`[DB Error] Failed to set key ${key} for guild ${guildId}:`, error);
  }
}

function db_get(guildId, key) {
  try {
    const filePath = getDBPath(guildId, key);
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath);
      const data = JSON.parse(rawData);
      return data.value;
    }
    return null;
  } catch (error) {
    console.error(`[DB Error] Failed to get key ${key} for guild ${guildId}:`, error);
    return null;
  }
}

function db_delete(guildId, key) {
  try {
    const filePath = getDBPath(guildId, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`[DB Error] Failed to delete key ${key} for guild ${guildId}:`, error);
  }
}
// --- End JSON Database Functions ---


// Utility function for delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  name: "pvc"
};

// Helper: load the PVC configuration file (pvc.json).
function getPVCConfig(guildId) {
  const configPath = path.join(__dirname, '..\/..\/..\/data', guildId, 'PVC', 'pvc.json');
  if (!fs.existsSync(configPath)) return null;
  
  try {
    const pvcConfig = JSON.parse(fs.readFileSync(configPath));
    
    // Validate required fields
    if (!pvcConfig.generatorId || !pvcConfig.categoryId) {
      console.error(`PVC configuration incomplete for guild ${guildId}. Please complete setup.`);
      return null;
    }

    // Validate category existence
    const guild = client.guilds.cache.get(guildId);
    if (!guild?.channels?.cache?.get(pvcConfig.categoryId)) {
      return null;
    }

    return pvcConfig;
  } catch (err) {
    console.error(`Error reading PVC config for guild ${guildId}:`, err);
    return null;
  }
}

// Voice State Update Handler
client.on("voiceStateUpdate", async (oldState, newState) => {
  if (newState.member?.user?.bot) return;
  
  const guild = newState.guild || oldState.guild;
  const pvcConfig = getPVCConfig(guild.id);
  if (!pvcConfig) return;

  // 1. Delete a user's temporary VC if they leave it.
  if (oldState.channelId) {
    const tempOwnerId = oldState.member.id;
    const tempKey = `Temporary_${oldState.channelId}_${tempOwnerId}`;
    const stored = db_get(guild.id, tempKey);
    
    if (stored === oldState.channelId && newState.channelId !== oldState.channelId) {
      const channelToDelete = guild.channels.cache.get(oldState.channelId);
      
      if (channelToDelete) {
        try {
          await channelToDelete.delete();
        } catch (err) {
          if (err.code === 50001) {
            console.error("[CONSOLE ERROR] Missing Access when deleting channel:", oldState.channelId);
          } else if (![10003, 50013].includes(err.code)) {
            console.error(err);
          }
        }
      }
      db_delete(guild.id, tempKey);
    }
  }

  // 2. Create a temporary VC when a user joins the generator VC (after a 2s delay).
  if (newState.channelId === pvcConfig.generatorId) {
    const category = guild.channels.cache.get(pvcConfig.categoryId);
    if (!category) {
      console.error(`Category ${pvcConfig.categoryId} not found. Aborting PVC creation.`);
      return;
    }

    let tempChannel;
    try {
      await delay(2000);
      if (newState.channelId !== pvcConfig.generatorId) return;

      tempChannel = await guild.channels.create({
        name: `${newState.member.displayName}'s VC`,
        type: ChannelType.GuildVoice,
        parent: pvcConfig.categoryId,
        permissionOverwrites: [
          {
            id: guild.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.Connect,
              PermissionsBitField.Flags.Speak,
              PermissionsBitField.Flags.Stream
            ]
          },
          {
            id: newState.member.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.Connect,
              PermissionsBitField.Flags.Speak,
              PermissionsBitField.Flags.ManageChannels,
              PermissionsBitField.Flags.MoveMembers,
              PermissionsBitField.Flags.MuteMembers,
              PermissionsBitField.Flags.DeafenMembers
            ]
          }
        ]
      });

      db_set(guild.id, `Temporary_${tempChannel.id}_${newState.member.id}`, tempChannel.id);

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
            .setCustomId(`LockChannel-${guild.id}`),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1346076412351746158')
            .setCustomId(`UnlockChannel-${guild.id}`),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1346076397374013440')
            .setCustomId(`HideChannel-${guild.id}`),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1346076409839489106')
            .setCustomId(`UnhideChannel-${guild.id}`),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1346076390596018327')
            .setCustomId(`Delete_Channel-${guild.id}`)
        );

        const rowTwo = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1378282756567728189')
            .setCustomId(`Set_Bitrate-${guild.id}`),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1378282706365841478')
            .setCustomId(`Set_Region-${guild.id}`),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1346076417544421399')
            .setCustomId(`Customize_UserLimit-${guild.id}`),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1346076393418526780')
            .setCustomId(`Disconnect-${guild.id}`),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1346076405305446461')
            .setCustomId(`RenameChannel-${guild.id}`)
        );

        const controlContainer = new ContainerBuilder()
          .setAccentColor(0x0099ff)
          .addTextDisplayComponents(controlText)
          .addMediaGalleryComponents(controlImage)
          .addActionRowComponents(rowOne, rowTwo);

        await tempChannel.send({
          flags: MessageFlags.IsComponentsV2,
          files: [{ attachment: imagePath, name: 'pvc.png' }],
          components: [controlContainer.toJSON()],
        });
      } catch (err) {
        console.error("Failed to send controller message to new VC:", err);
      }

      await delay(2000);

      if (newState.channelId === pvcConfig.generatorId) {
        try {
          await newState.setChannel(tempChannel.id);
        } catch (err) {
          if (err.code === 40032) {
            console.warn(`${newState.member.user.tag} disconnected before move.`);
          } else if (err.code === 50001) {
            console.error("[CONSOLE ERROR] Missing Access when moving user to new VC:", tempChannel.id);
          } else {
            console.error("PVC Move Error:", err);
          }
        }
      } else {
        try {
          await tempChannel.delete();
        } catch (err) {
          if (err.code === 50001) {
            console.error("[CONSOLE ERROR] Missing Access when deleting temp VC:", tempChannel.id);
          } else if (err.code !== 10003) {
            console.error(err);
          }
        }
        db_delete(guild.id, `Temporary_${tempChannel.id}_${newState.member.id}`);
      }
    } catch (error) {
      console.error("PVC Creation Error:", error);
      if (tempChannel) {
        try {
          await tempChannel.delete();
        } catch (err) {
          if (err.code === 50001) {
            console.error("[CONSOLE ERROR] Missing Access when deleting temp VC (creation error):", tempChannel.id);
          } else if (err.code !== 10003) {
            console.error(err);
          }
        }
        db_delete(guild.id, `Temporary_${tempChannel.id}_${newState.member.id}`);
      }
    }
  }

  // 3. Transfer ownership or delete the VC if it becomes empty.
  if (oldState.channelId && !newState.channelId) {
    try {
      const wasOwner = db_get(guild.id, `Temporary_${oldState.channelId}_${oldState.member.id}`);
      if (!wasOwner) return;
      
      const channel = guild.channels.cache.get(oldState.channelId);
      if (!channel) {
        db_delete(guild.id, `Temporary_${oldState.channelId}_${oldState.member.id}`);
        return;
      }

      const members = channel.members.filter(m => !m.user.bot);
      if (members.size > 0) {
        const newOwner = members.first();
        db_delete(guild.id, `Temporary_${oldState.channelId}_${oldState.member.id}`);
        db_set(guild.id, `Temporary_${oldState.channelId}_${newOwner.id}`, oldState.channelId);
        
        try {
          await channel.setName(`${newOwner.user.displayName}'s VC`);
        } catch (error) {
          if (error.code === 50013 || error.code === 50001) {
            // Missing Permissions or Missing Access
            console.error("[CONSOLE ERROR] Rename Error (Missing Access/Permissions):", error);
          } else {
            console.error("Channel Rename Error:", error);
          }
        }
      } else {
        try {
          await channel.delete();
        } catch (err) {
          if (err.code === 50001) {
            console.error("[CONSOLE ERROR] Missing Access when deleting channel (ownership transfer):", oldState.channelId);
          } else if (![10003, 50013].includes(err.code)) {
            console.error(err);
          }
        }
        db_delete(guild.id, `Temporary_${oldState.channelId}_${oldState.member.id}`);
      }
    } catch (error) {
      console.error("PVC Ownership Transfer Error:", error);
    }
  }
});

// Interaction Create Handler
client.on("interactionCreate", async (interaction) => {
  if (interaction.user.bot) return;
  
  // Exclude removal and setup buttons
  if (interaction.isButton() && 
      (interaction.customId.startsWith('pvc_remove-') || 
       interaction.customId.startsWith('pvc_setup_'))) return;

  const guildId = interaction.guild.id;

  // REGION SELECT MENU handling
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith('Select_Region-')) {
    const voiceChannel = interaction.member.voice?.channel;
    const selectedRegion = interaction.values[0];
    const tempKey = voiceChannel && db_get(guildId, `Temporary_${voiceChannel.id}_${interaction.user.id}`);
    
    if (!voiceChannel || tempKey !== voiceChannel.id) {
      const container = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`❌ You must be in and owner of your temporary VC to set region.`)
        );
        
      await interaction.update({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container]
      });
      return;
    }

    try {
      if (selectedRegion === 'automatic') {
        await voiceChannel.setRTCRegion(null);
        const ok = new TextDisplayBuilder().setContent(`✅ Region set to automatic.`);
        const container = new ContainerBuilder()
          .setAccentColor(0x0099ff)
          .addTextDisplayComponents(ok);
        await interaction.update({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [container]
        });
        return;
      }
      
      await voiceChannel.setRTCRegion(selectedRegion);
      const ok = new TextDisplayBuilder().setContent(`✅ Region set to: ${selectedRegion}`);
      const container = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents(ok);
      await interaction.update({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container]
      });
    } catch (error) {
      console.error('Set Region Error:', error);
      const errTxt = new TextDisplayBuilder().setContent(`❌ Failed to set region!`);
      const container = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents(errTxt);
      await interaction.update({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container]
      });
    }
    return;
  }

  // USER SELECT MENU (UsersManager)
  if (interaction.isUserSelectMenu() && interaction.customId.startsWith('UsersManagerSelect-')) {
    await interaction.deferUpdate();
    const voiceChannel = interaction.member.voice?.channel;
    const tempKey = voiceChannel && db_get(guildId, `Temporary_${voiceChannel.id}_${interaction.user.id}`);
    
    if (!voiceChannel || tempKey !== voiceChannel.id) {
      const container = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`❌ You can't control these buttons because you are not the owner of this VC.`)
        );
      await interaction.followUp({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container]
      });
      return;
    }

    const selectedUserId = interaction.values[0];
    db_set(guildId, `UsersManagerSelection_${interaction.user.id}_${guildId}`, selectedUserId);
    
    const container = new ContainerBuilder()
      .setAccentColor(0x0099ff)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`✅ Selected <@${selectedUserId}> for management.`)
      );
    await interaction.followUp({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [container]
    });
    return;
  }

  // BUTTONS & MODALS handling
  if (!interaction.isButton() && !interaction.isModalSubmit()) return;
  const [action] = interaction.customId?.split('-') || [];
  if (!guildId) return;
  
  const configPathInteraction = path.join(__dirname, '..\/..\/..\/data', guildId, 'PVC', 'pvc.json');
  if (!fs.existsSync(configPathInteraction)) return;
  
  if (interaction.isButton() && 
      !['RenameChannel', 'Customize_UserLimit', 'Set_Bitrate', 'Set_Region', 'confirm_delete', 'cancel_delete'].includes(action)) {
    const voiceChannel = interaction.member.voice?.channel;
    const tempKey = voiceChannel && db_get(guildId, `Temporary_${voiceChannel.id}_${interaction.user.id}`);
    
    if (!voiceChannel || tempKey !== voiceChannel.id) {
      const container = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`❌ You must be in and owner of your temporary VC to use these controls.`)
        );
        
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container]
          });
        } else {
          await interaction.reply({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container]
          });
        }
      } catch (error) {
        console.error('Error during owner check response:', error);
      }
      return;
    }
  }

  try {
    if (interaction.isButton() && ['RenameChannel', 'Customize_UserLimit', 'Set_Bitrate', 'Set_Region'].includes(action)) {
      const voiceChannel = interaction.member.voice?.channel;
      const tempKey = voiceChannel && db_get(guildId, `Temporary_${voiceChannel.id}_${interaction.user.id}`);
      
      if (!voiceChannel || tempKey !== voiceChannel.id) {
        const container = new ContainerBuilder()
          .setAccentColor(0x0099ff)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`❌ You must be in and owner of your temporary VC to use these controls.`)
          );
        return await interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [container]
        });
      }

      if (action === 'Set_Region') {
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`Select_Region-${guildId}`)
          .setPlaceholder('Select a region')
          .addOptions([
            { label: 'Automatic', value: 'automatic' },
            { label: 'Brazil', value: 'brazil' },
            { label: 'Hong Kong', value: 'hongkong' },
            { label: 'India', value: 'india' },
            { label: 'Japan', value: 'japan' },
            { label: 'Rotterdam', value: 'rotterdam' },
            { label: 'Singapore', value: 'singapore' },
            { label: 'South Korea', value: 'south-korea' },
            { label: 'South Africa', value: 'southafrica' },
            { label: 'Sydney', value: 'sydney' },
            { label: 'US Central', value: 'us-central' },
            { label: 'US East', value: 'us-east' },
            { label: 'US South', value: 'us-south' },
            { label: 'US West', value: 'us-west' },
          ]);
          
        const row = new ActionRowBuilder().addComponents(selectMenu);
        const container = new ContainerBuilder()
          .setAccentColor(0x0099ff)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('Choose a region from the dropdown below:')
          );
        return await interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [container, row]
        });
      }

      let modal;
      if (action === 'RenameChannel') {
        modal = new ModalBuilder()
          .setCustomId(`RenameModal-${guildId}`)
          .setTitle('Rename Channel');
        const nameInput = new TextInputBuilder()
          .setCustomId('name')
          .setLabel('New Channel Name')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50);
        modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
      }
      else if (action === 'Customize_UserLimit') {
        modal = new ModalBuilder()
          .setCustomId(`Customize_UserLimit-${guildId}`)
          .setTitle('Set User Limit');
        const limitInput = new TextInputBuilder()
          .setCustomId('limit')
          .setLabel('Max Users (0-99)')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(2)
          .setPlaceholder('0-99');
        modal.addComponents(new ActionRowBuilder().addComponents(limitInput));
      }
      else if (action === 'Set_Bitrate') {
        modal = new ModalBuilder()
          .setCustomId(`SetBitrateModal-${guildId}`)
          .setTitle('Set Channel Bitrate');
        const voiceChannel = interaction.member.voice?.channel;
        
        if (!voiceChannel) {
          const container = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`❌ You must be in a voice channel to set bitrate.`));
          return await interaction.reply({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container]
          });
        }

        const tier = voiceChannel.guild.premiumTier;
        let maxBps;
        switch (tier) {
          case GuildPremiumTier.Tier1:
            maxBps = 128000; break;
          case GuildPremiumTier.Tier2:
            maxBps = 256000; break;
          case GuildPremiumTier.Tier3:
            maxBps = 384000; break;
          default:
            maxBps = 96000;
        }
        const maxKbps = maxBps / 1000;
        const minKbps = 8;
        const bitrateInput = new TextInputBuilder()
          .setCustomId('bitrate')
          .setLabel(`Bitrate in kbps (${minKbps}-${maxKbps})`)
          .setStyle(TextInputStyle.Short)
          .setPlaceholder(`Enter a number between ${minKbps} and ${maxKbps}`)
          .setMaxLength(String(maxKbps).length);
        modal.addComponents(new ActionRowBuilder().addComponents(bitrateInput));
      }
      return await interaction.showModal(modal);
    }

    if (interaction.isButton()) {
      await interaction.deferUpdate();
      const voiceChannel = interaction.member.voice?.channel;
      
      if (!voiceChannel) {
        const container = new ContainerBuilder()
          .setAccentColor(0x0099ff)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`❌ You must be in a voice channel to use these controls.`)
          );
        return await interaction.followUp({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [container]
        });
      }

      const missingPermsContainer = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`❌ Missing permissions. Ensure I have **Manage Channels** and **View Channels**.`)
        );

      switch (action) {
        case 'LockChannel':
          try {
            await voiceChannel.permissionOverwrites.edit(
              interaction.guild.roles.everyone.id,
              { Connect: false }
            );
            const container = new ContainerBuilder()
              .setAccentColor(0x0099ff)
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`✅ Channel locked.`)
              );
            await interaction.followUp({
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
              components: [container]
            });
          } catch (err) {
            if (err.code === 50013 || err.code === 50001) {
              // Missing Permissions or Missing Access
              return await interaction.followUp({
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                components: [missingPermsContainer]
              });
            }
            console.error('Lock Channel Error:', err);
            const container = new ContainerBuilder()
              .setAccentColor(0x0099ff)
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`❌ Failed to lock channel.`)
              );
            await interaction.followUp({
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
              components: [container]
            });
          }
          break;

        case 'UnlockChannel':
          try {
            await voiceChannel.permissionOverwrites.edit(
              interaction.guild.roles.everyone.id,
              { Connect: true }
            );
            const container = new ContainerBuilder()
              .setAccentColor(0x0099ff)
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`✅ Channel unlocked.`)
              );
            await interaction.followUp({
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
              components: [container]
            });
          } catch (err) {
            if (err.code === 50013 || err.code === 50001) {
              return await interaction.followUp({
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                components: [missingPermsContainer]
              });
            }
            console.error('Unlock Channel Error:', err);
            const container = new ContainerBuilder()
              .setAccentColor(0x0099ff)
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`❌ Failed to unlock channel.`)
              );
            await interaction.followUp({
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
              components: [container]
            });
          }
          break;

        case 'HideChannel':
          try {
            await voiceChannel.permissionOverwrites.edit(
              interaction.guild.roles.everyone.id,
              { ViewChannel: false }
            );
            const container = new ContainerBuilder()
              .setAccentColor(0x0099ff)
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`✅ Channel hidden.`)
              );
            await interaction.followUp({
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
              components: [container]
            });
          } catch (err) {
            if (err.code === 50013 || err.code === 50001) {
              return await interaction.followUp({
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                components: [missingPermsContainer]
              });
            }
            console.error('Hide Channel Error:', err);
            const container = new ContainerBuilder()
              .setAccentColor(0x0099ff)
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`❌ Failed to hide channel.`)
              );
            await interaction.followUp({
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
              components: [container]
            });
          }
          break;

        case 'UnhideChannel':
          try {
            await voiceChannel.permissionOverwrites.edit(
              interaction.guild.roles.everyone.id,
              { ViewChannel: true }
            );
            const container = new ContainerBuilder()
              .setAccentColor(0x0099ff)
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`✅ Channel unhidden.`)
              );
            await interaction.followUp({
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
              components: [container]
            });
          } catch (err) {
            if (err.code === 50013 || err.code === 50001) {
              return await interaction.followUp({
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                components: [missingPermsContainer]
              });
            }
            console.error('Unhide Channel Error:', err);
            const container = new ContainerBuilder()
              .setAccentColor(0x0099ff)
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`❌ Failed to unhide channel.`)
              );
            await interaction.followUp({
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
              components: [container]
            });
          }
          break;

        case 'Disconnect':
          let disconnectError = false;
          for (const [memberId, member] of voiceChannel.members) {
            if (memberId !== interaction.user.id && !member.user.bot) {
              try {
                await member.voice.disconnect();
              } catch (err) {
                if (err.code === 50013 || err.code === 50001) {
                  disconnectError = true;
                  break;
                }
              }
            }
          }
          
          if (disconnectError) {
            await interaction.followUp({
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
              components: [missingPermsContainer]
            });
          } else {
            const container = new ContainerBuilder()
              .setAccentColor(0x0099ff)
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`✅ All users disconnected.`)
              );
            await interaction.followUp({
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
              components: [container]
            });
          }
          break;

        case 'Delete_Channel':
          const confirmContainer = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`❗ Are you sure you want to delete this VC?`)
            );
          const confirmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`confirm_delete-${guildId}`)
              .setLabel('Yes, delete it')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`cancel_delete-${guildId}`)
              .setLabel('Cancel')
              .setStyle(ButtonStyle.Secondary)
          );
          await interaction.followUp({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [confirmContainer, confirmRow]
          });
          break;

        case 'confirm_delete':
          try {
            const voiceChannel = interaction.member.voice?.channel;
            if (!voiceChannel) {
              const container = new ContainerBuilder()
                .setAccentColor(0x0099ff)
                .addTextDisplayComponents(
                  new TextDisplayBuilder().setContent(`❌ You must be in a voice channel to delete it.`)
                );
              return await interaction.followUp({
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                components: [container]
              });
            }
            
            const tempKey = `Temporary_${voiceChannel.id}_${interaction.user.id}`;
            const stored = db_get(guildId, tempKey);
            
            if (!voiceChannel || stored !== voiceChannel.id) {
              const container = new ContainerBuilder()
                .setAccentColor(0x0099ff)
                .addTextDisplayComponents(
                  new TextDisplayBuilder().setContent(`❌ You no longer own this VC.`)
                );
              return await interaction.followUp({
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                components: [container]
              });
            }
            
            db_delete(guildId, `Temporary_${voiceChannel.id}_${interaction.user.id}`);
            try {
              await voiceChannel.delete();
            } catch (err) {
              if (err.code === 50013 || err.code === 50001) {
                return await interaction.followUp({
                  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                  components: [missingPermsContainer]
                });
              }
              throw err;
            }
            
            const container = new ContainerBuilder()
              .setAccentColor(0x0099ff)
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`✅ Channel deleted.`)
              );
            await interaction.followUp({
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
              components: [container]
            });
          } catch (err) {
            if (err.code === 50013 || err.code === 50001) {
              return await interaction.followUp({
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                components: [missingPermsContainer]
              });
            }
            console.error('Delete Channel Error:', err);
            const container = new ContainerBuilder()
              .setAccentColor(0x0099ff)
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`❌ Failed to delete channel.`)
              );
            await interaction.followUp({
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
              components: [container]
            });
          }
          break;

        case 'cancel_delete':
          const cancelContainer = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`✅ Channel deletion cancelled.`)
            );
          await interaction.followUp({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [cancelContainer]
          });
          break;
      }
      return;
    }

    // MODAL SUBMISSIONS
    if (interaction.isModalSubmit()) {
      const [modalAction] = interaction.customId.split('-');
      const voiceChannel = interaction.member.voice?.channel;
      
      if (!voiceChannel) {
        const container = new ContainerBuilder()
          .setAccentColor(0x0099ff)
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`❌ You must be in a voice channel to use this command.`));
        return await interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [container]
        });
      }

      const missingPermsContainer = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`❌ Missing permissions. Ensure I have **Manage Channels** and **View Channels**.`)
        );

      if (modalAction === 'RenameModal') {
        const newName = interaction.fields.getTextInputValue('name');
        try {
          await voiceChannel.setName(newName);
          const container = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`✅ Renamed to: ${newName}`)
            );
          await interaction.reply({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container]
          });
        } catch (error) {
          if (error.code === 50013 || error.code === 50001) {
            return await interaction.reply({
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
              components: [missingPermsContainer]
            });
          }
          console.error('[CONSOLE ERROR] Rename Error:', error);
          const container = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`❌ Failed to rename.`)
            );
          await interaction.reply({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container]
          });
        }
      } else if (modalAction === 'Customize_UserLimit') {
        const newLimit = interaction.fields.getTextInputValue('limit');
        if (!/^\d+$/.test(newLimit)) {
          const container = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`❌ Invalid! Enter a number 0–99.`)
            );
          return await interaction.reply({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container]
          });
        }
        
        const parsedLimit = parseInt(newLimit);
        if (parsedLimit < 0 || parsedLimit > 99) {
          const container = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`❌ Limit must be 0–99.`)
            );
          return await interaction.reply({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container]
          });
        }
        
        try {
          await voiceChannel.setUserLimit(parsedLimit === 0 ? 0 : parsedLimit);
          const container = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `✅ User limit: ${parsedLimit === 0 ? 'Unlimited' : parsedLimit}`
              )
            );
          await interaction.reply({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container]
          });
        } catch (error) {
          if (error.code === 50013) {
            return await interaction.reply({
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
              components: [missingPermsContainer]
            });
          }
          console.error('User Limit Error:', error);
          const container = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`❌ Failed to set limit.`)
            );
          await interaction.reply({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container]
          });
        }
      } else if (modalAction === 'SetBitrateModal') {
        const bitrateValue = interaction.fields.getTextInputValue('bitrate');
        if (!/^\d+$/.test(bitrateValue)) {
          const container = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`❌ Invalid! Enter a numeric bitrate.`)
            );
          return await interaction.reply({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container]
          });
        }
        
        const parsedKbps = parseInt(bitrateValue);
        const tier = voiceChannel.guild.premiumTier;
        let maxBps;
        switch (tier) {
          case GuildPremiumTier.Tier1:
            maxBps = 128000; break;
          case GuildPremiumTier.Tier2:
            maxBps = 256000; break;
          case GuildPremiumTier.Tier3:
            maxBps = 384000; break;
          default:
            maxBps = 96000;
        }
        const maxKbps = maxBps / 1000;
        const minKbps = 8;
        
        if (parsedKbps < minKbps || parsedKbps > maxKbps) {
          const container = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`❌ Bitrate must be between ${minKbps} and ${maxKbps} kbps.`)
            );
          return await interaction.reply({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container]
          });
        }
        
        const bitrateBps = parsedKbps * 1000;
        try {
          await voiceChannel.setBitrate(bitrateBps);
          const container = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`✅ Bitrate set to ${parsedKbps} kbps.`)
            );
          await interaction.reply({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container]
          });
        } catch (error) {
          if (error.code === 50013) {
            return await interaction.reply({
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
              components: [missingPermsContainer]
            });
          }
          console.error('Set Bitrate Error:', error);
          const container = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`❌ Failed to set bitrate.`)
            );
          await interaction.reply({
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            components: [container]
          });
        }
      }
      return;
    }
  } catch (error) {
    console.error('PVC Interaction Error:', error);
    const container = new ContainerBuilder()
      .setAccentColor(0x0099ff)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ Action failed!`)
      );
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [container]
        });
      } else {
        await interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [container]
        });
      }
    } catch {}
  }
});