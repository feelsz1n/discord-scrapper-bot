import { Prisma } from '@/infra/database/prisma/prisma-connection'
import { type ArgsOf, type Client, Discord, Once } from 'discordx'

@Discord()
export abstract class Ready {
  @Once({ event: 'ready' })
  async onReady([_]: ArgsOf<'ready'>, client: Client) {
    await client.guilds.fetch()
    await client.initApplicationCommands()
    await Prisma.$connect()

    console.log(`Connected to thew gateway as ${client.user?.tag}!`)
  }
}
