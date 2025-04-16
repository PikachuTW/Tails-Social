import {
  Client, GatewayIntentBits, Partials,
} from 'discord.js';
import 'dotenv/config';
import onReady from './events/ready';
import onMessageCreate from './events/messageCreate';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction,
    Partials.ThreadMember,
    Partials.User,
  ],
});

client.on('ready', onReady);
client.on('messageCreate', (message) => onMessageCreate(message.client, message));

client.login(process.env.DISCORD_TOKEN);
