import {
  EmbedBuilder, type ColorResolvable, type Message, type OmitPartialGroupDMChannel,
} from 'discord.js';

export interface FetchedData {
  title: string;
  description?: string;
  url: string;
  image?: string;
}

export abstract class BasicStrategy {
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
