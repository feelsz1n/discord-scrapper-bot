import { env } from '@/infra/config/env'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js'
import { Discord, Slash } from 'discordx'

@Discord()
export abstract class InviteCommand {
  @Slash({
    name: 'invite',
    description: 'Get the invite link of the bot',
    dmPermission: false,
  })
  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.user?.id !== env.OWNER_ID) {
      return interaction.reply({
        content: 'You must be the bot owner to use this command.',
        ephemeral: true,
      })
    }

    const inviteEmbed = new EmbedBuilder()
      .setTitle('Invite the bot to your server')
      .setDescription(
        'Click the button below to [invite](https://discord.com/oauth2/authorize?client_id=1205786589935050812&permissions=8&scope=bot%20applications.commands) the bot to your server!'
      )
      .setTimestamp()
      .setFooter({
        text: `Command requested by ${interaction.user.username}`,
        iconURL: interaction.client.user.displayAvatarURL(),
      })

    await interaction.reply({ embeds: [inviteEmbed] })
  }
}
