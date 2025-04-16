import {
  EmbedBuilder, type Client, type Message, type OmitPartialGroupDMChannel,
} from 'discord.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const fetchFacebookPost = async (link: string) : Promise<EmbedBuilder | undefined> => {
  const response = await axios.get(link);
  const $ = cheerio.load(response.data);

  const description = $('meta[property="og:description"]').attr('content');
  const title = $('meta[property="og:title"]').attr('content');
  const image = $('meta[property="og:image"]').attr('content');
  const url = $('meta[property="og:url"]').attr('content');

  if (!title || !url) {
    const redirectUrl = $('meta[property="og:url"]').attr('content');
    if (!redirectUrl) return undefined;
    return fetchFacebookPost(redirectUrl);
  }

  console.log(title, description, image, url);

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description ?? null)
    .setImage(image ?? null)
    .setURL(url)
    .setColor('#0099ff');

  return embed;
};

const handleFacebook = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
  const fbUrlMatch = message.content.match(/https:\/\/www\.facebook\.com\/[^\s]+/);
  if (!fbUrlMatch) return;
  const embed = await fetchFacebookPost(fbUrlMatch[0]);
  if (!embed) return;
  embed.setFooter({ text: `Facebook | Sent by ${message.author.username}`, iconURL: message.member?.avatarURL() ?? message.author.avatarURL() ?? undefined });
  message.reply({ embeds: [embed] });
};

const fetchYoutubePost = async (link: string): Promise<EmbedBuilder | undefined> => {
  const response = await axios.get(link);

  const ytMatch = response.data.match(/"urlCanonical":"(.*?)","title":"(.*?)","description":"(.*?)"/);
  if (!ytMatch) return undefined;

  const thumbnailMatch = response.data.match(/"thumbnail":{"thumbnails":\[\{"url":"(.*?)"/);
  const thumbnail = thumbnailMatch ? thumbnailMatch[1] : null;

  console.log(thumbnailMatch.length);
  console.log(thumbnail);

  const embed = new EmbedBuilder()
    .setTitle(ytMatch[2])
    .setDescription(ytMatch[3])
    .setURL(ytMatch[1])
    .setImage(thumbnail);
  return embed;
};

const handleYoutube = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
  const youtubeUrlMatch = message.content.match(/https:\/\/www\.youtube\.com\/channel\/[^\s]+/);
  if (!youtubeUrlMatch) return;
  const embed = await fetchYoutubePost(youtubeUrlMatch[0]);
  if (!embed) return;
  embed.setFooter({
    text: `Youtube | Sent by ${message.author.username}`,
    iconURL: message.member?.avatarURL() ?? message.author.avatarURL() ?? undefined,
  });
  message.reply({ embeds: [embed] });
};

export default async function onMessageCreate(
  client: Client<true>,
  message: OmitPartialGroupDMChannel<Message<boolean>>,
) {
  if (message.author.id === client.user.id) return;
  try {
    await handleFacebook(message);
    await handleYoutube(message);
  } catch (error) {
    console.error(`error handling facebook url\n${error}`);
    message.reply('出現錯誤，請回報開發人員');
  }
}
