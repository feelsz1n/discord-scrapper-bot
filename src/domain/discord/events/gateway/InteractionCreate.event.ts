import { badges, badgesvalidation, emojis } from '@/core/types/badges.types'
import type { client } from '@/core/types/client.types'
import { getBoost, getSignature } from '@/core/value-objects/get-boost-account'
import { env } from '@/infra/config/env'
import { Prisma } from '@/infra/database/prisma/prisma-connection'
import { RateLimitedError } from '@user/application/use-cases/errors/rate-limited-error'
import { UserNotFoundError } from '@user/application/use-cases/errors/user-not-found-error'
import { FetchUserProfileInfo } from '@user/application/use-cases/fetch-user-profile-info'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  StringSelectMenuBuilder,
  type TextChannel,
} from 'discord.js'
import { Client } from 'discord.js-selfbot-v13'
import { type ArgsOf, Discord, On } from 'discordx'

@Discord()
export class InteractionCreateEvent {
  @On({ event: 'interactionCreate' })
  async onInteraction(
    [interaction]: ArgsOf<'interactionCreate'>,
    client: client
  ) {
    try {
      const user = await this.findUserInDatabase(interaction)

      if (!user) {
        await this.handleInteractionError(interaction)
        return
      }

      if (
        interaction.isChatInputCommand() &&
        interaction.commandName !== 'scrapper'
      ) {
        await client.executeInteraction(interaction)
      } else {
        await this.scrapperExecution(interaction, client)
      }
    } catch (error) {
      console.log(error)
    }
  }

  private async scrapperExecution(
    interaction: ArgsOf<'interactionCreate'>[0],
    client: client
  ) {
    try {
      const user = await this.findUserInDatabase(interaction)

      const request = await fetch('https://discord.com/api/v9/users/@me', {
        headers: {
          Authorization: user.token as string,
          'Content-Type': 'application/json',
        },
      }).then(res => res.json() as any)

      if (request.code === 0) {
        if (interaction.isCommand()) {
          await interaction.reply({
            content: 'Invalid token, please update your token with /panel!',
            ephemeral: true,
          })
        }
        return
      }

      const client_self = new Client()

      client_self.login(user.token as string)

      client_self.on('ready', async () => {
        const guilds = client_self.guilds.cache.map(guild => ({
          label: guild.name,
          value: guild.id,
          description: `Active: ${guild.members.cache.filter(member => member.presence?.status !== 'offline').size} | Total: ${guild.memberCount}`,
        }))

        const select_menu_guilds = new StringSelectMenuBuilder()
          .setCustomId('servers-select')
          .setPlaceholder('Select a server to scrapper')
          .addOptions(guilds.slice(0, 25))

        const row =
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            select_menu_guilds
          )

        const embed = new EmbedBuilder()
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.avatarURL() as string,
          })
          .setThumbnail(client_self.user?.displayAvatarURL() as string)
          .setTitle('Scrapper Guilds')
          .setDescription(
            'Select a server to scrapper. You can select more than one.'
          )
          .setFields(
            {
              name: 'User:',
              value: `${client_self.user?.username || ''}`,
              inline: true,
            },
            {
              name: 'Servers:',
              value: `In ${client_self.guilds.cache.size} servers`,
              inline: true,
            },
            {
              name: 'Log Channel:',
              value:
                `<#${client_self.channels.cache.get(user?.channelId as string)?.id}>` ||
                'Not set',
              inline: true,
            }
          )
          .setTimestamp()
          .setFooter({
            text: `Requested by ${interaction.user.username}`,
            iconURL: interaction.user.avatarURL() as string,
          })

        if (interaction.isCommand()) {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({
              embeds: [embed],
              components: [row],
            })
          } else {
            await interaction.reply({
              embeds: [embed],
              components: [row],
              ephemeral: true,
            })
          }
        }

        if (interaction.isStringSelectMenu()) {
          const guild_id = interaction.values[0]
          const guild = client_self.guilds.cache.get(guild_id as string)
          const user_logs = client.channels.cache.get(
            user?.channelId as string
          ) as TextChannel

          if (!guild) {
            await interaction.editReply({
              content: 'Server not found!',
              embeds: [],
              components: [],
            })
            return
          }

          if (!user_logs) {
            await interaction.editReply({
              content: 'Log channel not found!',
              embeds: [],
              components: [],
            })
            return
          }

          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({
              content: `I'm going to start scrapper in ${guild.name} and send logs to ${user_logs.url}!`,
              embeds: [],
              components: [],
            })
          } else {
            await interaction.reply({
              content: `I'm going to start scrapper in ${guild.name} and send logs to ${user_logs.url}!`,
              embeds: [],
              components: [],
              ephemeral: true,
            })
          }

          const allMembers = await guild.members.fetch()
          const members = allMembers.map(member => member.user.id)

          for (const member of members) {
            const fetched = await client_self.users.fetch(member)

            if (fetched.bot) continue

            const user_fetched = await FetchUserProfileInfo({
              id: fetched.id,
              token: user.token as string,
            })

            if (user_fetched.isLeft()) {
              if (user_fetched.value instanceof RateLimitedError) {
                if (interaction.deferred || interaction.replied) {
                  await interaction.editReply({
                    content:
                      'Rate Limited Error, i will be breaking your session!',
                    embeds: [],
                    components: [],
                  })
                  client_self.destroy()
                  console.log('Rate Limited Error')
                } else {
                  await interaction.reply({
                    content:
                      'Rate Limited Error, i will be breaking your session!',
                    embeds: [],
                    components: [],
                    ephemeral: true,
                  })
                }
                client_self.destroy()
                console.log('Rate Limited Error!')
                return
              }

              if (user_fetched.value instanceof UserNotFoundError) {
                if (interaction.deferred || interaction.replied) {
                  await interaction.editReply({
                    content: 'User not found!',
                    embeds: [],
                    components: [],
                  })
                  console.log('User not found!')
                } else {
                  await interaction.reply({
                    content: 'User not found!',
                    embeds: [],
                    components: [],
                    ephemeral: true,
                  })
                }
                console.log('User not found!')
                continue
              }
            }

            if (user_fetched.isRight()) {
              const badgesList =
                user_fetched.value.user.badges
                  ?.map((b: any) => {
                    const badge = badges?.find(x => x?.id === b?.id)
                    return badge ? (badge.name as keyof typeof emojis) : null
                  })
                  .filter(
                    (badge): badge is keyof typeof emojis => badge !== null
                  ) || []

              if (badgesList.length <= 0) continue

              const validBadges = badgesList
                .filter(badge =>
                  badgesvalidation.some(validBadge => validBadge.name === badge)
                )
                .join(' ')

              if (validBadges.length <= 0) continue

              const emojisBadges = badgesList
                .map((badge: keyof typeof emojis) => emojis[badge])
                .join('')

              const createdAt =
                fetched.createdAt instanceof Date
                  ? fetched.createdAt.getTime()
                  : fetched.createdAt

              const embed = new EmbedBuilder()
                .setAuthor({
                  name: `Scrapper・${fetched.globalName || ''} (@${fetched.username})`,
                  iconURL: fetched.avatarURL() as string,
                })
                .setThumbnail(fetched.avatarURL() as string)
                .setTimestamp()
                .setFooter({
                  text: `Server: ${guild.name}`,
                  iconURL: guild.iconURL() as string,
                })
                .addFields(
                  {
                    name: 'User:',
                    value: `${fetched.username || ''}`,
                    inline: true,
                  },
                  {
                    name: 'ID:',
                    value: `\`${fetched.id}\``,
                    inline: true,
                  },
                  {
                    name: 'Badges:',
                    value: emojisBadges || 'None',
                    inline: true,
                  },
                  {
                    name: 'Criado em:',
                    value: `<t:${Math.floor(createdAt / 1000)}:f> (<t:${Math.floor(createdAt / 1000)}:R>)`,
                    inline: false,
                  }
                )

              const buttonBooster = new ButtonBuilder()
                .setCustomId('view_booster')
                .setLabel('View Booster Information')
                .setStyle(ButtonStyle.Secondary)

              const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                buttonBooster
              )

              const msg = await user_logs.send({
                embeds: [embed],
                components: [row],
              })

              msg
                .createMessageComponentCollector({
                  componentType: ComponentType.Button,
                })
                .on('collect', async interaction => {
                  if (interaction.customId === 'view_booster') {
                    const booster_level = user_fetched.value.user.badges?.find(
                      (x: any) => x?.id.startsWith('guild_booster_')
                    )?.id

                    const boost_date = user_fetched.value.user
                      .premium_guild_since
                      ? new Date(user_fetched.value.user.premium_guild_since)
                      : undefined
                    const premium_since_raw =
                      user_fetched.value.user.premium_since
                    const premium_since = premium_since_raw
                      ? new Date(premium_since_raw)
                      : undefined

                    if ((booster_level && boost_date) || premium_since) {
                      const nitro_since = premium_since
                        ? `<t:${Math.round(premium_since.getTime() / 1000)}:F> (<t:${Math.round(premium_since.getTime() / 1000)}:R>)`
                        : 'O usuário não é um assinante Nitro.'
                      const boost_info = getBoost(booster_level, boost_date)
                      const signature = getSignature(premium_since_raw as Date)

                      const current_level_timestamp =
                        boost_info?.current_level_date
                          ? Math.floor(
                              boost_info.current_level_date.getTime() / 1000
                            )
                          : null

                      const next_level_timestamp = boost_info?.next_level_date
                        ? Math.floor(
                            boost_info.next_level_date.getTime() / 1000
                          )
                        : null

                      const embed = new EmbedBuilder()
                        .setThumbnail(fetched.avatarURL() as string)
                        .setTitle(
                          `${user_fetched.value.user.user.username}'s Boost Information`
                        )
                        .addFields(
                          {
                            name: 'Insígnia de impulso atual:',
                            value: current_level_timestamp
                              ? `${emojis[boost_info?.current_level as keyof typeof emojis]} <t:${current_level_timestamp}:F> (<t:${current_level_timestamp}:R>)`
                              : 'O usuário não possui impulso em servidor.',
                          },
                          {
                            name: 'Próxima insígnia de impulso:',
                            value: next_level_timestamp
                              ? `${emojis[boost_info?.next_level as keyof typeof emojis]} <t:${next_level_timestamp}:F> (<t:${next_level_timestamp}:R>)`
                              : 'O usuário não possui impulso em servidor',
                          },
                          {
                            name: 'Assinante Nitro desde:',
                            value: nitro_since,
                          },
                          {
                            name: 'Insígnia de nitro atual:',
                            value: signature?.current_level
                              ? `${emojis[signature?.current_level as keyof typeof emojis]} <t:${Math.floor(
                                  signature.current_level_date
                                    ? signature.current_level_date.getTime() /
                                        1000
                                    : 0
                                )}:F> (<t:${Math.floor(
                                  signature.current_level_date
                                    ? signature.current_level_date.getTime() /
                                        1000
                                    : 0
                                )}:R>)`
                              : 'O usuário não é um assinante Nitro.',
                          },
                          {
                            name: 'Próxima insígnia de nitro:',
                            value: signature?.next_level
                              ? `${emojis[signature?.next_level as keyof typeof emojis]} <t:${Math.floor(
                                  signature.next_level_date
                                    ? signature.next_level_date.getTime() / 1000
                                    : 0
                                )}:F> (<t:${Math.floor(
                                  signature.next_level_date
                                    ? signature.next_level_date.getTime() / 1000
                                    : 0
                                )}:R>)`
                              : 'O usuário não é um assinante Nitro.',
                          }
                        )

                      if (
                        boost_info?.current_level === 'GuildBoosterLevel9' &&
                        signature
                      ) {
                        embed.setFields(
                          {
                            name: 'Insígnia de impulso atual:',
                            value: `${emojis[boost_info?.current_level as keyof typeof emojis]} <t:${current_level_timestamp}:F> (<t:${current_level_timestamp}:R>)`,
                          },
                          {
                            name: 'Assinante Nitro desde:',
                            value: nitro_since,
                          },
                          {
                            name: 'Insígnia de nitro atual:',
                            value: `${emojis[signature?.current_level as keyof typeof emojis]} <t:${Math.floor(
                              signature.current_level_date
                                ? signature.current_level_date.getTime() / 1000
                                : 0
                            )}:F> (<t:${Math.floor(
                              signature.current_level_date
                                ? signature.current_level_date.getTime() / 1000
                                : 0
                            )}:R>)`,
                          },
                          {
                            name: 'Próxima insígnia de impulso:',
                            value: signature?.next_level
                              ? `${emojis[signature?.next_level as keyof typeof emojis]} <t:${Math.floor(
                                  signature.next_level_date
                                    ? signature.next_level_date.getTime() / 1000
                                    : 0
                                )}:F> (<t:${Math.floor(
                                  signature.next_level_date
                                    ? signature.next_level_date.getTime() / 1000
                                    : 0
                                )}:R>)`
                              : 'O usuário não é um assinante Nitro.',
                          }
                        )
                      }

                      if (interaction.deferred || interaction.replied) {
                        await interaction.editReply({
                          embeds: [embed],
                        })
                      } else {
                        await interaction.reply({
                          embeds: [embed],
                          ephemeral: true,
                        })
                      }
                    } else {
                      if (interaction.deferred || interaction.replied) {
                        await interaction.editReply({
                          content:
                            'Não foi possivel obter informações do usuário.',
                        })
                      } else {
                        await interaction.reply({
                          content:
                            'Não foi possivel obter informações do usuário.',
                          ephemeral: true,
                        })
                      }
                    }
                  }
                })
            }
          }

          if (interaction.deferred || interaction.replied) {
            await user_logs.send({
              embeds: [
                new EmbedBuilder()
                  .setTitle('Scrapper')
                  .setDescription('Scrapper finished successfully!')
                  .setTimestamp()
                  .setFooter({
                    text: `Requested by ${interaction.user.username}`,
                    iconURL: interaction.user.avatarURL() as string,
                  }),
              ],
            })
          } else {
            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setDescription('Scrapper finished successfully!')
                  .setTimestamp()
                  .setFooter({
                    text: `Requested by ${interaction.user.username}`,
                    iconURL: interaction.user.avatarURL() as string,
                  }),
              ],
              ephemeral: true,
            })
          }

          client_self.destroy()
        }
      })
    } catch (error) {
      console.log(error)
    }
  }

  private async findUserInDatabase(interaction: any): Promise<any> {
    const userId = interaction.user.id
    const user = await Prisma.users.findFirst({ where: { id: userId } })

    if (!user) {
      const userData = {
        id: userId,
        token: null,
        plan: null,
        channelId: null,
        guildId: null,
        isOwner: userId === env.OWNER_ID,
      }

      await Prisma.users.create({ data: userData })
    }

    return user
  }

  private async handleInteractionError(interaction: any): Promise<void> {
    if (interaction.isCommand()) {
      await interaction.reply({
        content: 'User create in my database, use the command again.',
        ephemeral: true,
      })
    }
  }
}
