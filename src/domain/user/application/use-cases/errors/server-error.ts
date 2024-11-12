import type { UseCaseError } from '@/core/errors/use-case-error'

export class ServerError extends Error implements UseCaseError {
  constructor() {
    super('Server error. Please try again later')
  }
}
