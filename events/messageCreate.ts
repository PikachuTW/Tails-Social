import type { Client, Message, OmitPartialGroupDMChannel } from 'discord.js';
import type { BasicStrategy } from '../strategies/BasicStrategy';
import FacebookStrategy from '../strategies/FacebookStrategy';
import YoutubeStrategy from '../strategies/YoutubeStrategy';

const strategies: BasicStrategy[] = [
  new FacebookStrategy(),
  new YoutubeStrategy(),
];

export default async function onMessageCreate(
  client: Client<true>,
  message: OmitPartialGroupDMChannel<Message<boolean>>,
) {
  if (message.author.id === client.user.id) return;

  await Promise.all(
    strategies.map((strategy) => strategy.handle(message).catch((err) => console.error(`error in ${strategy.sourceName}\n${err}`))),
  );
}
