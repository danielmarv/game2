"use client"

import { Suspense, useState, useEffect } from "react"
import dynamic from "next/dynamic"

const Canvas = dynamic(() => import("@react-three/fiber").then((mod) => ({ default: mod.Canvas })), { ssr: false })
const Physics = dynamic(() => import("@react-three/cannon").then((mod) => ({ default: mod.Physics })), { ssr: false })

// Simple 3D components without external dependencies
function FloatingIsland() {
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

      {/* Trees */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const radius = 4 + Math.random() * 2
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        return (
          <group key={i} position={[x, 1, z]}>
            {/* Tree trunk */}
            <mesh position={[0, 1, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.3, 2]} />
              <meshLambertMaterial color="#8b4513" />
            </mesh>
            {/* Tree leaves */}
            <mesh position={[0, 2.5, 0]} castShadow>
              <sphereGeometry args={[1.2]} />
              <meshLambertMaterial color="#228b22" />
            </mesh>
          </group>
        )
      })}

      {/* Rocks */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 6
        const radius = 2 + Math.random() * 1.5
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        return (
          <mesh key={i} position={[x, 0.3, z]} castShadow>
            <dodecahedronGeometry args={[0.5]} />
            <meshLambertMaterial color="#696969" />
          </mesh>
        )
      })}

      {/* Crystals */}
      {Array.from({ length: 4 }, (_, i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
        const radius = 1 + Math.random()
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        return (
          <mesh key={i} position={[x, 0.8, z]} castShadow>
            <octahedronGeometry args={[0.4]} />
            <meshLambertMaterial color="#9370db" emissive="#4b0082" emissiveIntensity={0.2} />
          </mesh>
        )
      })}
    </group>
  )
}

function Player({ position = [0, 1, 5] }) {
  return (
    <group position={position}>
      {/* Player body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.3, 1]} />
        <meshLambertMaterial color="#ff6b6b" />
      </mesh>
      {/* Player head */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.25]} />
        <meshLambertMaterial color="#ffdbac" />
      </mesh>
    </group>
  )
}

function SimpleGameUI({
  inventory,
  health,
  stamina,
}: {
  inventory: { wood: number; stone: number; crystal: number }
  health: number
  stamina: number
}) {
  return (
    <div className="absolute top-4 left-4 bg-black/50 text-white p-4 rounded-lg">
      <div className="space-y-2">
        <div>Health: {health}/100</div>
        <div>Stamina: {stamina}/100</div>
        <div className="border-t pt-2">
          <div>Wood: {inventory.wood}</div>
          <div>Stone: {inventory.stone}</div>
          <div>Crystal: {inventory.crystal}</div>
        </div>
      </div>
    </div>
  )
}

export default function GamePage() {
  const [inventory, setInventory] = useState({ wood: 5, stone: 3, crystal: 1 })
  const [health, setHealth] = useState(100)
  const [stamina, setStamina] = useState(100)
  const [gameTime, setGameTime] = useState(720) // Start at noon
  const [isClient, setIsClient] = useState(false)

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
            <FloatingIsland />
            <Player />
          </Physics>
        </Suspense>
      </Canvas>

      <SimpleGameUI inventory={inventory} health={health} stamina={stamina} />

      <div className="absolute top-4 right-4 bg-black/50 text-white p-4 rounded-lg">
        <div>
          Time: {Math.floor(hour)}:{String(gameTime % 60).padStart(2, "0")}
        </div>
        <div>Phase: {dayPhase}</div>
      </div>

      <div className="absolute bottom-4 left-4 bg-black/50 text-white p-4 rounded-lg">
        <div className="text-sm">
          <div>WASD - Move around</div>
          <div>Mouse - Look around</div>
          <div>Click - Interact with objects</div>
        </div>
      </div>
    </div>
  )
}
