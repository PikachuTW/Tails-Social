import {
  EmbedBuilder, type Client, type ColorResolvable, type Message, type OmitPartialGroupDMChannel,
} from 'discord.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface FetchedData {
  title: string;
  description?: string;
  url: string;
  image?: string;
}

abstract class BasicStrategy {
  abstract readonly sourceName: string;

  protected abstract readonly regex: RegExp;

  protected abstract readonly embedColor: ColorResolvable;

  protected abstract fetchData(link: string): Promise<FetchedData | undefined>;

  async handle(message: OmitPartialGroupDMChannel<Message<boolean>>) {
    const match = message.content.match(this.regex);
    if (!match) return;

    try {
      const data = await this.fetchData(match[0]);
      if (!data) return;
      const embed = new EmbedBuilder()
        .setTitle(data.title)
        .setDescription(data.description ?? null)
        .setURL(data.url)
        .setImage(data.image ?? null)
        .setColor(this.embedColor)
        .setFooter({
          text: `${this.sourceName} | Sent by ${message.author.username}`,
          iconURL: message.member?.avatarURL() ?? message.author.avatarURL() ?? undefined,
        });
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`error in ${this.sourceName}\n${error}`);
      message.reply('出現錯誤，請回報開發人員');
    }
  }
}

class FacebookStrategy extends BasicStrategy {
  readonly sourceName = 'Facebook';

  protected readonly regex = /https:\/\/www\.facebook\.com\/[^\s]+/;

  protected readonly embedColor: ColorResolvable = '#1877F2';

  protected async fetchData(link: string): Promise<FetchedData | undefined> {
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
        const redirectedData = await this.fetchData(redirectUrl);
        return redirectedData;
      }

      return {
        title, description, url, image,
      };
    } catch (error) {
      console.error(`error fetching ${this.sourceName} post\n${error}`);
      return undefined;
    }
  }
}

class YoutubeStrategy extends BasicStrategy {
  readonly sourceName = 'Youtube';

  protected readonly regex = /https:\/\/www\.youtube\.com\/channel\/[^\s]+/;

  protected readonly embedColor: ColorResolvable = '#FF0000';

  private static readonly CONTENT_REGEX = /"urlCanonical":"(.*?)","title":"(.*?)","description":"(.*?)"/;

  private static readonly THUMBNAIL_REGEX = /"thumbnail":{"thumbnails":\[\{"url":"(.*?)"/;

  async fetchData(link: string): Promise<FetchedData | undefined> {
    try {
      const response = await axios.get(link);

      const ytMatch = response.data.match(YoutubeStrategy.CONTENT_REGEX);
      if (!ytMatch) return undefined;

      const thumbnailMatch = response.data.match(YoutubeStrategy.THUMBNAIL_REGEX);
      const thumbnail = thumbnailMatch ? thumbnailMatch[1] : null;

      return {
        title: ytMatch[2],
        description: ytMatch[3],
        url: ytMatch[1],
        image: thumbnail,
      };
    } catch (error) {
      console.error(`error fetching ${this.sourceName} post\n${error}`);
      return undefined;
    }
  }
}

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
