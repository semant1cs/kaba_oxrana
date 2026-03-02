const { Client, GatewayIntentBits, Partials, Events } = require("discord.js");
const { config } = require("dotenv");
const { detectGlasses } = require("./vision/detectGlasses");

config();

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.GUILD_ID;
const verifiedRoleId = process.env.VERIFIED_ROLE_ID;
const verifyChannelId = process.env.VERIFY_CHANNEL_ID || null;

if (!token || !guildId || !verifiedRoleId) {
  console.error("Missing required environment variables. Check DISCORD_TOKEN, GUILD_ID, VERIFIED_ROLE_ID.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.Message]
});

client.once(Events.ClientReady, async readyClient => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "help") {
    const helpText =
      "Это бот верификации сервера.\n\n" +
      "Как проходит верификация:\n" +
      "1. Используй команду /verify.\n" +
      "2. Прикрепи одно актуальное фото с твоим лицом.\n" +
      "   - Лицо должно быть хорошо видно и в кадре только ты.\n" +
      "   - Без сильных фильтров, масок, стикеров и размытия.\n" +
      "   - Фото должно быть достаточно чётким и не слишком тёмным.\n" +
      "3. Дождись решения — бот автоматически одобрит или отклонит верификацию.\n" +
      "4. При необходимости модерация может запросить дополнительное фото или проверку.\n\n" +
      "Нарушение правил сервера или попытки обмануть систему могут привести к отказу верификации.";

    await interaction.reply({ content: helpText, ephemeral: true });
    return;
  }

  if (interaction.commandName === "verify") {
    if (verifyChannelId && interaction.channelId !== verifyChannelId) {
      await interaction.reply({
        content: "Эту команду нужно использовать в специальном канале для верификации.",
        ephemeral: true
      });
      return;
    }

    const attachment = interaction.options.getAttachment("photo");

    if (!attachment) {
      await interaction.reply({
        content: "Прикрепи одно фото с твоим лицом к команде.",
        ephemeral: true
      });
      return;
    }

    if (!attachment.contentType || !attachment.contentType.startsWith("image/")) {
      await interaction.reply({
        content: "Нужно прикрепить именно изображение.",
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    let imageBuffer;
    try {
      const response = await fetch(attachment.url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error(error);
      await interaction.editReply("Не удалось загрузить изображение. Попробуй ещё раз позже.");
      return;
    }

    let hasGlasses;
    try {
      hasGlasses = await detectGlasses(imageBuffer);
    } catch (error) {
      console.error(error);
      await interaction.editReply("Произошла ошибка при обработке фото. Попробуй ещё раз позже.");
      return;
    }
    console.log(interaction.guild)

    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member) {
      await interaction.editReply("Не удалось найти участника на сервере.");
      return;
    }

    if (hasGlasses) {
      await interaction.editReply(
        "К сожалению, сейчас верификация отклонена. Если считаешь это ошибкой, свяжись с модерацией сервера."
      );
      return;
    }

    const role = interaction.guild.roles.cache.get(verifiedRoleId);
    if (!role) {
      await interaction.editReply("Роль для верификации не найдена. Обратись к администрации сервера.");
      return;
    }

    try {
      if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role);
      }
      await interaction.editReply("Верификация успешно пройдена. Роль выдана.");
    } catch (error) {
      console.error(error);
      await interaction.editReply("Не удалось выдать роль. Обратись к администрации сервера.");
    }
  }
});

client.login(token);

