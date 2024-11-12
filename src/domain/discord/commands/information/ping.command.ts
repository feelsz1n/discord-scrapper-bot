import type { ChatInputCommandInteraction } from 'discord.js'
import { Discord, Slash } from 'discordx'

@Discord()
export abstract class PingCommand {
  @Slash({
    name: 'ping',
    description: 'Return with ping the bot',
    dmPermission: true,
  })
  async Handler(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply()
    await interaction.editReply({
      content: `${interaction.client.ws.ping}ms`,
    })
  }
}
