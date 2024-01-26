import {
  EmbedBuilder, Guild, Role,
  TextChannel
} from "discord.js";
import { genColor } from "./colorGen";

export type News = {
  title: string
  body: string
  imageURL: string
  author: string
  authorPfp: string
  createdAt: string
  updatedAt: string
  messageId?: string
}

export async function sendChannelNews(guild: Guild, news: News, id: string) {
  const db = await database();
  const newsTable = await getNewsTable(db);

  const subscribedChannel = await newsTable.get(`${guild.id}.channel`).then(
    (channel: { channelId: string | null; roleId: string | null; }) => channel as { channelId: string | null, roleId: string | null }
  ).catch(() => {
    return {
      channelId: null as string | null,
      roleId: null as string | null
    };
  });

  if (!subscribedChannel) return;
  const channel = subscribedChannel.channelId;
  const channelToSend = guild.channels.cache.get(channel) as TextChannel;
  if (!channelToSend) return;

  const role = subscribedChannel.roleId;
  let roleToSend: Role | undefined;
  if (role) roleToSend = guild.roles.cache.get(role);

  const embed = new EmbedBuilder()
    .setAuthor({ name: news.author, iconURL: news.authorPfp ?? null })
    .setTitle(news.title)
    .setDescription(news.body)
    .setImage(news.imageURL || null)
    .setTimestamp(parseInt(news.updatedAt))
    .setFooter({ text: `Latest news from ${guild.name}` })
    .setColor(genColor(200));

  const message = await channelToSend.send({ embeds: [embed], content: roleToSend ? `<@&${roleToSend.id}>` : undefined });
  await newsTable.set(`${guild.id}.news.${id}.messageId`, message.id);
  return;
}
