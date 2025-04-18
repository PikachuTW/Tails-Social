import type { ColorResolvable } from 'discord.js';
import axios from 'axios';
import { BasicStrategy, type FetchedData } from './BasicStrategy';

export default class YoutubeStrategy extends BasicStrategy {
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
