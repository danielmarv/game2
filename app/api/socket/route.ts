import type { NextRequest } from "next/server"
import { Server as SocketIOServer } from "socket.io"
import { Server as HTTPServer } from "http"

// Store for active players
const activePlayers = new Map()

// Socket.IO server instance
let io: SocketIOServer

export async function GET(req: NextRequest) {
  if (!io) {
    // Initialize Socket.IO server
    const httpServer = new HTTPServer()
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })

    io.on("connection", (socket) => {
      console.log("[v0] Player connected:", socket.id)

      // Handle player join
      socket.on("player-join", (playerData) => {
        console.log("[v0] Player joined:", playerData)
        activePlayers.set(socket.id, {
          id: socket.id,
          name: playerData.name,
          position: playerData.position || [0, 5, 0],
          color: playerData.color || "#FF6B6B",
        })

        // Send current players to new player
        socket.emit("players-list", Array.from(activePlayers.values()))

        // Broadcast new player to others
        socket.broadcast.emit("player-joined", activePlayers.get(socket.id))
      })

      // Handle player movement
      socket.on("player-move", (movementData) => {
        const player = activePlayers.get(socket.id)
        if (player) {
          player.position = movementData.position
          player.velocity = movementData.velocity

          // Broadcast movement to other players
          socket.broadcast.emit("player-moved", {
            id: socket.id,
            position: movementData.position,
            velocity: movementData.velocity,
          })
        }
      })

      // Handle resource collection
      socket.on("resource-collected", (resourceData) => {
        console.log("[v0] Resource collected:", resourceData)
        // Broadcast to all players that resource was collected
        io.emit("resource-collected", {
          playerId: socket.id,
          resourceId: resourceData.resourceId,
          resourceType: resourceData.resourceType,
        })
      })

      // Handle player disconnect
      socket.on("disconnect", () => {
        console.log("[v0] Player disconnected:", socket.id)
        activePlayers.delete(socket.id)

        // Broadcast player left to others
        socket.broadcast.emit("player-left", socket.id)
      })
    })
  }

  return new Response("Socket.IO server initialized", { status: 200 })
}
