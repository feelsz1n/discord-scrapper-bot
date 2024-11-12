import type { UseCaseError } from '@/core/errors/use-case-error'

export class RateLimitedError extends Error implements UseCaseError {
  constructor() {
    super(`You're being rate limited, try again later`)
  }
}
