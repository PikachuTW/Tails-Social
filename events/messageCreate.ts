import {
  EmbedBuilder, type Client, type Message, type OmitPartialGroupDMChannel,
} from 'discord.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const fetchPost = async (link: string) : Promise<EmbedBuilder | undefined> => {
  const response = await axios.get(link);
  const $ = cheerio.load(response.data);

  const description = $('meta[property="og:description"]').attr('content');
  const title = $('meta[property="og:title"]').attr('content');
  const image = $('meta[property="og:image"]').attr('content');
  const url = $('meta[property="og:url"]').attr('content');

  if (!title || !url) {
    const redirectUrl = $('meta[property="og:url"]').attr('content');
    if (!redirectUrl) return undefined;
    return fetchPost(redirectUrl);
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description ?? null)
    .setImage(image ?? null)
    .setURL(url)
    .setColor('#0099ff');

  return embed;
};

export default async function onMessageCreate(
  client: Client<true>,
  message: OmitPartialGroupDMChannel<Message<boolean>>,
) {
  if (message.author.id === client.user.id) return;
  try {
    const fbUrlMatch = message.content.match(/https:\/\/www\.facebook\.com\/[^\s]+/);
    if (!fbUrlMatch || fbUrlMatch.length === 0) return;
    const embed = await fetchPost(fbUrlMatch[0]);
    if (!embed) return;
    embed.setFooter({ text: `Sent by ${message.author.username}`, iconURL: message.member?.avatarURL() ?? message.author.avatarURL() ?? undefined });
    message.reply({ embeds: [embed] });
  } catch (error) {
    console.error(`error handling facebook url\n${error}`);
    message.reply('出現錯誤，請回報開發人員');
  }
}
