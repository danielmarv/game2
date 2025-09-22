"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface Recipe {
  id: string
  name: string
  description: string
  requirements: { [key: string]: number }
  result: { item: string; quantity: number }
  category: "tools" | "structures" | "consumables"
}

interface CraftingSystemProps {
  inventory: { [key: string]: number }
  onCraft: (recipe: Recipe) => void
  onClose: () => void
}

const recipes: Recipe[] = [
  {
    id: "wooden_axe",
    name: "Wooden Axe",
    description: "Chop trees faster with this basic tool",
    requirements: { wood: 3, stone: 1 },
    result: { item: "wooden_axe", quantity: 1 },
    category: "tools",
  },
  {
    id: "stone_pickaxe",
    name: "Stone Pickaxe",
    description: "Mine rocks and crystals more efficiently",
    requirements: { wood: 2, stone: 3 },
    result: { item: "stone_pickaxe", quantity: 1 },
    category: "tools",
  },
  {
    id: "campfire",
    name: "Campfire",
    description: "A cozy fire for warmth and light",
    requirements: { wood: 5, stone: 2 },
    result: { item: "campfire", quantity: 1 },
    category: "structures",
  },
  {
    id: "crystal_torch",
    name: "Crystal Torch",
    description: "Magical light source that never dims",
    requirements: { wood: 1, crystal: 2 },
    result: { item: "crystal_torch", quantity: 1 },
    category: "structures",
  },
  {
    id: "health_potion",
    name: "Health Potion",
    description: "Restores 50 health points",
    requirements: { crystal: 1, wood: 1 },
    result: { item: "health_potion", quantity: 1 },
    category: "consumables",
  },
]

export default function CraftingSystem({ inventory, onCraft, onClose }: CraftingSystemProps) {
  const [selectedCategory, setSelectedCategory] = useState<"tools" | "structures" | "consumables">("tools")
  const [craftingProgress, setCraftingProgress] = useState<{ [key: string]: number }>({})

  const canCraft = (recipe: Recipe) => {
    return Object.entries(recipe.requirements).every(([item, required]) => (inventory[item] || 0) >= required)
  }

  const handleCraft = async (recipe: Recipe) => {
    if (!canCraft(recipe)) return

    // Start crafting animation
    setCraftingProgress((prev) => ({ ...prev, [recipe.id]: 0 }))

    // Simulate crafting time
    const craftingTime = 2000 // 2 seconds
    const interval = setInterval(() => {
      setCraftingProgress((prev) => {
        const current = prev[recipe.id] || 0
        if (current >= 100) {
          clearInterval(interval)
          onCraft(recipe)
          return { ...prev, [recipe.id]: 0 }
        }
        return { ...prev, [recipe.id]: current + 5 }
      })
    }, 100)
  }

  const filteredRecipes = recipes.filter((recipe) => recipe.category === selectedCategory)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-4xl h-[80vh] bg-black/90 border-white/20 overflow-hidden">
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Crafting Station</h2>
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Close [ESC]
            </Button>
          </div>

          <div className="flex gap-6 flex-1 overflow-hidden">
            {/* Category Tabs */}
            <div className="w-48 space-y-2">
              <h3 className="text-white font-semibold mb-3">Categories</h3>
              {(["tools", "structures", "consumables"] as const).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className={`w-full justify-start ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>

            {/* Recipe List */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {filteredRecipes.map((recipe) => {
                const craftable = canCraft(recipe)
                const iscrafting = (craftingProgress[recipe.id] || 0) > 0

                return (
                  <Card
                    key={recipe.id}
                    className={`p-4 ${
                      craftable ? "bg-green-900/20 border-green-500/30" : "bg-gray-900/20 border-gray-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-lg">{recipe.name}</h4>
                        <p className="text-gray-300 text-sm mb-3">{recipe.description}</p>

                        <div className="space-y-2">
                          <h5 className="text-white font-medium">Requirements:</h5>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(recipe.requirements).map(([item, required]) => {
                              const available = inventory[item] || 0
                              const hasEnough = available >= required

                              return (
                                <Badge
                                  key={item}
                                  variant="outline"
                                  className={`${
                                    hasEnough
                                      ? "bg-green-600/20 text-green-300 border-green-600/30"
                                      : "bg-red-600/20 text-red-300 border-red-600/30"
                                  }`}
                                >
                                  {item}: {available}/{required}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>

                        {iscrafting && (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white text-sm">Crafting...</span>
                              <span className="text-white text-sm">{Math.round(craftingProgress[recipe.id])}%</span>
                            </div>
                            <Progress value={craftingProgress[recipe.id]} className="w-full" />
                          </div>
                        )}
                      </div>

                      <div className="ml-4 text-center">
                        <div className="mb-3">
                          <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center mb-2">
                            <span className="text-2xl">🔨</span>
                          </div>
                          <p className="text-white text-sm font-medium">
                            +{recipe.result.quantity} {recipe.result.item.replace("_", " ")}
                          </p>
                        </div>

                        <Button
                          onClick={() => handleCraft(recipe)}
                          disabled={!craftable || iscrafting}
                          className={`${
                            craftable && !iscrafting
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-gray-600 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {iscrafting ? "Crafting..." : "Craft"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
