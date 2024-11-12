import { randomBytes } from 'node:crypto'
import { env } from '@/infra/config/env'
import { Prisma } from '@/infra/database/prisma/prisma-connection'
import {
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js'
import { Discord, Slash, SlashChoice, SlashOption } from 'discordx'

@Discord()
export abstract class CreateKeysCommand {
  @Slash({
    name: 'create',
    description: 'Create keys',
    dmPermission: true,
  })
    async Handler(
      @SlashOption({
        name: 'license-type',
        description: 'License type of the key',
        type: ApplicationCommandOptionType.String,
        required: true,
      })
      @SlashChoice({ name: 'Monthly', value: 'monthly' })
      @SlashChoice({ name: 'Yearly', value: 'yearly' })
      @SlashChoice({ name: 'Lifetime', value: 'lifetime' })
      licenseType: string,

      @SlashOption({
        name: 'quantity',
        description: 'Quantity of keys',
        type: ApplicationCommandOptionType.Number,
        required: true,
        minValue: 1,
        maxValue: 100,
      })
      keyQuantity: number,

      interaction: ChatInputCommandInteraction
    ) {
      if (interaction.user?.id !== env.OWNER_ID) {
        await interaction.reply({
          content: 'You are not the owner of this bot!',
          ephemeral: true,
        })
        return
      }

      const keys: { id: string; used: boolean; type: string; expiresAt: number | null }[] = []
      let expiresAt

      switch (licenseType) {
        case 'monthly':
          expiresAt = Math.floor(new Date().setMonth(new Date().getMonth() + 1) / 1000);
          break;
        case 'yearly':
          expiresAt = Math.floor(new Date().setFullYear(new Date().getFullYear() + 1) / 1000);
          break;
        case 'lifetime':
          expiresAt = 2147483647; // valor fixo de INT4
          break;
        default:
          await interaction.reply({
            content: 'Invalid license type',
            ephemeral: true,
          });
          return;
      }

      for (let i = 0; i < keyQuantity; i++) {
        keys.push({
          id: randomBytes(20).toString('hex'),
          used: false,
          type: licenseType,
          expiresAt,
        })
      }

      await Prisma.keys.createMany({
        data: keys,
      })

      const embed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: 'Keys created', value: `${keyQuantity} keys`, inline: true },
          { name: 'Type', value: licenseType, inline: true },
          {
            name: 'Expires in',
            value: expiresAt ? `<t:${expiresAt}:R>` : 'Never',
            inline: true,
          },
          {
            name: 'Keys',
            value: keys.map(key => key.id).join('\n'),
            inline: false,
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Keys created by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL(),
        })

      await interaction.reply({ embeds: [embed] })
    }

}
