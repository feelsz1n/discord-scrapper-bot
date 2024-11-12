import { Prisma } from '@/infra/database/prisma/prisma-connection'
import {
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { Discord, Slash, SlashOption } from 'discordx'

@Discord()
export class SetOwnerCommand {
  @Slash({
    name: 'setowner',
    description: 'Set the owner of the bot',
    dmPermission: true,
  })
  async Handler(
    @SlashOption({
      name: 'id',
      description: 'ID of the user to set as owner',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    id: string,
    interaction: ChatInputCommandInteraction
  ) {
    if (interaction.user?.id !== process.env.OWNER_ID) {
      await interaction.reply({
        content: 'You are not the owner of this bot!',
        ephemeral: true,
      })
      return
    }

    await Prisma.users.update({
      where: {
        id: id,
      },
      data: {},
    })

    await interaction.reply({
      content: `User with ID ${id} is now the owner of the bot!`,
    })
  }
}
