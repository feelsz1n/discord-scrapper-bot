import type { UseCaseError } from '@/core/errors/use-case-error'

export class UnexpectedError extends Error implements UseCaseError {
  constructor() {
    super('An unexpected error occurred')
  }
}
