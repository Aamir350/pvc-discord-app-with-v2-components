// src/zarco.js
require('dotenv').config();
const { ClusterManager } = require('discord-hybrid-sharding');
const path = require('path');
const config = require('./config/config.json');

const manager = new ClusterManager(
  path.join(__dirname, 'index.js'),
  {
    totalShards: 'auto',
    shardsPerClusters: 2,
    totalClusters: 'auto',
    mode: 'process',
    token: process.env.TOKEN
  }
);

manager.on('clusterCreate', cluster => {
  console.log(`Cluster ${cluster.id} created`);
});

manager.spawn({ timeout: -1 });

// If you don't know what you are doing, then it is recommended that not to edit this file because it may break bot and cause errors
// Developer: ZarCodeX

// if you have any question, join Zarco HQ: https://discord.gg/6YVmxA4Qsf

// ❤️ Leave a ⭐ star on the repo, this will help me a lot:  
// https://github.com/ZarCodeX/pvc-discord-app-with-v2-components

// ❤️ Subscribe to my YouTube channel, this will motivate me to create more opensource bot codes:  
// https://www.youtube.com/@ZarCodeX
