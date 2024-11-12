import { type Either, left, right } from '@/core/either'
import { env } from '@/infra/config/env'
import type { DiscordUserProfile } from '@user/enterprise/entities/user-profile'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'
import { ConnectionError } from './errors/connection-error'
import { RateLimitedError } from './errors/rate-limited-error'
import { ServerError } from './errors/server-error'
import { UnexpectedError } from './errors/unexpected-error'
import { UserNotFoundError } from './errors/user-not-found-error'

type FetchUserUseCaseResponse = Either<
  | RateLimitedError
  | UserNotFoundError
  | ServerError
  | ConnectionError
  | UnexpectedError,
  {
    user: DiscordUserProfile
  }
>

interface FetchUserUseCaseRequest {
  id: string
  token: string
}

export async function FetchUserProfileInfo({
  id,
  token,
}: FetchUserUseCaseRequest): Promise<FetchUserUseCaseResponse> {
  const proxyAgent = new HttpsProxyAgent(env.PROXY_URL as string)

  try {
    const response = await fetch(`${env.BASE_URL}/users/${id}/profile`, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      agent: proxyAgent,
    })

    if (!response.ok) {
      switch (response.status) {
        case 404:
          return left(new UserNotFoundError())
        case 429:
          return left(new RateLimitedError())
        case 504:
          return left(new ServerError())
        case 0:
          return left(new ConnectionError())
        default:
          return left(new UnexpectedError())
      }
    }

    const userData = (await response.json()) as DiscordUserProfile
    return right({ user: userData })
  } catch (error) {
    return left(new Error('Failed to fetch user profile'))
  }
}
