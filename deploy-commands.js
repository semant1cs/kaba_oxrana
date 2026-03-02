const { REST, Routes, ApplicationCommandOptionType } = require("discord.js");
const { config } = require("dotenv");

config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
  console.error("Missing required environment variables. Check DISCORD_TOKEN, CLIENT_ID, GUILD_ID.");
  process.exit(1);
}

const commands = [
  {
    name: "help",
    description: "Описание процесса верификации на сервере"
  },
  {
    name: "verify",
    description: "Пройти верификацию по фото",
    options: [
      {
        name: "photo",
        description: "Фото с твоим лицом для верификации",
        type: ApplicationCommandOptionType.Attachment,
        required: true
      }
    ]
  }
];

const rest = new REST({ version: "10" }).setToken(token);

async function main() {
  try {
    console.log("Started refreshing application (guild) commands.");
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log("Successfully reloaded application (guild) commands.");
  } catch (error) {
    console.error("Failed to deploy commands:");
    console.error(error);
    process.exit(1);
  }
}

main();

