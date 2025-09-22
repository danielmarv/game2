"use client"

import { Suspense, useState, useEffect } from "react"
import dynamic from "next/dynamic"
import GameUI from "@/components/game/GameUI"
import PlayerController from "@/components/game/PlayerController"
import InteractableObject from "@/components/game/InteractableObject"

const Canvas = dynamic(() => import("@react-three/fiber").then((mod) => ({ default: mod.Canvas })), { ssr: false })
const Physics = dynamic(() => import("@react-three/cannon").then((mod) => ({ default: mod.Physics })), { ssr: false })

function FloatingIsland({
  onResourceCollect,
  onNPCInteract,
  onObjectInteract,
}: {
  onResourceCollect?: (type: string, amount: number) => void
  onNPCInteract?: (npcId: string) => void
  onObjectInteract?: (objectId: string) => void
}) {
  return (
    <group>
      {/* Main island platform */}
      <mesh position={[0, -2, 0]} receiveShadow>
        <cylinderGeometry args={[8, 10, 4, 16]} />
        <meshLambertMaterial color="#4a5d23" />
      </mesh>

      {/* Grass top */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[8, 8, 0.5, 16]} />
        <meshLambertMaterial color="#6b8e23" />
      </mesh>

      {/* Trees - Interactive resource nodes */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const radius = 4 + Math.random() * 2
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        return (
          <InteractableObject
            key={`tree-${i}`}
            type="tree"
            position={[x, 1, z]}
            onInteract={(type, data) => {
              if (data?.resource && onResourceCollect) {
                onResourceCollect(data.resource, data.amount)
              }
            }}
          >
            <mesh position={[0, 1, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.3, 2]} />
              <meshLambertMaterial color="#8b4513" />
            </mesh>
            <mesh position={[0, 2.5, 0]} castShadow>
              <sphereGeometry args={[1.2]} />
              <meshLambertMaterial color="#228b22" />
            </mesh>
          </InteractableObject>
        )
      })}

      {/* Rocks - Interactive resource nodes */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 6
        const radius = 2 + Math.random() * 1.5
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        return (
          <InteractableObject
            key={`rock-${i}`}
            type="rock"
            position={[x, 0.3, z]}
            onInteract={(type, data) => {
              if (data?.resource && onResourceCollect) {
                onResourceCollect(data.resource, data.amount)
              }
            }}
          >
            <mesh castShadow>
              <dodecahedronGeometry args={[0.5]} />
              <meshLambertMaterial color="#696969" />
            </mesh>
          </InteractableObject>
        )
      })}

      {/* Crystals - Rare interactive resource nodes */}
      {Array.from({ length: 4 }, (_, i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
        const radius = 1 + Math.random()
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        return (
          <InteractableObject
            key={`crystal-${i}`}
            type="crystal"
            position={[x, 0.8, z]}
            onInteract={(type, data) => {
              if (data?.resource && onResourceCollect) {
                onResourceCollect(data.resource, data.amount)
              }
            }}
          >
            <mesh castShadow>
              <octahedronGeometry args={[0.4]} />
              <meshLambertMaterial color="#9370db" emissive="#4b0082" emissiveIntensity={0.2} />
            </mesh>
          </InteractableObject>
        )
      })}

      {/* NPCs - Simple character models */}
      <InteractableObject
        type="npc"
        position={[3, 1, 3]}
        onInteract={(type, data) => {
          if (onNPCInteract) {
            onNPCInteract(data?.npcId || "trader")
          }
        }}
      >
        <mesh position={[0, 0.5, 0]} castShadow>
          <capsuleGeometry args={[0.3, 1]} />
          <meshLambertMaterial color="#4169E1" />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow>
          <sphereGeometry args={[0.25]} />
          <meshLambertMaterial color="#ffdbac" />
        </mesh>
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.1]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
      </InteractableObject>

      {/* Interactive objects - Treasure chest */}
      <InteractableObject
        type="chest"
        position={[-3, 0.5, -3]}
        onInteract={(type, data) => {
          if (data?.rewards && onResourceCollect) {
            data.rewards.forEach((reward: any) => {
              onResourceCollect(reward.resource, reward.amount)
            })
          }
        }}
      >
        <mesh castShadow>
          <boxGeometry args={[1, 0.6, 0.8]} />
          <meshLambertMaterial color="#8B4513" />
        </mesh>
        <mesh position={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.2]} />
          <meshLambertMaterial color="#FFD700" />
        </mesh>
      </InteractableObject>
    </group>
  )
}

export default function GamePage() {
  const [inventory, setInventory] = useState({ wood: 5, stone: 3, crystal: 1 })
  const [health, setHealth] = useState(100)
  const [stamina, setStamina] = useState(100)
  const [gameTime, setGameTime] = useState(720) // Start at noon
  const [isClient, setIsClient] = useState(false)
  const [playerName] = useState("Adventurer")

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setGameTime((prev) => (prev + 1) % 1440)
    }, 3000) // Slower time progression
    return () => clearInterval(interval)
  }, [])

  const hour = Math.floor(gameTime / 60)
  let dayPhase: "dawn" | "day" | "dusk" | "night" = "day"
  if (hour >= 5 && hour < 8) dayPhase = "dawn"
  else if (hour >= 8 && hour < 18) dayPhase = "day"
  else if (hour >= 18 && hour < 21) dayPhase = "dusk"
  else dayPhase = "night"

  const getLightingIntensity = () => {
    switch (dayPhase) {
      case "dawn":
        return { ambient: 0.3, directional: 0.6 }
      case "day":
        return { ambient: 0.5, directional: 1.0 }
      case "dusk":
        return { ambient: 0.4, directional: 0.7 }
      case "night":
        return { ambient: 0.2, directional: 0.3 }
    }
  }

  const getBackgroundColor = () => {
    switch (dayPhase) {
      case "dawn":
        return "#FFB347"
      case "day":
        return "#87CEEB"
      case "dusk":
        return "#FF6347"
      case "night":
        return "#191970"
    }
  }

  const handleResourceCollect = (type: string, amount: number) => {
    setInventory((prev) => ({
      ...prev,
      [type]: (prev[type as keyof typeof prev] || 0) + amount,
    }))

    // Show collection feedback
    console.log(`[v0] Collected ${amount} ${type}`)
  }

  const handleNPCInteract = (npcId: string) => {
    console.log(`[v0] Talking to NPC: ${npcId}`)
    // Could open dialogue system here
  }

  const handleObjectInteract = (objectId: string) => {
    console.log(`[v0] Interacting with: ${objectId}`)
  }

  if (!isClient) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-2xl mb-4">Loading 3D Adventure Game...</div>
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    )
  }

  const lighting = getLightingIntensity()

  return (
    <div className="w-full h-screen relative overflow-hidden" style={{ backgroundColor: getBackgroundColor() }}>
      <Canvas
        camera={{
          position: [0, 8, 15],
          fov: 60,
        }}
        className="absolute inset-0"
        shadows
      >
        <Suspense fallback={null}>
          <ambientLight intensity={lighting.ambient} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={lighting.directional}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />

          <fog attach="fog" args={[getBackgroundColor(), 20, 100]} />

          <Physics gravity={[0, -30, 0]}>
            <FloatingIsland
              onResourceCollect={handleResourceCollect}
              onNPCInteract={handleNPCInteract}
              onObjectInteract={handleObjectInteract}
            />
            <PlayerController
              onResourceCollect={handleResourceCollect}
              onNPCInteract={handleNPCInteract}
              onObjectInteract={handleObjectInteract}
            />
          </Physics>
        </Suspense>
      </Canvas>

      <GameUI
        playerName={playerName}
        inventory={inventory}
        health={health}
        stamina={stamina}
        gameTime={gameTime}
        dayPhase={dayPhase}
        onHealthChange={setHealth}
        onStaminaChange={setStamina}
        onInventoryUpdate={setInventory}
      />
    </div>
  )
}
