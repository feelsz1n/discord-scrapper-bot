export interface User {
  id: string
  username: string
  global_name: string | null
  avatar: string | null
  banner: string | null
  bio: string | null
}

export interface UserProfile {
  pronouns: string | null
  theme_colors: number[]
}

export interface Badges {
  id: string
  description: string
  icon: string
  link: string
}

export interface Guilds {
  id: string
  nick: string | null
}

export interface ConnecetedAccounts {
  type: string | null
  id: string | null
  name: string | null
  verified: boolean
}

export type DiscordUserProfile = {
  user: User
  connected_accounts: ConnecetedAccounts[]
  premium_since?: Date
  premium_type?: number
  premium_guild_since?: Date
  user_profile: UserProfile
  badges: Badges[]
  mutual_guilds: Guilds[]
  legacy_username: string | null
}
