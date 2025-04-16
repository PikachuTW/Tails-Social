import {
  EmbedBuilder, type Client, type Message, type OmitPartialGroupDMChannel,
} from 'discord.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const FACEBOOK_URL_REGEX = /https:\/\/www\.facebook\.com\/[^\s]+/;
const YOUTUBE_URL_REGEX = /https:\/\/www\.youtube\.com\/channel\/[^\s]+/;
const YOUTUBE_CONTENT_REGEX = /"urlCanonical":"(.*?)","title":"(.*?)","description":"(.*?)"/;
const YOUTUBE_THUMBNAIL_REGEX = /"thumbnail":{"thumbnails":\[\{"url":"(.*?)"/;

interface MessageStrategy {
  match: (message: OmitPartialGroupDMChannel<Message<boolean>>) => boolean;
  handle: (message: OmitPartialGroupDMChannel<Message<boolean>>) => Promise<void>;
}

const fetchFacebookPost = async (link: string) : Promise<EmbedBuilder | undefined> => {
  try {
    const response = await axios.get(link);
    const $ = cheerio.load(response.data);

    const description = $('meta[property="og:description"]').attr('content');
    const title = $('meta[property="og:title"]').attr('content');
    const image = $('meta[property="og:image"]').attr('content');
    const url = $('meta[property="og:url"]').attr('content');

    if (!title || !url) {
      const redirectUrl = $('meta[property="og:url"]').attr('content');
      if (!redirectUrl) return undefined;
      return await fetchFacebookPost(redirectUrl);
    }

    console.log(title, description, image, url);

    return new EmbedBuilder()
      .setTitle(title)
      .setDescription(description ?? null)
      .setImage(image ?? null)
      .setURL(url)
      .setColor('#0099ff');
  } catch (error) {
    console.error(`error fetching youtube post\n${error}`);
    return undefined;
  }
};

const facebookStrategy: MessageStrategy = {
  match: (message) => FACEBOOK_URL_REGEX.test(message.content),
  handle: async (message) => {
    const fbUrlMatch = message.content.match(FACEBOOK_URL_REGEX);
    if (!fbUrlMatch) return;
    const embed = await fetchFacebookPost(fbUrlMatch[0]);
    if (!embed) return;
    embed.setFooter({ text: `Facebook | Sent by ${message.author.username}`, iconURL: message.member?.avatarURL() ?? message.author.avatarURL() ?? undefined });
    await message.reply({ embeds: [embed] });
  },
};

const fetchYoutubePost = async (link: string): Promise<EmbedBuilder | undefined> => {
  try {
    const response = await axios.get(link);

    const ytMatch = response.data.match(YOUTUBE_CONTENT_REGEX);
    if (!ytMatch) return undefined;

    const thumbnailMatch = response.data.match(YOUTUBE_THUMBNAIL_REGEX);
    const thumbnail = thumbnailMatch ? thumbnailMatch[1] : null;

    return new EmbedBuilder()
      .setTitle(ytMatch[2])
      .setDescription(ytMatch[3])
      .setURL(ytMatch[1])
      .setImage(thumbnail);
  } catch (error) {
    console.error(`error fetching youtube post\n${error}`);
    return undefined;
  }
};

const youtubeStrategy: MessageStrategy = {
  match: (message) => YOUTUBE_URL_REGEX.test(message.content),
  handle: async (message) => {
    const youtubeUrlMatch = message.content.match(YOUTUBE_URL_REGEX);
    if (!youtubeUrlMatch) return;
    const embed = await fetchYoutubePost(youtubeUrlMatch[0]);
    if (!embed) return;
    embed.setFooter({
      text: `Youtube | Sent by ${message.author.username}`,
      iconURL: message.member?.avatarURL() ?? message.author.avatarURL() ?? undefined,
    });
    await message.reply({ embeds: [embed] });
  },
};

const strategies: MessageStrategy[] = [
  facebookStrategy,
  youtubeStrategy,
];

export default async function onMessageCreate(
  client: Client<true>,
  message: OmitPartialGroupDMChannel<Message<boolean>>,
) {
  if (message.author.id === client.user.id) return;
  try {
    strategies.forEach(async (strategy) => {
      if (strategy.match(message)) {
        await strategy.handle(message);
      }
    });
  } catch (error) {
    console.error(`error handling facebook url\n${error}`);
    message.reply('出現錯誤，請回報開發人員');
  }
}
