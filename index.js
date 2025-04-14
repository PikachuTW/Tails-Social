import { Client, GatewayIntentBits, Partials, EmbedBuilder } from "discord.js";
import "dotenv/config";
import axios from "axios";
import * as cheerio from "cheerio";

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

client.once("ready", () => {
    console.log("Ready!");
});

client.on("messageCreate", async (message) => {
    if (message.content.startsWith("https://www.facebook.com/")) {
        try {
            const response = await axios.get(message.content);

            const $ = cheerio.load(response.data);

            const description = $('meta[property="og:description"]').attr("content");
            const title = $('meta[property="og:title"]').attr("content");
            const image = $('meta[property="og:image"]').attr("content");
            const url = $('meta[property="og:url"]').attr("content");

            if (!description || !title || !image || !url) return;

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setImage(image)
                .setURL(url)
                .setColor('#0099ff')
                .setFooter({ text: 'Facebook | Love from Tails'});

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`error handling facebook url\n${ error }`);
            message.reply("出現錯誤，請回報開發人員");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
