

// If you don't know what you are doing, then it is recommended that not to edit this file as its the important file for the pvc system
// Developer: ZarCodeX

// if you have any question, join Zarco HQ: https://discord.gg/6YVmxA4Qsf

// ❤️ Leave a ⭐ star on the repo, this will help me a lot:  
// https://github.com/ZarCodeX/pvc-discord-app-with-v2-components

// ❤️ Subscribe to my YouTube channel, this will motivate me to create more opensource bot codes:  
// https://www.youtube.com/@ZarCodeX


const client = require('../../index');
const {
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags
} = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: "removePVC",
};

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() || !interaction.customId.startsWith('pvc_remove-')) return;

  const guildId = interaction.guild?.id;
  if (!guildId) return;

  const dataDir = path.join(__dirname, '../../../data', guildId, 'PVC');
  const pvcConfigPath = path.join(dataDir, 'pvc.json');

  try {
    if (!fs.existsSync(pvcConfigPath)) {
      const errorText = new TextDisplayBuilder().setContent(
        `❌ PVC system is not configured for this server.`
      );
      const errorContainer = new ContainerBuilder()
        .addTextDisplayComponents(errorText);

      return await interaction.update({
        flags: MessageFlags.IsComponentsV2,
        components: [errorContainer]
      });
    }

    let pvcConfig = {};
    try {
      pvcConfig = JSON.parse(fs.readFileSync(pvcConfigPath));
    } catch (parseErr) {
      console.error("Error parsing PVC config:", parseErr);
    }
    const controlChannelId = pvcConfig.controlChannelId;
    const controlMessageId = pvcConfig.controlMessageId;

    if (controlChannelId && controlMessageId) {
      try {
        const controlChannel = await client.channels.fetch(controlChannelId);
        if (controlChannel && controlChannel.isTextBased()) {
          const controlMessage = await controlChannel.messages.fetch(controlMessageId);
          if (controlMessage) await controlMessage.delete();
        }
      } catch (deleteErr) {
        console.error("Error deleting control panel message:", deleteErr);
      }
    }

    fs.unlinkSync(pvcConfigPath);

    try {
      fs.rmSync(dataDir, { recursive: true, force: true });
    } catch (err) {
      console.error("Error deleting PVC folder:", err);
    }

    const successText = new TextDisplayBuilder().setContent(`
✅ PVC system configuration has been successfully removed.

All temporary voice channels will no longer be managed.  

❤️ Leave a ⭐ star on the repo, this will help me a lot:  
-# https://github.com/ZarCodeX/pvc-discord-app-with-v2-components

❤️ Subscribe to my YouTube channel, this will motivate me to create more opensource bot codes:  
-# https://www.youtube.com/@ZarCodeX

You can remove this message by editing \`src/events/client/removePVC.js\`.
`);
    const successContainer = new ContainerBuilder()
      .addTextDisplayComponents(successText);

    return await interaction.update({
      flags: MessageFlags.IsComponentsV2,
      components: [successContainer]
    });

  } catch (err) {
    console.error("Remove PVC Error:", err);

    const failText = new TextDisplayBuilder().setContent(
      `❌ Failed to remove PVC system configuration. Check my permissions.`
    );
    const failContainer = new ContainerBuilder()
      .addTextDisplayComponents(failText);

    try {
      if (interaction.deferred || interaction.replied) {
        return await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [failContainer]
        });
      } else {
        return await interaction.update({
          flags: MessageFlags.IsComponentsV2,
          components: [failContainer]
        });
      }
    } catch (finalErr) {
      console.error("Failed to send error message:", finalErr);
    }
  }
});
