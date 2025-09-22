"use client"

import { useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"

interface Player {
  id: string
  name: string
  position: [number, number, number]
  color: string
  velocity?: [number, number, number]
}

interface UseMultiplayerProps {
  playerName: string
  onResourceCollected?: (data: any) => void
}

export function useMultiplayer({ playerName, onResourceCollected }: UseMultiplayerProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [otherPlayers, setOtherPlayers] = useState<Player[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const playerDataRef = useRef({
    name: playerName,
    position: [0, 5, 0] as [number, number, number],
    color: "#FF6B6B",
  })

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "ws://localhost:3001", {
      transports: ["websocket", "polling"],
    })

    newSocket.on("connect", () => {
      console.log("[v0] Connected to multiplayer server")
      setIsConnected(true)

      // Join the game
      newSocket.emit("player-join", playerDataRef.current)
    })

    newSocket.on("disconnect", () => {
      console.log("[v0] Disconnected from multiplayer server")
      setIsConnected(false)
    })

    // Handle other players list
    newSocket.on("players-list", (players: Player[]) => {
      console.log("[v0] Received players list:", players)
      setOtherPlayers(players.filter((p) => p.id !== newSocket.id))
    })

    // Handle new player joined
    newSocket.on("player-joined", (player: Player) => {
      console.log("[v0] Player joined:", player)
      setOtherPlayers((prev) => [...prev, player])
    })

    // Handle player movement
    newSocket.on(
      "player-moved",
      (movementData: { id: string; position: [number, number, number]; velocity: [number, number, number] }) => {
        setOtherPlayers((prev) =>
          prev.map((player) =>
            player.id === movementData.id
              ? { ...player, position: movementData.position, velocity: movementData.velocity }
              : player,
          ),
        )
      },
    )

    // Handle player left
    newSocket.on("player-left", (playerId: string) => {
      console.log("[v0] Player left:", playerId)
      setOtherPlayers((prev) => prev.filter((p) => p.id !== playerId))
    })

    // Handle resource collection
    newSocket.on("resource-collected", (data: any) => {
      console.log("[v0] Resource collected by player:", data)
      if (onResourceCollected) {
        onResourceCollected(data)
      }
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [playerName, onResourceCollected])

  const sendMovement = (position: [number, number, number], velocity: [number, number, number]) => {
    if (socket && isConnected) {
      playerDataRef.current.position = position
      socket.emit("player-move", { position, velocity })
    }
  }

  const sendResourceCollection = (resourceId: string, resourceType: string) => {
    if (socket && isConnected) {
      socket.emit("resource-collected", { resourceId, resourceType })
    }
  }

  return {
    socket,
    otherPlayers,
    isConnected,
    sendMovement,
    sendResourceCollection,
  }
}
