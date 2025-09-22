"use client"
import { useState, useEffect } from "react"

interface Quest {
  id: string
  title: string
  description: string
  requirements: { [key: string]: number }
  rewards: { [key: string]: number }
  isCompleted: boolean
  isActive: boolean
}

interface QuestSystemProps {
  inventory: { [key: string]: number }
  onQuestComplete: (rewards: { [key: string]: number }) => void
}

export default function QuestSystem({ inventory, onQuestComplete }: QuestSystemProps) {
  const [quests, setQuests] = useState<Quest[]>([
    {
      id: "gather-wood",
      title: "Gather Wood",
      description: "Collect 5 wood from trees",
      requirements: { wood: 5 },
      rewards: { crystal: 2 },
      isCompleted: false,
      isActive: true,
    },
    {
      id: "collect-stones",
      title: "Stone Collector",
      description: "Gather 3 stone from rocks",
      requirements: { stone: 3 },
      rewards: { wood: 5 },
      isCompleted: false,
      isActive: true,
    },
    {
      id: "crystal-hunter",
      title: "Crystal Hunter",
      description: "Find 2 crystals",
      requirements: { crystal: 2 },
      rewards: { stone: 10, wood: 10 },
      isCompleted: false,
      isActive: false,
    },
  ])

  useEffect(() => {
    setQuests((prevQuests) =>
      prevQuests.map((quest) => {
        if (quest.isActive && !quest.isCompleted) {
          const isCompleted = Object.entries(quest.requirements).every(
            ([item, required]) => (inventory[item] || 0) >= required,
          )

          if (isCompleted && !quest.isCompleted) {
            onQuestComplete(quest.rewards)
            return { ...quest, isCompleted: true }
          }
        }
        return quest
      }),
    )
  }, [inventory, onQuestComplete])

  const activeQuests = quests.filter((q) => q.isActive && !q.isCompleted)
  const completedQuests = quests.filter((q) => q.isCompleted)

  return (
    <div className="absolute top-4 right-4 bg-black/70 text-white p-4 rounded-lg max-w-xs">
      <h3 className="text-lg font-bold mb-2">Quests</h3>

      {activeQuests.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-yellow-400 mb-1">Active</h4>
          {activeQuests.map((quest) => (
            <div key={quest.id} className="mb-2 p-2 bg-gray-800 rounded">
              <div className="font-medium text-sm">{quest.title}</div>
              <div className="text-xs text-gray-300 mb-1">{quest.description}</div>
              <div className="text-xs">
                {Object.entries(quest.requirements).map(([item, required]) => (
                  <div
                    key={item}
                    className={`${(inventory[item] || 0) >= required ? "text-green-400" : "text-red-400"}`}
                  >
                    {item}: {inventory[item] || 0}/{required}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {completedQuests.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-green-400 mb-1">Completed</h4>
          {completedQuests.slice(-3).map((quest) => (
            <div key={quest.id} className="text-xs text-green-300 mb-1">
              ✓ {quest.title}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
