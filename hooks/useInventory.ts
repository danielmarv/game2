"use client"

import { useState, useCallback } from "react"

interface InventoryItem {
  type: string
  count: number
}

interface Inventory {
  wood: number
  stone: number
  crystal: number
}

export function useInventory() {
  const [inventory, setInventory] = useState<Inventory>({
    wood: 0,
    stone: 0,
    crystal: 0,
  })

  const addItem = useCallback((itemType: string, amount = 1) => {
    setInventory((prev) => ({
      ...prev,
      [itemType]: (prev[itemType as keyof Inventory] || 0) + amount,
    }))
  }, [])

  const removeItem = useCallback((itemType: string, amount = 1) => {
    setInventory((prev) => ({
      ...prev,
      [itemType]: Math.max(0, (prev[itemType as keyof Inventory] || 0) - amount),
    }))
  }, [])

  const hasItem = useCallback(
    (itemType: string, amount = 1) => {
      return (inventory[itemType as keyof Inventory] || 0) >= amount
    },
    [inventory],
  )

  const getTotalItems = useCallback(() => {
    return Object.values(inventory).reduce((total, count) => total + count, 0)
  }, [inventory])

  return {
    inventory,
    addItem,
    removeItem,
    hasItem,
    getTotalItems,
  }
}
