import { env } from '@/infra/config/env'
import { Prisma } from '@/infra/database/prisma/prisma-connection'
import type { ChatInputCommandInteraction } from 'discord.js'
import { Discord, Slash } from 'discordx'

@Discord()
export abstract class ScrapperCommand {
  @Slash({
    name: 'scrapper',
    description: 'Scrapper guild by id',
    dmPermission: true,
  })
  async scrapperCommand(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })

    const user = await Prisma.users.findFirst({
      where: {
        id: interaction.user.id,
      },
    })

    if (!user || !user.plan || !user.token) {
      interaction.reply({
        content:
          'To use this command, you need to have a plan and a saved token. You can set those up using /panel.',
      })
      return
    }

    const response = await fetch(`${env.BASE_URL}/users/@me`, {
      headers: {
        Authorization: user.token,
        'Content-Type': 'application/json',
      },
    })

    if (response.status === 401) {
      interaction.reply({
        content:
          'Your token is no longer valid, to update it, use /panel again and click Update your token.',
      })
      return
    }
  }
}
