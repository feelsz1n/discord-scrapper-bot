import { Discord, On, type RestArgsOf } from 'discordx'

@Discord()
export abstract class RateLimitEvent {
  @On.rest({ event: 'rateLimited' })
  async Handler([data]: RestArgsOf<'rateLimited'>) {
    console.error(data)
  }
}
