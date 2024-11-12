import { Prisma } from '@/infra/database/prisma/prisma-connection'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  type ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js'
import { type Client, Discord, Slash } from 'discordx'

@Discord()
export abstract class PanelCommand {
  @Slash({
    name: 'panel',
    description: 'Show the panel infos about the scrapper',
    dmPermission: true,
  })
  async Handler(interaction: ChatInputCommandInteraction, client: Client) {
    const user = await Prisma.users.findFirst({
      where: { id: interaction.user.id },
    })

    if (!user) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.avatarURL() as string,
        })
        .setThumbnail(interaction.user?.displayAvatarURL() as string)
        .setTitle('Panel')
        .setDescription('You are not registered!')
        .setTimestamp()
        .setFooter({
          text: `Command requested by ${interaction.user.username}`,
          iconURL: interaction.client.user?.displayAvatarURL() as string,
        })

      return interaction.reply({ embeds: [embed] })
    }

    const panelEmbed = new EmbedBuilder()
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.avatarURL() as string,
      })
      .setThumbnail(interaction.user?.displayAvatarURL() as string)
      .setTitle('Panel')
      .setDescription('Panel information about discord badges scrapper')
      .addFields(
        {
          name: 'Token:',
          value: user.token ? 'Saved' : 'Not saved yet',
          inline: true,
        },
        { name: 'Plan:', value: user.plan || 'None', inline: true },
        {
          name: 'Expiration:',
          value: user.planExpiresAt
            ? `<t:${user.planExpiresAt}:f> (<t:${user.planExpiresAt}:R>)`
            : 'None',
          inline: false,
        },
        {
          name: 'Logs Channel:',
          value:
            client.guilds.cache
              .get(user.guildId!)
              ?.channels.cache.get(user.channelId!)?.url || 'Unknown',
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Command requested by ${interaction.user.username}`,
        iconURL: interaction.client.user?.displayAvatarURL() as string,
      })

    const channelSelectRow =
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId('LogsChannelConfig')
          .setPlaceholder('Select your logs channel clicking here.')
          .addChannelTypes(ChannelType.GuildText)
      )

    const saveTokenButton = new ButtonBuilder()
      .setCustomId('savingToken')
      .setLabel('Save or update your token')
      .setStyle(ButtonStyle.Secondary)

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      saveTokenButton
    )

    const message = await interaction.reply({
      embeds: [panelEmbed],
      components: [channelSelectRow, buttonRow],
    })

    const channelSelectCollector = message.createMessageComponentCollector({
      componentType: ComponentType.ChannelSelect,
      filter: m => m.member?.user.id === interaction.user.id,
    })

    const buttonCollector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: m => m.member?.user.id === interaction.user.id,
    })

    channelSelectCollector.on('collect', async i => {
      const channel = await i.guild?.channels.fetch(i.values[0])

      if (!channel) return

      panelEmbed.spliceFields(3, 1, {
        name: 'Logs Channel:',
        value: channel.url as string,
        inline: false,
      })

      await interaction.editReply({ embeds: [panelEmbed] })

      i.reply({
        content: `Now all your scrapper logs will be sent on ${channel}.`,
        ephemeral: true,
      })

      await Prisma.users.update({
        where: { id: interaction.user.id },
        data: {
          guildId: channel.guild.id,
          channelId: channel.id,
        },
      })
    })

    buttonCollector.on('collect', async i => {
      const modal = new ModalBuilder()
        .setCustomId('token-modal')
        .setTitle('Save your scrap token')

      const tokenInput = new TextInputBuilder()
        .setCustomId('tokeninput')
        .setLabel('Token')
        .setPlaceholder('Enter your token here')
        .setStyle(TextInputStyle.Short)
        .setMinLength(10)

      const tokenRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
        tokenInput
      )

      modal.addComponents(tokenRow)
      await i.showModal(modal)

      const modalSubmit = await i.awaitModalSubmit({
        time: 60000,
        filter: m => m.customId === 'token-modal',
      })

      const token = modalSubmit.fields.getTextInputValue('tokeninput')
      await modalSubmit.deferReply({ ephemeral: true })

      const request = await fetch('https://discord.com/api/v9/users/@me', {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      }).then(res => res.json() as any)

      if (!request.id) {
        await modalSubmit.editReply({ content: 'Token is invalid' })
      } else {
        await Prisma.users.update({
          where: { id: interaction.user.id },
          data: { token },
        })

        panelEmbed.spliceFields(0, 1, {
          name: 'Token:',
          value: 'Saved',
          inline: true,
        })

        await modalSubmit.editReply({ content: 'Token saved successfully' })
        await interaction.editReply({ embeds: [panelEmbed] })
      }
    })
  }
}
