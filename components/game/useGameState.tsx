"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"

interface GameState {
  currentLevel: number
  playerPosition: [number, number, number]
  collectedItems: Set<string>
  gamePhase: "menu" | "playing" | "paused" | "gameOver" | "challenge"
  score: number
  timeRemaining: number
  totalTime: number
  crystalsCollected: number
  crystalsRequired: number
  playerStats: {
    totalCrystals: number
    totalTime: number
    levelsCompleted: number
    bestTime: number
    finalScore: number
  }
  achievements: Set<string>
  powerUps: {
    speedBoost: { active: boolean; timeLeft: number }
    timeFreeze: { active: boolean; timeLeft: number }
    magnetism: { active: boolean; timeLeft: number }
    doublePoints: { active: boolean; timeLeft: number }
  }
  combo: number
  maxCombo: number
  specialEffects: Array<{
    id: string
    type: "explosion" | "sparkle" | "shockwave"
    position: [number, number, number]
    timeLeft: number
  }>
  environmentalHazards: Set<string>
  movingPlatforms: Array<{
    id: string
    position: [number, number, number]
    direction: [number, number, number]
    speed: number
  }>
  gameWon: boolean
  levelTransitionTime: number
  challengeMode: {
    active: boolean
    wave: number
    enemiesDefeated: number
    enemiesRemaining: number
    waveTimeLimit: number
    waveTimeRemaining: number
    playerHealth: number
    maxHealth: number
    weaponLevel: number
    survivalTime: number
  }
}

type GameAction =
  | { type: "MOVE_PLAYER"; position: [number, number, number] }
  | { type: "COLLECT_ITEM"; itemId: string; itemType: string; position: [number, number, number] }
  | { type: "START_LEVEL"; level: number }
  | { type: "COMPLETE_LEVEL" }
  | { type: "NEXT_LEVEL" }
  | { type: "RESTART_GAME" }
  | { type: "PAUSE_GAME" }
  | { type: "RESUME_GAME" }
  | { type: "TICK_TIME" }
  | { type: "UNLOCK_ACHIEVEMENT"; achievementId: string }
  | { type: "ACTIVATE_POWERUP"; powerUpType: keyof GameState["powerUps"]; duration: number }
  | { type: "UPDATE_POWERUPS" }
  | {
      type: "ADD_SPECIAL_EFFECT"
      effect: { type: "explosion" | "sparkle" | "shockwave"; position: [number, number, number] }
    }
  | { type: "UPDATE_SPECIAL_EFFECTS" }
  | { type: "RESET_COMBO" }
  | { type: "UPDATE_MOVING_PLATFORMS" }
  | { type: "GAME_OVER" }
  | { type: "START_CHALLENGE" }
  | { type: "DEFEAT_ENEMY" }
  | { type: "TAKE_DAMAGE"; damage: number }
  | { type: "HEAL_PLAYER"; amount: number }
  | { type: "UPGRADE_WEAPON" }
  | { type: "NEXT_WAVE" }
  | { type: "CHALLENGE_TICK" }

const initialState: GameState = {
  currentLevel: 1,
  playerPosition: [0, 2, 8],
  collectedItems: new Set(),
  gamePhase: "playing",
  score: 0,
  timeRemaining: 300,
  totalTime: 300,
  crystalsCollected: 0,
  crystalsRequired: 5,
  playerStats: {
    totalCrystals: 0,
    totalTime: 0,
    levelsCompleted: 0,
    bestTime: 0,
    finalScore: 0,
  },
  achievements: new Set(),
  powerUps: {
    speedBoost: { active: false, timeLeft: 0 },
    timeFreeze: { active: false, timeLeft: 0 },
    magnetism: { active: false, timeLeft: 0 },
    doublePoints: { active: false, timeLeft: 0 },
  },
  combo: 0,
  maxCombo: 0,
  specialEffects: [],
  environmentalHazards: new Set(),
  movingPlatforms: [],
  gameWon: false,
  levelTransitionTime: 0,
  challengeMode: {
    active: false,
    wave: 0,
    enemiesDefeated: 0,
    enemiesRemaining: 0,
    waveTimeLimit: 60,
    waveTimeRemaining: 60,
    playerHealth: 100,
    maxHealth: 100,
    weaponLevel: 1,
    survivalTime: 0,
  },
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "MOVE_PLAYER":
      return { ...state, playerPosition: action.position }

    case "COLLECT_ITEM":
      if (state.collectedItems.has(action.itemId)) return state

      const newCollectedItems = new Set(state.collectedItems)
      newCollectedItems.add(action.itemId)

      const newCrystalsCollected = action.itemType === "crystal" ? state.crystalsCollected + 1 : state.crystalsCollected

      const comboMultiplier = Math.min(state.combo + 1, 5)
      const basePoints = action.itemType === "crystal" ? 100 : 50
      const pointsWithCombo = basePoints * comboMultiplier
      const finalPoints = state.powerUps.doublePoints.active ? pointsWithCombo * 2 : pointsWithCombo

      const newScore = state.score + finalPoints
      const newCombo = state.combo + 1
      const newMaxCombo = Math.max(state.maxCombo, newCombo)

      const levelComplete = newCrystalsCollected >= state.crystalsRequired

      const nextState = {
        ...state,
        collectedItems: newCollectedItems,
        crystalsCollected: newCrystalsCollected,
        score: newScore,
        combo: newCombo,
        maxCombo: newMaxCombo,
        playerStats: {
          ...state.playerStats,
          totalCrystals: state.playerStats.totalCrystals + (action.itemType === "crystal" ? 1 : 0),
        },
        specialEffects: [
          ...state.specialEffects,
          {
            id: `effect-${Date.now()}`,
            type: "sparkle" as const,
            position: action.position,
            timeLeft: 1000,
          },
        ],
      }

      if (levelComplete) {
        const updatedStats = {
          ...nextState.playerStats,
          levelsCompleted: nextState.playerStats.levelsCompleted + 1,
        }

        if (nextState.currentLevel >= 3) {
          return {
            ...nextState,
            gamePhase: "challenge",
            challengeMode: {
              ...nextState.challengeMode,
              active: true,
              wave: 1,
              enemiesRemaining: 5,
              waveTimeRemaining: 60,
              playerHealth: 100,
              maxHealth: 100,
              weaponLevel: 1,
              survivalTime: 0,
            },
            playerStats: updatedStats,
            levelTransitionTime: 3000,
          }
        } else {
          const nextLevel = nextState.currentLevel + 1
          const nextConfig = LEVEL_CONFIGS[nextLevel as keyof typeof LEVEL_CONFIGS]

          return {
            ...nextState,
            currentLevel: nextLevel,
            crystalsRequired: nextConfig.crystals,
            crystalsCollected: 0,
            collectedItems: new Set(),
            playerPosition: [0, 2, 8],
            combo: 0,
            specialEffects: [],
            levelTransitionTime: 3000,
            playerStats: updatedStats,
          }
        }
      }

      return nextState

    case "START_LEVEL":
      const config = LEVEL_CONFIGS[action.level as keyof typeof LEVEL_CONFIGS]
      return {
        ...state,
        currentLevel: action.level,
        gamePhase: "playing",
        crystalsRequired: config.crystals,
        crystalsCollected: 0,
        collectedItems: new Set(),
        playerPosition: [0, 2, 8],
        combo: 0,
        specialEffects: [],
        levelTransitionTime: 0,
      }

    case "COMPLETE_LEVEL":
      const timeBonus = Math.max(0, state.timeRemaining * 10)
      const levelCompleteScore = state.score + timeBonus

      return {
        ...state,
        score: levelCompleteScore,
        playerStats: {
          ...state.playerStats,
          levelsCompleted: state.playerStats.levelsCompleted + 1,
          totalTime: state.playerStats.totalTime + (state.totalTime - state.timeRemaining),
          bestTime:
            state.playerStats.bestTime === 0
              ? state.totalTime - state.timeRemaining
              : Math.min(state.playerStats.bestTime, state.totalTime - state.timeRemaining),
        },
        combo: 0,
      }

    case "NEXT_LEVEL":
      if (state.currentLevel >= 3) {
        return { ...state, gamePhase: "gameOver" }
      }

      const nextLevel = state.currentLevel + 1
      const nextConfig = LEVEL_CONFIGS[nextLevel as keyof typeof LEVEL_CONFIGS]

      return {
        ...state,
        currentLevel: nextLevel,
        gamePhase: "playing",
        timeRemaining: state.timeRemaining,
        totalTime: state.totalTime,
        crystalsRequired: nextConfig.crystals,
        crystalsCollected: 0,
        collectedItems: new Set(),
        playerPosition: [0, 2, 8],
        combo: 0,
        specialEffects: [],
      }

    case "RESTART_GAME":
      return {
        ...initialState,
        playerStats: {
          totalCrystals: 0,
          totalTime: 0,
          levelsCompleted: 0,
          bestTime: 0,
          finalScore: 0,
        },
        achievements: new Set(),
      }

    case "PAUSE_GAME":
      return { ...state, gamePhase: "paused" }

    case "RESUME_GAME":
      return { ...state, gamePhase: "playing" }

    case "ACTIVATE_POWERUP":
      return {
        ...state,
        powerUps: {
          ...state.powerUps,
          [action.powerUpType]: {
            active: true,
            timeLeft: action.duration,
          },
        },
      }

    case "UPDATE_POWERUPS":
      const updatedPowerUps = { ...state.powerUps }
      let hasActiveChanged = false

      Object.keys(updatedPowerUps).forEach((key) => {
        const powerUp = updatedPowerUps[key as keyof typeof updatedPowerUps]
        if (powerUp.active && powerUp.timeLeft > 0) {
          powerUp.timeLeft -= 100
          if (powerUp.timeLeft <= 0) {
            powerUp.active = false
            powerUp.timeLeft = 0
            hasActiveChanged = true
          }
        }
      })

      return { ...state, powerUps: updatedPowerUps }

    case "ADD_SPECIAL_EFFECT":
      return {
        ...state,
        specialEffects: [
          ...state.specialEffects,
          {
            id: `effect-${Date.now()}`,
            type: action.effect.type,
            position: action.effect.position,
            timeLeft: action.effect.type === "explosion" ? 1500 : action.effect.type === "shockwave" ? 2000 : 1000,
          },
        ],
      }

    case "UPDATE_SPECIAL_EFFECTS":
      return {
        ...state,
        specialEffects: state.specialEffects
          .map((effect) => ({ ...effect, timeLeft: effect.timeLeft - 100 }))
          .filter((effect) => effect.timeLeft > 0),
        levelTransitionTime: Math.max(0, state.levelTransitionTime - 100),
      }

    case "RESET_COMBO":
      return { ...state, combo: 0 }

    case "TICK_TIME":
      if (state.gamePhase !== "playing") return state

      if (state.powerUps.timeFreeze.active) {
        return state
      }

      const newTimeRemaining = Math.max(0, state.timeRemaining - 1)

      if (newTimeRemaining <= 0) {
        return {
          ...state,
          timeRemaining: 0,
          gamePhase: "gameOver",
          gameWon: false,
          playerStats: {
            ...state.playerStats,
            finalScore: state.score,
            totalTime: state.totalTime,
          },
        }
      }

      const shouldResetCombo = state.combo > 0 && Math.random() < 0.1

      return {
        ...state,
        timeRemaining: newTimeRemaining,
        combo: shouldResetCombo ? 0 : state.combo,
      }

    case "UNLOCK_ACHIEVEMENT":
      const newAchievements = new Set(state.achievements)
      newAchievements.add(action.achievementId)
      return { ...state, achievements: newAchievements }

    case "GAME_OVER":
      return {
        ...state,
        gamePhase: "gameOver",
        playerStats: {
          ...state.playerStats,
          finalScore: state.score,
          totalTime: state.totalTime - state.timeRemaining + state.challengeMode.survivalTime,
        },
      }

    case "START_CHALLENGE":
      return {
        ...state,
        gamePhase: "challenge",
        challengeMode: {
          ...state.challengeMode,
          active: true,
          wave: 1,
          enemiesRemaining: 5,
          waveTimeRemaining: 60,
          playerHealth: 100,
          maxHealth: 100,
          weaponLevel: 1,
          survivalTime: 0,
        },
        playerPosition: [0, 2, 0],
        collectedItems: new Set(),
        combo: 0,
      }

    case "DEFEAT_ENEMY":
      const enemiesLeft = Math.max(0, state.challengeMode.enemiesRemaining - 1)
      const enemiesDefeated = state.challengeMode.enemiesDefeated + 1
      const challengeScore = state.score + 100 * state.challengeMode.wave

      const waveComplete = enemiesLeft === 0

      if (waveComplete) {
        const nextWave = state.challengeMode.wave + 1
        const nextWaveEnemies = 5 + (nextWave - 1) * 2 // Increasing difficulty

        return {
          ...state,
          score: challengeScore,
          challengeMode: {
            ...state.challengeMode,
            wave: nextWave,
            enemiesDefeated,
            enemiesRemaining: nextWaveEnemies,
            waveTimeRemaining: Math.max(45, 60 - (nextWave - 1) * 3), // Decreasing time
            weaponLevel: Math.min(5, Math.floor(nextWave / 2) + 1),
          },
          specialEffects: [
            ...state.specialEffects,
            {
              id: `wave-complete-${Date.now()}`,
              type: "explosion" as const,
              position: state.playerPosition,
              timeLeft: 2000,
            },
          ],
        }
      }

      return {
        ...state,
        score: challengeScore,
        challengeMode: {
          ...state.challengeMode,
          enemiesDefeated,
          enemiesRemaining: enemiesLeft,
        },
        specialEffects: [
          ...state.specialEffects,
          {
            id: `enemy-defeat-${Date.now()}`,
            type: "sparkle" as const,
            position: state.playerPosition,
            timeLeft: 500,
          },
        ],
      }

    case "TAKE_DAMAGE":
      const newHealth = Math.max(0, state.challengeMode.playerHealth - action.damage)

      if (newHealth <= 0) {
        return {
          ...state,
          gamePhase: "gameOver",
          gameWon: false,
          challengeMode: {
            ...state.challengeMode,
            playerHealth: 0,
          },
          playerStats: {
            ...state.playerStats,
            finalScore: state.score,
            totalTime: state.totalTime - state.timeRemaining + state.challengeMode.survivalTime,
          },
        }
      }

      return {
        ...state,
        challengeMode: {
          ...state.challengeMode,
          playerHealth: newHealth,
        },
        specialEffects: [
          ...state.specialEffects,
          {
            id: `damage-${Date.now()}`,
            type: "shockwave" as const,
            position: state.playerPosition,
            timeLeft: 800,
          },
        ],
      }

    case "HEAL_PLAYER":
      return {
        ...state,
        challengeMode: {
          ...state.challengeMode,
          playerHealth: Math.min(state.challengeMode.maxHealth, state.challengeMode.playerHealth + action.amount),
        },
      }

    case "UPGRADE_WEAPON":
      return {
        ...state,
        challengeMode: {
          ...state.challengeMode,
          weaponLevel: Math.min(5, state.challengeMode.weaponLevel + 1),
        },
      }

    case "CHALLENGE_TICK":
      if (state.gamePhase !== "challenge") return state

      const newWaveTime = Math.max(0, state.challengeMode.waveTimeRemaining - 1)
      const newSurvivalTime = state.challengeMode.survivalTime + 1

      // Wave time limit reached - player loses
      if (newWaveTime <= 0 && state.challengeMode.enemiesRemaining > 0) {
        return {
          ...state,
          gamePhase: "gameOver",
          gameWon: false,
          challengeMode: {
            ...state.challengeMode,
            waveTimeRemaining: 0,
            survivalTime: newSurvivalTime,
          },
          playerStats: {
            ...state.playerStats,
            finalScore: state.score,
            totalTime: state.totalTime - state.timeRemaining + newSurvivalTime,
          },
        }
      }

      return {
        ...state,
        challengeMode: {
          ...state.challengeMode,
          waveTimeRemaining: newWaveTime,
          survivalTime: newSurvivalTime,
        },
      }

    default:
      return state
  }
}

const LEVEL_CONFIGS = {
  1: { crystals: 5, name: "Crystal Shores" },
  2: { crystals: 8, name: "Mystic Peaks" },
  3: { crystals: 12, name: "Dragon's Realm" },
}

const GameContext = createContext<{
  gameState: GameState
  actions: {
    movePlayer: (position: [number, number, number]) => void
    collectItem: (itemId: string, itemType: string, position: [number, number, number]) => void
    startLevel: (level: number) => void
    completeLevel: () => void
    nextLevel: () => void
    restartGame: () => void
    pauseGame: () => void
    resumeGame: () => void
    unlockAchievement: (achievementId: string) => void
    activatePowerUp: (powerUpType: keyof GameState["powerUps"], duration: number) => void
    addSpecialEffect: (effect: {
      type: "explosion" | "sparkle" | "shockwave"
      position: [number, number, number]
    }) => void
    resetCombo: () => void
    gameOver: () => void
    startChallenge: () => void
    defeatEnemy: () => void
    takeDamage: (damage: number) => void
    healPlayer: (amount: number) => void
    upgradeWeapon: () => void
  }
} | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, dispatch] = useReducer(gameReducer, initialState)

  useEffect(() => {
    if (gameState.gamePhase !== "playing") return

    const timer = setInterval(() => {
      dispatch({ type: "TICK_TIME" })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState.gamePhase])

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: "UPDATE_POWERUPS" })
      dispatch({ type: "UPDATE_SPECIAL_EFFECTS" })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (gameState.gamePhase !== "challenge") return

    const challengeTimer = setInterval(() => {
      dispatch({ type: "CHALLENGE_TICK" })
    }, 1000)

    return () => clearInterval(challengeTimer)
  }, [gameState.gamePhase])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (gameState.gamePhase === "playing") {
          dispatch({ type: "PAUSE_GAME" })
        } else if (gameState.gamePhase === "paused") {
          dispatch({ type: "RESUME_GAME" })
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState.gamePhase])

  useEffect(() => {
    if (
      gameState.playerStats.bestTime > 0 &&
      gameState.playerStats.bestTime < 60 &&
      !gameState.achievements.has("speed_runner")
    ) {
      dispatch({ type: "UNLOCK_ACHIEVEMENT", achievementId: "speed_runner" })
    }

    if (gameState.playerStats.totalCrystals >= 25 && !gameState.achievements.has("crystal_collector")) {
      dispatch({ type: "UNLOCK_ACHIEVEMENT", achievementId: "crystal_collector" })
    }

    if (gameState.playerStats.levelsCompleted >= 3 && !gameState.achievements.has("level_master")) {
      dispatch({ type: "UNLOCK_ACHIEVEMENT", achievementId: "level_master" })
    }

    if (gameState.maxCombo >= 10 && !gameState.achievements.has("combo_master")) {
      dispatch({ type: "UNLOCK_ACHIEVEMENT", achievementId: "combo_master" })
    }

    if (Object.values(gameState.powerUps).some((p) => p.active) && !gameState.achievements.has("power_user")) {
      dispatch({ type: "UNLOCK_ACHIEVEMENT", achievementId: "power_user" })
    }
  }, [gameState.playerStats, gameState.achievements, gameState.maxCombo, gameState.powerUps])

  const actions = {
    movePlayer: (position: [number, number, number]) => dispatch({ type: "MOVE_PLAYER", position }),
    collectItem: (itemId: string, itemType: string, position: [number, number, number] = [0, 0, 0]) =>
      dispatch({ type: "COLLECT_ITEM", itemId, itemType, position }),
    startLevel: (level: number) => dispatch({ type: "START_LEVEL", level }),
    completeLevel: () => dispatch({ type: "COMPLETE_LEVEL" }),
    nextLevel: () => dispatch({ type: "NEXT_LEVEL" }),
    restartGame: () => dispatch({ type: "RESTART_GAME" }),
    pauseGame: () => dispatch({ type: "PAUSE_GAME" }),
    resumeGame: () => dispatch({ type: "RESUME_GAME" }),
    unlockAchievement: (achievementId: string) => dispatch({ type: "UNLOCK_ACHIEVEMENT", achievementId }),
    activatePowerUp: (powerUpType: keyof GameState["powerUps"], duration: number) =>
      dispatch({ type: "ACTIVATE_POWERUP", powerUpType, duration }),
    addSpecialEffect: (effect: { type: "explosion" | "sparkle" | "shockwave"; position: [number, number, number] }) =>
      dispatch({ type: "ADD_SPECIAL_EFFECT", effect }),
    resetCombo: () => dispatch({ type: "RESET_COMBO" }),
    gameOver: () => dispatch({ type: "GAME_OVER" }),
    startChallenge: () => dispatch({ type: "START_CHALLENGE" }),
    defeatEnemy: () => dispatch({ type: "DEFEAT_ENEMY" }),
    takeDamage: (damage: number) => dispatch({ type: "TAKE_DAMAGE", damage }),
    healPlayer: (amount: number) => dispatch({ type: "HEAL_PLAYER", amount }),
    upgradeWeapon: () => dispatch({ type: "UPGRADE_WEAPON" }),
  }

  return <GameContext.Provider value={{ gameState, actions }}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}
