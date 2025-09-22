"use client"

import { useState, useEffect } from "react"

interface GameUIProps {
  playerName: string
  inventory?: {
    wood: number
    stone: number
    crystal: number
  }
  health?: number
  stamina?: number
  gameTime?: number
  dayPhase?: "dawn" | "day" | "dusk" | "night"
  onHealthChange?: (health: number) => void
  onStaminaChange?: (stamina: number) => void
  onInventoryUpdate?: (inventory: any) => void
}

export default function GameUI({
  playerName,
  inventory = { wood: 0, stone: 0, crystal: 0 },
  health: propHealth = 100,
  stamina: propStamina = 100,
  gameTime = 720,
  dayPhase = "day",
  onHealthChange,
  onStaminaChange,
  onInventoryUpdate,
}: GameUIProps) {
  const [health, setHealth] = useState(propHealth)
  const [stamina, setStamina] = useState(propStamina)
  const [showInventory, setShowInventory] = useState(false)
  const [showCrafting, setShowCrafting] = useState(false)
  const [showQuests, setShowQuests] = useState(false)
  const [notifications, setNotifications] = useState<
    Array<{ id: string; message: string; type: "info" | "success" | "warning" }>
  >([])

  useEffect(() => {
    setHealth(propHealth)
  }, [propHealth])

  useEffect(() => {
    setStamina(propStamina)
  }, [propStamina])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "KeyI") {
        setShowInventory((prev) => !prev)
      }
      if (e.code === "KeyC") {
        setShowCrafting((prev) => !prev)
      }
      if (e.code === "KeyQ") {
        setShowQuests((prev) => !prev)
      }
      if (e.code === "Escape") {
        setShowInventory(false)
        setShowCrafting(false)
        setShowQuests(false)
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [])

  const addNotification = (message: string, type: "info" | "success" | "warning" = "info") => {
    const id = Date.now().toString()
    setNotifications((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 3000)
  }

  const formatGameTime = () => {
    const hour = Math.floor(gameTime / 60)
    const minute = gameTime % 60
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
  }

  const getHealthColor = () => {
    if (health > 70) return "bg-green-500"
    if (health > 30) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getStaminaColor = () => {
    if (stamina > 50) return "bg-blue-500"
    if (stamina > 20) return "bg-orange-500"
    return "bg-red-500"
  }

  return (
    <>
      {/* Enhanced Top HUD */}
      <div className="absolute top-4 left-4 z-10">
        <div className="p-4 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-white font-bold text-lg">Welcome, {playerName}!</span>
            <div className="bg-white/10 text-white border border-white/20 px-2 py-1 rounded text-sm">
              {dayPhase.charAt(0).toUpperCase() + dayPhase.slice(1)} {formatGameTime()}
            </div>
          </div>
          <div className="space-y-3">
            {/* Enhanced Health Bar */}
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium w-16">Health</span>
              <div className="relative w-32 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-300 ${getHealthColor()}`}
                  style={{ width: `${health}%` }}
                />
                {health < 30 && <div className="absolute inset-0 animate-pulse bg-red-500/30" />}
              </div>
              <span className="text-white text-sm font-mono">{Math.round(health)}</span>
            </div>

            {/* Enhanced Stamina Bar */}
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium w-16">Stamina</span>
              <div className="relative w-32 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-300 ${getStaminaColor()}`}
                  style={{ width: `${stamina}%` }}
                />
                {stamina < 20 && <div className="absolute inset-0 animate-pulse bg-orange-500/30" />}
              </div>
              <span className="text-white text-sm font-mono">{Math.round(stamina)}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium w-16">Level</span>
              <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs">1</div>
              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-purple-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Inventory Display */}
      <div className="absolute top-4 right-4 z-10">
        <div className="p-4 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold">Resources</h3>
            <button
              className="bg-white/10 border border-white/20 text-white hover:bg-white/20 text-xs px-2 py-1 rounded"
              onClick={() => setShowInventory(!showInventory)}
            >
              {showInventory ? "Hide [I]" : "Inventory [I]"}
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-white text-sm">
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-600 rounded shadow-sm"></div>
                Wood
              </span>
              <div className="bg-green-600/20 text-green-300 border border-green-600/30 px-2 py-1 rounded text-xs">
                {inventory.wood}
              </div>
            </div>
            <div className="flex items-center justify-between text-white text-sm">
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded shadow-sm"></div>
                Stone
              </span>
              <div className="bg-gray-500/20 text-gray-300 border border-gray-500/30 px-2 py-1 rounded text-xs">
                {inventory.stone}
              </div>
            </div>
            <div className="flex items-center justify-between text-white text-sm">
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded shadow-sm animate-pulse"></div>
                Crystal
              </span>
              <div className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded text-xs">
                {inventory.crystal}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Controls Help */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="p-4 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg">
          <h3 className="text-white font-bold mb-2">Controls</h3>
          <div className="text-white text-sm space-y-1">
            <div>
              <kbd className="bg-white/20 px-1 rounded text-xs">WASD</kbd> - Move
            </div>
            <div>
              <kbd className="bg-white/20 px-1 rounded text-xs">Shift</kbd> - Sprint
            </div>
            <div>
              <kbd className="bg-white/20 px-1 rounded text-xs">Space</kbd> - Jump
            </div>
            <div>
              <kbd className="bg-white/20 px-1 rounded text-xs">Mouse</kbd> - Look Around
            </div>
            <div>
              <kbd className="bg-white/20 px-1 rounded text-xs">I</kbd> - Inventory
            </div>
            <div>
              <kbd className="bg-white/20 px-1 rounded text-xs">C</kbd> - Crafting
            </div>
            <div>
              <kbd className="bg-white/20 px-1 rounded text-xs">Q</kbd> - Quests
            </div>
            <div>
              <kbd className="bg-white/20 px-1 rounded text-xs">E</kbd> - Interact
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg animate-in slide-in-from-top duration-300 ${
              notification.type === "success"
                ? "bg-green-900/80 border border-green-500/50"
                : notification.type === "warning"
                  ? "bg-yellow-900/80 border border-yellow-500/50"
                  : "bg-blue-900/80 border border-blue-500/50"
            } backdrop-blur-sm`}
          >
            <p className="text-white text-sm font-medium">{notification.message}</p>
          </div>
        ))}
      </div>

      {/* Game Menu Buttons */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
        <button className="bg-black/80 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 px-3 py-2 rounded">
          Menu
        </button>
        <button
          className="bg-black/80 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 px-3 py-2 rounded"
          onClick={() => setShowCrafting(true)}
        >
          Craft [C]
        </button>
        <button
          className="bg-black/80 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 px-3 py-2 rounded"
          onClick={() => setShowQuests(true)}
        >
          Quests [Q]
        </button>
      </div>

      {/* Mini Map */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="p-2 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg">
          <div className="w-32 h-32 bg-green-900/30 rounded border border-green-500/30 relative">
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            <div className="absolute top-2 right-2 w-1 h-1 bg-blue-400 rounded-full" />
            <div className="absolute bottom-3 left-3 w-1 h-1 bg-yellow-400 rounded-full" />
            <p className="absolute bottom-1 left-1 text-xs text-white/60">Map</p>
          </div>
        </div>
      </div>

      {/* Simple Inventory Panel */}
      {showInventory && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-96 max-h-96 overflow-y-auto bg-black/90 border border-white/20 rounded-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Inventory</h2>
                <button
                  className="bg-white/10 border border-white/20 text-white hover:bg-white/20 px-2 py-1 rounded text-sm"
                  onClick={() => setShowInventory(false)}
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 16 }, (_, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 bg-gray-800 border border-gray-600 rounded flex items-center justify-center"
                  >
                    {i === 0 && inventory.wood > 0 && (
                      <div className="text-center">
                        <div className="w-8 h-8 bg-green-600 rounded mb-1"></div>
                        <span className="text-white text-xs">{inventory.wood}</span>
                      </div>
                    )}
                    {i === 1 && inventory.stone > 0 && (
                      <div className="text-center">
                        <div className="w-8 h-8 bg-gray-500 rounded mb-1"></div>
                        <span className="text-white text-xs">{inventory.stone}</span>
                      </div>
                    )}
                    {i === 2 && inventory.crystal > 0 && (
                      <div className="text-center">
                        <div className="w-8 h-8 bg-purple-500 rounded mb-1 animate-pulse"></div>
                        <span className="text-white text-xs">{inventory.crystal}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simple Crafting Panel */}
      {showCrafting && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-96 max-h-96 overflow-y-auto bg-black/90 border border-white/20 rounded-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Crafting</h2>
                <button
                  className="bg-white/10 border border-white/20 text-white hover:bg-white/20 px-2 py-1 rounded text-sm"
                  onClick={() => setShowCrafting(false)}
                >
                  Close
                </button>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-800 p-3 rounded border border-gray-600">
                  <h3 className="text-white font-medium mb-2">Wooden Pickaxe</h3>
                  <p className="text-gray-300 text-sm mb-2">Requires: 3 Wood, 2 Stone</p>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    disabled={inventory.wood < 3 || inventory.stone < 2}
                    onClick={() => addNotification("Crafted Wooden Pickaxe!", "success")}
                  >
                    Craft
                  </button>
                </div>
                <div className="bg-gray-800 p-3 rounded border border-gray-600">
                  <h3 className="text-white font-medium mb-2">Crystal Sword</h3>
                  <p className="text-gray-300 text-sm mb-2">Requires: 1 Crystal, 2 Stone</p>
                  <button
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                    disabled={inventory.crystal < 1 || inventory.stone < 2}
                    onClick={() => addNotification("Crafted Crystal Sword!", "success")}
                  >
                    Craft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simple Quest Panel */}
      {showQuests && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-96 max-h-96 overflow-y-auto bg-black/90 border border-white/20 rounded-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Quest Journal</h2>
                <button
                  className="bg-white/10 border border-white/20 text-white hover:bg-white/20 px-2 py-1 rounded text-sm"
                  onClick={() => setShowQuests(false)}
                >
                  Close
                </button>
              </div>
              <div className="space-y-3">
                <div className="bg-yellow-900/30 border border-yellow-500/50 p-3 rounded">
                  <h3 className="text-yellow-300 font-medium mb-2">🌟 Gather Resources</h3>
                  <p className="text-gray-300 text-sm mb-2">Collect 10 Wood and 5 Stone to help build the village.</p>
                  <div className="text-sm text-gray-400">
                    Progress: {inventory.wood}/10 Wood, {inventory.stone}/5 Stone
                  </div>
                  {inventory.wood >= 10 && inventory.stone >= 5 && (
                    <button
                      className="mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      onClick={() => {
                        addNotification("Quest completed! Received 50 XP and 2 Crystals!", "success")
                        if (onInventoryUpdate) {
                          onInventoryUpdate({ ...inventory, crystal: inventory.crystal + 2 })
                        }
                      }}
                    >
                      Complete Quest
                    </button>
                  )}
                </div>
                <div className="bg-blue-900/30 border border-blue-500/50 p-3 rounded">
                  <h3 className="text-blue-300 font-medium mb-2">💎 Crystal Hunter</h3>
                  <p className="text-gray-300 text-sm mb-2">
                    Find and collect 3 magical crystals from around the island.
                  </p>
                  <div className="text-sm text-gray-400">Progress: {inventory.crystal}/3 Crystals</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
