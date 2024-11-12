import { Prisma } from '@/infra/database/prisma/prisma-connection'
import {
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js'
import { Discord, Slash, SlashOption } from 'discordx'

@Discord()
export class UserKeyCommand {
  @Slash({
    name: 'reedem',
    description: 'Reedem a key',
    dmPermission: true,
  })
  async Handler(
    @SlashOption({
      name: 'key',
      description: 'Key to redeem',
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    keyToRedeem: string,
    interaction: ChatInputCommandInteraction
  ) {
    const keyFromDatabase = await Prisma.keys.findFirst({
      where: {
        id: keyToRedeem,
      },
    })

    if (!keyFromDatabase || keyFromDatabase.used) {
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: interaction.user.username,
              iconURL: interaction.user.avatarURL() as string,
            })
            .setThumbnail(interaction.user.displayAvatarURL() as string)
            .setTitle('Invalid key!')
            .setDescription('The key is invalid or has already been used!')
            .setTimestamp()
            .setFooter({
              text: `Command requested by ${interaction.user.username}`,
              iconURL: interaction.user.avatarURL() as string,
            }),
        ],
      })
      return
    }

    await Prisma.keys.delete({
      where: {
        id: keyToRedeem,
      },
    })

    await Prisma.users.upsert({
      where: {
        id: interaction.user.id,
      },
      create: {
        id: interaction.user.id,
        plan: keyFromDatabase.type,
        planExpiresAt: keyFromDatabase.expiresAt
      },
      update: {
        plan: keyFromDatabase.type,
        planExpiresAt: keyFromDatabase.expiresAt
      },
    })

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.avatarURL() as string,
          })
          .setThumbnail(interaction.user.displayAvatarURL() as string)
          .setTitle('Key redeemed!')
          .setDescription(
            `You successfully redeemed a **${keyFromDatabase.type}** key!`
          )
          .setTimestamp()
          .setFooter({
            text: `Command requested by ${interaction.user.username}`,
            iconURL: interaction.user.avatarURL() as string,
          }),
      ],
    })
  }
}
