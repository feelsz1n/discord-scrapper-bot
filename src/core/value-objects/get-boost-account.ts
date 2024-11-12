import { boosters, levels } from '../types/badges.types'

export type Boost = {
  current_level: string | null
  current_level_date: Date | null
  next_level: string | null
  next_level_date: Date | null
}

type LevelInfo = {
  current_level: string | null
  current_level_date: Date | null
  next_level: string | null
  next_level_date: Date | null
}

export function getBoost(boostId?: string, date?: Date): Boost {
  const selectedBoost = boosters.find(b => b.id === boostId)

  if (!selectedBoost) {
    return {
      current_level: null,
      next_level: null,
      current_level_date: null,
      next_level_date: null,
    }
  }

  const currentLevelDate = new Date(date as Date)
  const nextLevelDate = new Date(currentLevelDate)

  nextLevelDate.setMonth(
    nextLevelDate.getMonth() + (selectedBoost.next_months || 0)
  )

  return {
    current_level: selectedBoost.name,
    next_level: selectedBoost.next_level ?? null,
    current_level_date: currentLevelDate,
    next_level_date: nextLevelDate,
  }
}

export function getSignature(startDate: Date): LevelInfo {
  const today = new Date()
  let currentLevelIndex = 0
  let currentLevelDate = new Date(startDate)

  for (const level of levels) {
    const levelDate = new Date(startDate)
    levelDate.setMonth(levelDate.getMonth() + level.months)

    if (today < levelDate) {
      break
    }

    currentLevelIndex = levels.indexOf(level)
    currentLevelDate = levelDate
  }

  const nextLevel = levels[currentLevelIndex + 1]
  const nextLevelDate = nextLevel !== undefined ? new Date(startDate) : null

  if (nextLevelDate) {
    nextLevelDate.setMonth(nextLevelDate.getMonth() + nextLevel.months)
  }

  return {
    current_level: levels[currentLevelIndex].name,
    current_level_date: currentLevelDate,
    next_level: nextLevel?.id ?? null,
    next_level_date: nextLevelDate,
  }
}
