"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import InventoryPanel from "./InventoryPanel"
import CraftingSystem from "./CraftingSystem"
import QuestSystem from "./QuestSystem"

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

  const handleQuestComplete = (rewards: { [key: string]: number }) => {
    // Update inventory with quest rewards
    const newInventory = { ...inventory }
    Object.entries(rewards).forEach(([item, amount]) => {
      newInventory[item as keyof typeof inventory] += amount
    })

    if (onInventoryUpdate) {
      onInventoryUpdate(newInventory)
    }

    addNotification(
      `Quest completed! Received: ${Object.entries(rewards)
        .map(([item, amount]) => `${amount} ${item}`)
        .join(", ")}`,
      "success",
    )
  }

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

  const handleCraft = (recipe: any) => {
    addNotification(`Crafted ${recipe.name}!`, "success")
    // Here you would update the actual inventory
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
        <Card className="p-4 bg-black/80 backdrop-blur-sm border-white/20">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-white font-bold text-lg">Welcome, {playerName}!</span>
            <Badge variant="outline" className="bg-white/10 text-white border-white/20">
              {dayPhase.charAt(0).toUpperCase() + dayPhase.slice(1)} {formatGameTime()}
            </Badge>
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
              <Badge className="bg-purple-600 text-white">1</Badge>
              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-purple-500" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Quick Inventory Display */}
      <div className="absolute top-4 right-4 z-10">
        <Card className="p-4 bg-black/80 backdrop-blur-sm border-white/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold">Resources</h3>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
              onClick={() => setShowInventory(!showInventory)}
            >
              {showInventory ? "Hide [I]" : "Inventory [I]"}
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-white text-sm">
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-600 rounded shadow-sm"></div>
                Wood
              </span>
              <Badge variant="secondary" className="bg-green-600/20 text-green-300 border-green-600/30">
                {inventory.wood}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-white text-sm">
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded shadow-sm"></div>
                Stone
              </span>
              <Badge variant="secondary" className="bg-gray-500/20 text-gray-300 border-gray-500/30">
                {inventory.stone}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-white text-sm">
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded shadow-sm animate-pulse"></div>
                Crystal
              </span>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                {inventory.crystal}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Controls Help */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="p-4 bg-black/80 backdrop-blur-sm border-white/20">
          <h3 className="text-white font-bold mb-2">Controls</h3>
          <div className="text-white text-sm space-y-1">
            <div>
              <kbd className="bg-white/20 px-1 rounded text-xs">WASD</kbd> - Move
            </div>
            <div>
              <kbd className="bg-white/20 px-1 rounded text-xs">Shift</kbd> - Sprint
            </div>
            <div>
              <kbd className="bg-white/20 px-1 rounded text-xs">Ctrl</kbd> - Crouch
            </div>
            <div>
              <kbd className="bg-white/20 px-1 rounded text-xs">Space</kbd> - Jump
            </div>
            <div>
              <kbd className="bg-white/20 px-1 rounded text-xs">Right Click</kbd> - Free Look
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
              <kbd className="bg-white/20 px-1 rounded text-xs">E</kbd> - Interact with NPCs
            </div>
            <div>
              <kbd className="bg-white/20 px-1 rounded text-xs">F</kbd> - Interact with Objects
            </div>
          </div>
        </Card>
      </div>

      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 space-y-2">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`p-3 animate-in slide-in-from-top duration-300 ${
              notification.type === "success"
                ? "bg-green-900/80 border-green-500/50"
                : notification.type === "warning"
                  ? "bg-yellow-900/80 border-yellow-500/50"
                  : "bg-blue-900/80 border-blue-500/50"
            } backdrop-blur-sm`}
          >
            <p className="text-white text-sm font-medium">{notification.message}</p>
          </Card>
        ))}
      </div>

      {/* Game Menu Button */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
        <Button variant="outline" className="bg-black/80 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
          Menu
        </Button>
        <Button
          variant="outline"
          className="bg-black/80 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          onClick={() => setShowCrafting(true)}
        >
          Craft [C]
        </Button>
        <Button
          variant="outline"
          className="bg-black/80 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          onClick={() => setShowQuests(true)}
        >
          Quests [Q]
        </Button>
      </div>

      <div className="absolute bottom-4 right-4 z-10">
        <Card className="p-2 bg-black/80 backdrop-blur-sm border-white/20">
          <div className="w-32 h-32 bg-green-900/30 rounded border border-green-500/30 relative">
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            <div className="absolute top-2 right-2 w-1 h-1 bg-blue-400 rounded-full" />
            <div className="absolute bottom-3 left-3 w-1 h-1 bg-yellow-400 rounded-full" />
            <p className="absolute bottom-1 left-1 text-xs text-white/60">Map</p>
          </div>
        </Card>
      </div>

      {/* Full Inventory Panel */}
      {showInventory && (
        <InventoryPanel inventory={inventory} onClose={() => setShowInventory(false)} playerName={playerName} />
      )}

      {/* Crafting System */}
      {showCrafting && (
        <CraftingSystem inventory={inventory} onCraft={handleCraft} onClose={() => setShowCrafting(false)} />
      )}

      {showQuests && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-96 max-h-96 overflow-y-auto bg-black/90 border-white/20">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Quest Journal</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuests(false)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Close
                </Button>
              </div>
              <QuestSystem inventory={inventory} onQuestComplete={handleQuestComplete} />
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
