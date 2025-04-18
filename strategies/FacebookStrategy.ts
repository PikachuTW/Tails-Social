import type { ColorResolvable } from 'discord.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { BasicStrategy, type FetchedData } from './BasicStrategy';

export default class FacebookStrategy extends BasicStrategy {
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
