import type { UseCaseError } from '@/core/errors/use-case-error'

export class ConnectionError extends Error implements UseCaseError {
  constructor() {
    super('Connection reset error. Please check your network or proxy settings')
  }
}
