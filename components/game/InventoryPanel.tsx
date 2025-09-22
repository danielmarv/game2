"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Package, Hammer, Zap } from "lucide-react"

interface InventoryPanelProps {
  inventory: {
    wood: number
    stone: number
    crystal: number
  }
  onClose: () => void
  playerName: string
}

interface CraftingRecipe {
  id: string
  name: string
  description: string
  requirements: { [key: string]: number }
  result: { type: string; amount: number }
  icon: string
}

const craftingRecipes: CraftingRecipe[] = [
  {
    id: "wooden_tool",
    name: "Wooden Tool",
    description: "A basic tool for gathering resources faster",
    requirements: { wood: 5 },
    result: { type: "tool", amount: 1 },
    icon: "🔨",
  },
  {
    id: "stone_pickaxe",
    name: "Stone Pickaxe",
    description: "Mine stone and crystals more efficiently",
    requirements: { wood: 3, stone: 5 },
    result: { type: "tool", amount: 1 },
    icon: "⛏️",
  },
  {
    id: "crystal_staff",
    name: "Crystal Staff",
    description: "A magical staff that enhances movement speed",
    requirements: { wood: 2, stone: 3, crystal: 8 },
    result: { type: "tool", amount: 1 },
    icon: "🔮",
  },
]

export default function InventoryPanel({ inventory, onClose, playerName }: InventoryPanelProps) {
  const [selectedTab, setSelectedTab] = useState("inventory")

  const getTotalItems = () => {
    return Object.values(inventory).reduce((total, count) => total + count, 0)
  }

  const canCraft = (recipe: CraftingRecipe) => {
    return Object.entries(recipe.requirements).every(
      ([resource, amount]) => inventory[resource as keyof typeof inventory] >= amount,
    )
  }

  const handleCraft = (recipe: CraftingRecipe) => {
    if (canCraft(recipe)) {
      console.log(`[v0] Crafting ${recipe.name}`)
      // TODO: Implement actual crafting logic
      alert(`Crafted ${recipe.name}! (This would consume resources and add the item to inventory)`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[80vh] bg-gray-900/95 border-gray-700 text-white overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-700">
          <div>
            <CardTitle className="text-2xl font-bold text-white">{playerName}'s Inventory</CardTitle>
            <CardDescription className="text-gray-300">Manage your resources and craft new items</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-6 h-full overflow-y-auto">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800">
              <TabsTrigger value="inventory" className="data-[state=active]:bg-gray-700">
                <Package className="h-4 w-4 mr-2" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="crafting" className="data-[state=active]:bg-gray-700">
                <Hammer className="h-4 w-4 mr-2" />
                Crafting
              </TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-gray-700">
                <Zap className="h-4 w-4 mr-2" />
                Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Wood */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-2xl">
                          🌳
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Wood</h3>
                          <p className="text-sm text-gray-400">Basic building material</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30">
                        {inventory.wood}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Stone */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center text-2xl">
                          🪨
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Stone</h3>
                          <p className="text-sm text-gray-400">Durable construction material</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                        {inventory.stone}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Crystal */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-2xl">
                          💎
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Crystal</h3>
                          <p className="text-sm text-gray-400">Magical energy source</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        {inventory.crystal}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                <h3 className="font-semibold text-white mb-2">Inventory Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-gray-300">
                    <span>Total Items: </span>
                    <span className="text-white font-semibold">{getTotalItems()}</span>
                  </div>
                  <div className="text-gray-300">
                    <span>Inventory Slots: </span>
                    <span className="text-white font-semibold">{getTotalItems()}/100</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="crafting" className="mt-6">
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Crafting Recipes</h3>
                  <p className="text-gray-400">Combine resources to create useful items</p>
                </div>

                {craftingRecipes.map((recipe) => (
                  <Card key={recipe.id} className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">{recipe.icon}</div>
                          <div>
                            <h4 className="font-semibold text-white">{recipe.name}</h4>
                            <p className="text-sm text-gray-400 mb-2">{recipe.description}</p>
                            <div className="flex gap-2 flex-wrap">
                              {Object.entries(recipe.requirements).map(([resource, amount]) => (
                                <Badge
                                  key={resource}
                                  variant="outline"
                                  className={`text-xs ${
                                    inventory[resource as keyof typeof inventory] >= amount
                                      ? "border-green-500 text-green-400"
                                      : "border-red-500 text-red-400"
                                  }`}
                                >
                                  {resource}: {amount}/{inventory[resource as keyof typeof inventory]}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleCraft(recipe)}
                          disabled={!canCraft(recipe)}
                          className={`${
                            canCraft(recipe) ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 cursor-not-allowed"
                          }`}
                        >
                          Craft
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Player Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Resources Collected:</span>
                      <span className="text-white font-semibold">{getTotalItems()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time Played:</span>
                      <span className="text-white font-semibold">--:--</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Distance Traveled:</span>
                      <span className="text-white font-semibold">-- meters</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Achievements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400">
                        🏆
                      </Badge>
                      <span className="text-gray-300">First Steps</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-green-600/20 text-green-400">
                        🌳
                      </Badge>
                      <span className="text-gray-300">Lumberjack</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-4">More achievements unlock as you play!</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
