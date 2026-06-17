import { Client, Events, GatewayIntentBits } from 'discord.js'
import { config } from '@/config'
import { onMessageCreate } from '@/bot/events/messageCreate'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

client.once(Events.ClientReady, (c) => {
  console.log(`Ready: ${c.user.tag}`)
})

client.on(Events.MessageCreate, onMessageCreate)

client.login(config.discordToken)
