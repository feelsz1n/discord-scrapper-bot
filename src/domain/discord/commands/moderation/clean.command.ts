import {
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction, type TextChannel
} from 'discord.js'
import { Discord, Slash, SlashOption } from 'discordx'

@Discord()
export abstract class CleanCommand {
  @Slash({
    name: 'clean',
    description: 'Clean the chat messages',
    dmPermission: false,
  })
  async handleCleanCommand(
    @SlashOption({
      name: 'quantity',
      description: 'Number of messages to delete',
      type: ApplicationCommandOptionType.Integer,
      required: true,
      minValue: 1,
      maxValue: 100,
    })
    quantity: number,
    interaction: ChatInputCommandInteraction
  ) {
    const channel = interaction.channel

    if (!channel || !channel.isTextBased()) {
      await interaction.reply({
        content: 'Cannot delete messages in this channel',
        ephemeral: true,
      })
      return
    }

    const messages = await channel.messages.fetch({
      limit: quantity,
    })

    if (!messages.size) {
      await interaction.reply({
        content: 'Failed to fetch messages to delete',
        ephemeral: true,
      })
      return
    }

    await (channel as TextChannel).bulkDelete(messages)

    await interaction.reply({
      content: `Deleted ${quantity} messages`,
      ephemeral: true,
    })
  }
}
