"use client"

import { useGame } from "@/hooks/useGameState"
import { useEffect, useState } from "react"

export default function ModernGameUI() {
  const { gameState, actions } = useGame()
  const [showPauseMenu, setShowPauseMenu] = useState(false)
  const [notifications, setNotifications] = useState<
    Array<{
      id: string
      message: string
      type: "success" | "info" | "warning"
    }>
  >([])

  // Handle pause menu
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (gameState.gamePhase === "playing" || gameState.gamePhase === "challenge") {
          actions.pauseGame()
          setShowPauseMenu(true)
        } else if (gameState.gamePhase === "paused") {
          actions.resumeGame()
          setShowPauseMenu(false)
        }
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [gameState.gamePhase, actions])

  // Show notifications for achievements and power-ups
  useEffect(() => {
    if (gameState.achievements.size > 0) {
      const latestAchievement = Array.from(gameState.achievements).pop()
      if (latestAchievement) {
        addNotification(`🏆 Achievement: ${getAchievementName(latestAchievement)}!`, "success")
      }
    }
  }, [gameState.achievements])

  useEffect(() => {
    const activePowerUps = Object.entries(gameState.powerUps).filter(([_, powerUp]) => powerUp.active)
    if (activePowerUps.length > 0) {
      const recentlyActivated = activePowerUps.find(([_, powerUp]) => powerUp.timeLeft > 9900) // Just activated
      if (recentlyActivated) {
        const [key] = recentlyActivated
        const names = {
          speedBoost: "⚡ Speed Boost Activated!",
          timeFreeze: "❄️ Time Freeze Activated!",
          magnetism: "🧲 Magnetism Activated!",
          doublePoints: "💰 Double Points Activated!",
        }
        addNotification(names[key as keyof typeof names], "info")
      }
    }
  }, [gameState.powerUps])

  const addNotification = (message: string, type: "success" | "info" | "warning" = "info") => {
    const id = Date.now().toString()
    setNotifications((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 4000)
  }

  const getAchievementName = (id: string) => {
    const achievements: Record<string, string> = {
      speed_runner: "Speed Runner",
      crystal_collector: "Crystal Collector",
      level_master: "Level Master",
      combo_master: "Combo Master",
      power_user: "Power User",
    }
    return achievements[id] || "Unknown Achievement"
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getProgressPercentage = () => {
    return (gameState.crystalsCollected / gameState.crystalsRequired) * 100
  }

  const getLevelName = () => {
    const names = { 1: "Crystal Shores", 2: "Mystic Peaks", 3: "Dragon's Realm" }
    return names[gameState.currentLevel as keyof typeof names] || "Unknown Level"
  }

  const getTimeWarningColor = () => {
    if (gameState.gamePhase === "challenge") {
      if (gameState.challengeMode.waveTimeRemaining <= 10) return "text-red-400 animate-pulse"
      if (gameState.challengeMode.waveTimeRemaining <= 20) return "text-yellow-400"
      return "text-white"
    }
    if (gameState.timeRemaining <= 30) return "text-red-400 animate-pulse"
    if (gameState.timeRemaining <= 60) return "text-yellow-400"
    return "text-white"
  }

  const getGameResult = () => {
    if (gameState.gameWon) {
      return {
        title: "🏆 VICTORY! 🏆",
        subtitle: "You conquered all three realms!",
        type: "victory" as const,
      }
    }

    if (gameState.challengeMode.active) {
      const wavesCompleted = gameState.challengeMode.wave - 1
      const survivalTime = gameState.challengeMode.survivalTime

      if (wavesCompleted >= 5) {
        return {
          title: "🔥 ARENA MASTER! 🔥",
          subtitle: `Survived ${wavesCompleted} waves! Incredible!`,
          type: "victory" as const,
        }
      } else if (wavesCompleted >= 3) {
        return {
          title: "⚔️ WARRIOR! ⚔️",
          subtitle: `Survived ${wavesCompleted} waves! Well fought!`,
          type: "good_loss" as const,
        }
      } else if (wavesCompleted >= 1) {
        return {
          title: "🛡️ FIGHTER! 🛡️",
          subtitle: `Survived ${wavesCompleted} waves! Keep training!`,
          type: "decent_loss" as const,
        }
      } else {
        return {
          title: "⚔️ BRAVE ATTEMPT! ⚔️",
          subtitle: "The arena is tough, but you'll get stronger!",
          type: "poor_loss" as const,
        }
      }
    }

    // Determine if player performed well despite losing
    const crystalEfficiency = (gameState.playerStats.totalCrystals / 25) * 100 // 25 total crystals possible
    const timeEfficiency = ((300 - gameState.playerStats.totalTime) / 300) * 100
    const levelProgress = (gameState.playerStats.levelsCompleted / 3) * 100

    const overallPerformance = (crystalEfficiency + timeEfficiency + levelProgress) / 3

    if (overallPerformance >= 70) {
      return {
        title: "⭐ Great Effort! ⭐",
        subtitle: "You performed excellently but ran out of time!",
        type: "good_loss" as const,
      }
    } else if (overallPerformance >= 40) {
      return {
        title: "💪 Good Try! 💪",
        subtitle: "You made solid progress. Try again!",
        type: "decent_loss" as const,
      }
    } else {
      return {
        title: "🎯 Keep Practicing! 🎯",
        subtitle: "Every attempt makes you better!",
        type: "poor_loss" as const,
      }
    }
  }

  return (
    <>
      {/* Enhanced Main HUD with better visual hierarchy */}
      <div className="absolute top-6 left-6 z-10">
        <div className="bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-md border border-white/30 rounded-2xl p-6 min-w-80 shadow-2xl">
          {gameState.gamePhase === "challenge" ? (
            // Challenge Mode HUD
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  ARENA WAVE {gameState.challengeMode.wave}
                </h2>
                <div className="text-sm text-gray-400">Survival Challenge</div>
                {gameState.levelTransitionTime > 0 && (
                  <div className="text-xs text-green-400 animate-pulse mt-1">Preparing next wave...</div>
                )}
              </div>
              <div className="text-right">
                <div className={`text-2xl font-mono font-bold ${getTimeWarningColor()}`}>
                  {formatTime(gameState.challengeMode.waveTimeRemaining)}
                </div>
                <div className="text-xs text-gray-400">Wave Time Left</div>
              </div>
            </div>
          ) : (
            // Normal Level HUD
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Level {gameState.currentLevel}
                </h2>
                <div className="text-sm text-gray-400">{getLevelName()}</div>
                {gameState.levelTransitionTime > 0 && (
                  <div className="text-xs text-green-400 animate-pulse mt-1">Advancing to next level...</div>
                )}
              </div>
              <div className="text-right">
                <div className={`text-2xl font-mono font-bold ${getTimeWarningColor()}`}>
                  {formatTime(gameState.timeRemaining)}
                </div>
                <div className="text-xs text-gray-400">Total Time Left</div>
                {gameState.powerUps.timeFreeze.active && (
                  <div className="text-xs text-cyan-400 animate-pulse">TIME FROZEN</div>
                )}
              </div>
            </div>
          )}

          {gameState.gamePhase === "challenge" ? (
            // Challenge Mode Progress
            <div className="mb-4 space-y-3">
              <div>
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span className="flex items-center gap-2">
                    <span className="text-red-400">💀</span>
                    Enemies Remaining
                  </span>
                  <span className="font-bold">{gameState.challengeMode.enemiesRemaining}</span>
                </div>
                <div className="relative w-full bg-gray-700/50 rounded-full h-4 overflow-hidden border border-gray-600">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 transition-all duration-500 ease-out relative"
                    style={{
                      width: `${100 - (gameState.challengeMode.enemiesRemaining / (5 + (gameState.challengeMode.wave - 1) * 2)) * 100}%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span className="flex items-center gap-2">
                    <span className="text-green-400">❤️</span>
                    Health
                  </span>
                  <span className="font-bold">
                    {gameState.challengeMode.playerHealth}/{gameState.challengeMode.maxHealth}
                  </span>
                </div>
                <div className="relative w-full bg-gray-700/50 rounded-full h-4 overflow-hidden border border-gray-600">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300 ease-out relative"
                    style={{
                      width: `${(gameState.challengeMode.playerHealth / gameState.challengeMode.maxHealth) * 100}%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Normal Level Progress
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span className="flex items-center gap-2">
                  <span className="text-yellow-400">💎</span>
                  Crystals Collected
                </span>
                <span className="font-bold">
                  {gameState.crystalsCollected}/{gameState.crystalsRequired}
                </span>
              </div>
              <div className="relative w-full bg-gray-700/50 rounded-full h-4 overflow-hidden border border-gray-600">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out relative"
                  style={{ width: `${getProgressPercentage()}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
                {getProgressPercentage() > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Combo Display */}
          {gameState.combo > 0 && (
            <div className="mb-4 p-4 bg-gradient-to-r from-yellow-900/60 to-orange-900/60 border border-yellow-500/40 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 animate-pulse"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <span className="text-yellow-300 font-bold text-lg">COMBO</span>
                  <div className="text-xs text-yellow-200">
                    Max: {gameState.maxCombo} | Next: +{Math.min(gameState.combo + 1, 5)}x points
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-bold text-yellow-400 animate-bounce">x{gameState.combo}</span>
                </div>
              </div>
            </div>
          )}

          {gameState.gamePhase === "challenge" && (
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl border border-purple-500/20">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-medium flex items-center gap-2">
                  <span className="text-purple-400">⚔️</span>
                  Weapon Level
                </span>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  {gameState.challengeMode.weaponLevel}
                </span>
              </div>
            </div>
          )}

          {/* Enhanced Score Display */}
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-500/20">
            <span className="text-gray-300 font-medium">Score</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              {gameState.score.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Power-ups Panel */}
      <div className="absolute top-6 right-6 z-10">
        <div className="bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-md border border-white/30 rounded-2xl p-4 min-w-64 shadow-2xl">
          <h3 className="text-white font-bold mb-3 text-center text-lg">Active Power-ups</h3>

          <div className="space-y-3">
            {Object.entries(gameState.powerUps).map(([key, powerUp]) => {
              if (!powerUp.active) return null

              const names = {
                speedBoost: "⚡ Speed Boost",
                timeFreeze: "❄️ Time Freeze",
                magnetism: "🧲 Magnetism",
                doublePoints: "💰 Double Points",
              }

              const colors = {
                speedBoost: "from-green-600 to-green-400",
                timeFreeze: "from-cyan-600 to-cyan-400",
                magnetism: "from-purple-600 to-purple-400",
                doublePoints: "from-yellow-600 to-yellow-400",
              }

              const maxDuration =
                key === "speedBoost" ? 10000 : key === "timeFreeze" ? 5000 : key === "magnetism" ? 15000 : 20000
              const progress = (powerUp.timeLeft / maxDuration) * 100

              return (
                <div
                  key={key}
                  className={`p-3 bg-gradient-to-r ${colors[key as keyof typeof colors]} rounded-xl relative overflow-hidden shadow-lg`}
                >
                  <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                  <div className="relative flex justify-between items-center text-white">
                    <span className="font-bold text-sm">{names[key as keyof typeof names]}</span>
                    <span className="font-mono text-lg font-bold">{Math.ceil(powerUp.timeLeft / 1000)}s</span>
                  </div>
                  <div className="relative w-full bg-black/40 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-100 shadow-sm"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )
            })}

            {Object.values(gameState.powerUps).every((p) => !p.active) && (
              <div className="text-center text-gray-400 py-6">
                <div className="text-4xl mb-2">🎁</div>
                <div className="text-sm">No active power-ups</div>
                <div className="text-xs mt-1 text-gray-500">Collect glowing cubes to activate!</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Controls Panel */}
      <div className="absolute bottom-6 left-6 z-10">
        <div className="bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-md border border-white/30 rounded-2xl p-4 shadow-2xl">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <span className="text-blue-400">🎮</span>
            Controls
          </h3>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-center gap-3">
              <kbd className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/30 px-2 py-1 rounded text-xs font-mono">
                WASD
              </kbd>
              <span>Move around</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/30 px-2 py-1 rounded text-xs font-mono">
                Mouse
              </kbd>
              <span>Look around</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/30 px-2 py-1 rounded text-xs font-mono">
                Click
              </kbd>
              <span>Collect items</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/30 px-2 py-1 rounded text-xs font-mono">
                ESC
              </kbd>
              <span>Pause game</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Mini Map */}
      <div className="absolute bottom-6 right-6 z-10">
        <div className="bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-md border border-white/30 rounded-2xl p-4 shadow-2xl">
          <h3 className="text-white font-bold mb-2 text-center flex items-center justify-center gap-2">
            <span className="text-green-400">🗺️</span>
            Radar
          </h3>
          <div className="relative w-32 h-32 bg-gradient-to-br from-green-900/50 to-blue-900/50 rounded-full border-2 border-green-400/40 overflow-hidden">
            {/* Radar sweep effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/20 to-transparent animate-spin-slow"></div>

            {/* Player position with enhanced glow */}
            <div
              className="absolute w-4 h-4 bg-blue-400 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 shadow-lg"
              style={{
                left: `${(gameState.playerPosition[0] / (10 + gameState.currentLevel * 2)) * 50 + 50}%`,
                top: `${(gameState.playerPosition[2] / (10 + gameState.currentLevel * 2)) * 50 + 50}%`,
                boxShadow: "0 0 10px #60a5fa, 0 0 20px #60a5fa",
              }}
            >
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
            </div>

            {/* Remaining crystals indicator */}
            <div className="absolute bottom-2 left-2 text-xs text-yellow-400 font-bold bg-black/50 px-2 py-1 rounded">
              💎 {gameState.crystalsRequired - gameState.crystalsCollected}
            </div>

            {/* Level indicator */}
            <div className="absolute top-2 right-2 text-xs text-white font-bold bg-black/50 px-2 py-1 rounded">
              L{gameState.currentLevel}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Notifications with better animations */}
      <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-20 space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-6 py-4 rounded-xl backdrop-blur-md border shadow-2xl animate-in slide-in-from-top duration-500 ${
              notification.type === "success"
                ? "bg-gradient-to-r from-green-900/90 to-emerald-900/90 border-green-500/50 text-green-100"
                : notification.type === "warning"
                  ? "bg-gradient-to-r from-yellow-900/90 to-orange-900/90 border-yellow-500/50 text-yellow-100"
                  : "bg-gradient-to-r from-blue-900/90 to-purple-900/90 border-blue-500/50 text-blue-100"
            }`}
          >
            <p className="font-bold text-lg text-center">{notification.message}</p>
          </div>
        ))}
      </div>

      {/* Level Complete Screen */}
      {gameState.gamePhase === "levelComplete" && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-purple-900/95 to-blue-900/95 border border-purple-500/50 rounded-3xl p-10 text-center max-w-lg shadow-2xl">
            <h1 className="text-5xl font-bold text-white mb-6 animate-bounce">
              {gameState.crystalsCollected >= gameState.crystalsRequired ? "🎉 Level Complete! 🎉" : "⏰ Time's Up! ⏰"}
            </h1>

            {gameState.crystalsCollected >= gameState.crystalsRequired ? (
              <>
                <p className="text-xl text-gray-200 mb-8">You collected all {gameState.crystalsRequired} crystals!</p>
                <div className="space-y-3 mb-8 p-6 bg-black/30 rounded-2xl">
                  <div className="grid grid-cols-2 gap-4 text-gray-300">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">
                        {formatTime(gameState.totalTime - gameState.timeRemaining)}
                      </div>
                      <div className="text-sm">Completion Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400">{gameState.score.toLocaleString()}</div>
                      <div className="text-sm">Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">
                        +{Math.max(0, gameState.timeRemaining * 10)}
                      </div>
                      <div className="text-sm">Time Bonus</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-400">x{gameState.maxCombo}</div>
                      <div className="text-sm">Max Combo</div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 justify-center">
                  {gameState.currentLevel < 3 ? (
                    <button
                      onClick={() => {
                        actions.completeLevel()
                        actions.nextLevel()
                      }}
                      className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
                    >
                      Next Level →
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        actions.completeLevel()
                        actions.nextLevel()
                      }}
                      className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
                    >
                      Finish Game 🏆
                    </button>
                  )}
                  <button
                    onClick={() => actions.restartGame()}
                    className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white px-6 py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                  >
                    Restart
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xl text-gray-200 mb-8">You ran out of time! Try again?</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => actions.startLevel(gameState.currentLevel)}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => actions.restartGame()}
                    className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white px-6 py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                  >
                    Restart Game
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Game Won Screen */}
      {gameState.gamePhase === "gameWon" && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-yellow-900/95 to-orange-900/95 border border-yellow-500/50 rounded-3xl p-10 text-center max-w-2xl shadow-2xl">
            <h1 className="text-6xl font-bold text-white mb-6 animate-pulse">🏆 VICTORY! 🏆</h1>
            <p className="text-3xl text-gray-200 mb-8">You've conquered all three realms!</p>

            <div className="bg-black/40 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-white mb-6">🎯 Final Statistics</h3>
              <div className="grid grid-cols-2 gap-6 text-gray-300">
                <div className="text-center p-4 bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 rounded-xl">
                  <div className="text-4xl font-bold text-yellow-400">{gameState.playerStats.totalCrystals}</div>
                  <div className="text-sm mt-2">Total Crystals</div>
                  <div className="text-xs text-gray-400">out of 25 total</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl">
                  <div className="text-4xl font-bold text-blue-400">{formatTime(gameState.playerStats.totalTime)}</div>
                  <div className="text-sm mt-2">Total Time</div>
                  <div className="text-xs text-gray-400">out of 5:00 total</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl">
                  <div className="text-4xl font-bold text-green-400">{gameState.playerStats.levelsCompleted}</div>
                  <div className="text-sm mt-2">Levels Completed</div>
                  <div className="text-xs text-gray-400">out of 3 total</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl">
                  <div className="text-4xl font-bold text-purple-400">{gameState.score.toLocaleString()}</div>
                  <div className="text-sm mt-2">Final Score</div>
                  <div className="text-xs text-gray-400">with combos & bonuses</div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-xl">
                <div className="text-lg font-bold text-white mb-2">Performance Rating</div>
                <div className="flex justify-center items-center gap-4">
                  {gameState.gameWon ? (
                    <div className="text-6xl">🏆</div>
                  ) : getGameResult().type === "good_loss" ? (
                    <div className="text-6xl">⭐</div>
                  ) : getGameResult().type === "decent_loss" ? (
                    <div className="text-6xl">💪</div>
                  ) : (
                    <div className="text-6xl">🎯</div>
                  )}
                  <div className="text-left">
                    <div className="text-2xl font-bold text-white">
                      {gameState.gameWon
                        ? "CHAMPION"
                        : getGameResult().type === "good_loss"
                          ? "EXCELLENT"
                          : getGameResult().type === "decent_loss"
                            ? "GOOD"
                            : "KEEP TRYING"}
                    </div>
                    <div className="text-sm text-gray-300">
                      {gameState.gameWon
                        ? "Perfect execution!"
                        : getGameResult().type === "good_loss"
                          ? "Almost had it!"
                          : getGameResult().type === "decent_loss"
                            ? "Solid effort!"
                            : "Practice makes perfect!"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {gameState.achievements.size > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-4">🏅 Achievements Unlocked</h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  {Array.from(gameState.achievements).map((achievement) => (
                    <span
                      key={achievement}
                      className="bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-500/50 text-purple-200 px-4 py-2 rounded-full text-sm font-bold shadow-lg"
                    >
                      {getAchievementName(achievement)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => actions.restartGame()}
              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-10 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
            >
              🎮 Play Again
            </button>
          </div>
        </div>
      )}

      {gameState.gamePhase === "gameOver" && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div
            className={`border rounded-3xl p-10 text-center max-w-2xl shadow-2xl ${
              gameState.gameWon || getGameResult().type === "victory"
                ? "bg-gradient-to-br from-yellow-900/95 to-orange-900/95 border-yellow-500/50"
                : getGameResult().type === "good_loss"
                  ? "bg-gradient-to-br from-blue-900/95 to-purple-900/95 border-blue-500/50"
                  : getGameResult().type === "decent_loss"
                    ? "bg-gradient-to-br from-green-900/95 to-teal-900/95 border-green-500/50"
                    : "bg-gradient-to-br from-gray-900/95 to-slate-900/95 border-gray-500/50"
            }`}
          >
            <h1 className="text-6xl font-bold text-white mb-6 animate-pulse">{getGameResult().title}</h1>
            <p className="text-3xl text-gray-200 mb-8">{getGameResult().subtitle}</p>

            <div className="bg-black/40 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-white mb-6">📊 Your Performance</h3>
              <div className="grid grid-cols-2 gap-6 text-gray-300">
                {gameState.challengeMode.active ? (
                  <>
                    <div className="text-center p-4 bg-gradient-to-br from-red-900/30 to-red-800/30 rounded-xl">
                      <div className="text-4xl font-bold text-red-400">{gameState.challengeMode.wave - 1}</div>
                      <div className="text-sm mt-2">Waves Survived</div>
                      <div className="text-xs text-gray-400">in arena challenge</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-orange-900/30 to-orange-800/30 rounded-xl">
                      <div className="text-4xl font-bold text-orange-400">
                        {gameState.challengeMode.enemiesDefeated}
                      </div>
                      <div className="text-sm mt-2">Enemies Defeated</div>
                      <div className="text-xs text-gray-400">total kills</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl">
                      <div className="text-4xl font-bold text-blue-400">
                        {formatTime(gameState.challengeMode.survivalTime)}
                      </div>
                      <div className="text-sm mt-2">Survival Time</div>
                      <div className="text-xs text-gray-400">in the arena</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl">
                      <div className="text-4xl font-bold text-purple-400">{gameState.challengeMode.weaponLevel}</div>
                      <div className="text-sm mt-2">Max Weapon Level</div>
                      <div className="text-xs text-gray-400">achieved</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center p-4 bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 rounded-xl">
                      <div className="text-4xl font-bold text-yellow-400">{gameState.playerStats.totalCrystals}</div>
                      <div className="text-sm mt-2">Crystals Collected</div>
                      <div className="text-xs text-gray-400">out of 25 total</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl">
                      <div className="text-4xl font-bold text-blue-400">
                        {formatTime(gameState.playerStats.totalTime)}
                      </div>
                      <div className="text-sm mt-2">Time Used</div>
                      <div className="text-xs text-gray-400">out of 5:00 total</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl">
                      <div className="text-4xl font-bold text-green-400">{gameState.playerStats.levelsCompleted}</div>
                      <div className="text-sm mt-2">Levels Completed</div>
                      <div className="text-xs text-gray-400">out of 3 total</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl">
                      <div className="text-4xl font-bold text-purple-400">
                        {gameState.playerStats.finalScore.toLocaleString()}
                      </div>
                      <div className="text-sm mt-2">Final Score</div>
                      <div className="text-xs text-gray-400">with combos & bonuses</div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-xl">
                <div className="text-lg font-bold text-white mb-2">Performance Rating</div>
                <div className="flex justify-center items-center gap-4">
                  {gameState.gameWon || getGameResult().type === "victory" ? (
                    <div className="text-6xl">🏆</div>
                  ) : getGameResult().type === "good_loss" ? (
                    <div className="text-6xl">⭐</div>
                  ) : getGameResult().type === "decent_loss" ? (
                    <div className="text-6xl">💪</div>
                  ) : (
                    <div className="text-6xl">🎯</div>
                  )}
                  <div className="text-left">
                    <div className="text-2xl font-bold text-white">
                      {gameState.gameWon || getGameResult().type === "victory"
                        ? "CHAMPION"
                        : getGameResult().type === "good_loss"
                          ? "EXCELLENT"
                          : getGameResult().type === "decent_loss"
                            ? "GOOD"
                            : "KEEP TRYING"}
                    </div>
                    <div className="text-sm text-gray-300">
                      {gameState.gameWon || getGameResult().type === "victory"
                        ? "Perfect execution!"
                        : getGameResult().type === "good_loss"
                          ? "Almost had it!"
                          : getGameResult().type === "decent_loss"
                            ? "Solid effort!"
                            : "Practice makes perfect!"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {gameState.achievements.size > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-4">🏅 Achievements Unlocked</h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  {Array.from(gameState.achievements).map((achievement) => (
                    <span
                      key={achievement}
                      className="bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-500/50 text-purple-200 px-4 py-2 rounded-full text-sm font-bold shadow-lg"
                    >
                      {getAchievementName(achievement)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => actions.restartGame()}
              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-10 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
            >
              🎮 Play Again
            </button>
          </div>
        </div>
      )}

      {gameState.gamePhase === "challenge" && gameState.levelTransitionTime > 0 && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-red-900/95 to-orange-900/95 border border-red-500/50 rounded-3xl p-10 text-center max-w-lg shadow-2xl">
            <h1 className="text-5xl font-bold text-white mb-6 animate-pulse">🏟️ ENTERING THE ARENA! 🏟️</h1>
            <p className="text-xl text-gray-200 mb-8">
              You've completed all three levels! Now face the ultimate challenge - survive waves of enemies in the
              combat arena!
            </p>
            <div className="space-y-4 text-gray-300">
              <div className="flex items-center justify-center gap-3">
                <span className="text-red-400">⚔️</span>
                <span>Defeat enemies to progress through waves</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-yellow-400">⏱️</span>
                <span>Each wave has a time limit</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-green-400">❤️</span>
                <span>Avoid damage to survive longer</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-purple-400">⚔️</span>
                <span>Your weapon gets stronger each wave</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Pause Menu */}
      {showPauseMenu && gameState.gamePhase === "paused" && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-gray-600/50 rounded-3xl p-8 text-center shadow-2xl">
            <h2 className="text-4xl font-bold text-white mb-8">⏸️ Game Paused</h2>
            <div className="space-y-4">
              <button
                onClick={() => {
                  actions.resumeGame()
                  setShowPauseMenu(false)
                }}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                ▶️ Resume Game
              </button>
              <button
                onClick={() => {
                  actions.restartGame()
                  setShowPauseMenu(false)
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                🔄 Restart Level
              </button>
              <button
                onClick={() => {
                  actions.restartGame()
                  setShowPauseMenu(false)
                }}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                🏠 Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
