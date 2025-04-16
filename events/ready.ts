import type { Client } from 'discord.js';

export default function onReady(client : Client<true>) {
  console.log(`${client.user.username} ready`);
}
