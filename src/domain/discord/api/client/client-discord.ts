import { env } from '@/infra/config/env'
import { ActivityType, GatewayIntentBits, Partials } from 'discord.js'
import { Client } from 'discordx'

export class ClientDiscord {
  private client: Client

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
      ],
      partials: [
        Partials.GuildMember,
        Partials.Message,
        Partials.User,
        Partials.Channel,
      ],
      presence: {
        activities: [{ name: 'Scrapping...', type: ActivityType.Watching }],
        status: 'dnd',
      },
    })
  }

  sync() {
    this.client.login(env.DISCORD_BOT_TOKEN)
  }
}
