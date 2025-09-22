"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"

const Canvas = dynamic(() => import("@react-three/fiber").then((mod) => ({ default: mod.Canvas })), { ssr: false })
const Physics = dynamic(() => import("@react-three/cannon").then((mod) => ({ default: mod.Physics })), { ssr: false })

function TreasureHuntIsland({
  onCrystalCollect,
  collectedCrystals,
}: { onCrystalCollect: (id: number) => void; collectedCrystals: Set<number> }) {
  const crystalPositions = [
    [4, 1, 2],
    [-3, 1, 4],
    [5, 1, -2],
    [-4, 1, -3],
    [2, 1, -5],
    [-2, 1, 5],
    [6, 1, 0],
    [-6, 1, 1],
    [0, 1, 6],
    [1, 1, -6],
  ]

  return (
    <group>
      {/* Main island platform */}
      <mesh position={[0, -2, 0]} receiveShadow>
        <cylinderGeometry args={[10, 12, 4, 16]} />
        <meshLambertMaterial color="#4a5d23" />
      </mesh>

      {/* Grass top */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[10, 10, 0.5, 16]} />
        <meshLambertMaterial color="#6b8e23" />
      </mesh>

      {/* Treasure Crystals */}
      {crystalPositions.map((pos, i) => {
        if (collectedCrystals.has(i)) return null

        return (
          <group key={i} position={pos as [number, number, number]}>
            <mesh
              onClick={() => {
                onCrystalCollect(i)
              }}
              onPointerOver={(e) => {
                e.object.scale.setScalar(1.2)
              }}
              onPointerOut={(e) => {
                e.object.scale.setScalar(1)
              }}
            >
              <octahedronGeometry args={[0.5]} />
              <meshLambertMaterial color="#FFD700" emissive="#FFA500" emissiveIntensity={0.3} />
            </mesh>
            {/* Glowing effect */}
            <pointLight position={[0, 0, 0]} color="#FFD700" intensity={0.5} distance={3} />
          </group>
        )
      })}

      {/* Decorative trees */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2
        const radius = 7
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        return (
          <group key={`tree-${i}`} position={[x, 1, z]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.2, 0.3, 2]} />
              <meshLambertMaterial color="#8b4513" />
            </mesh>
            <mesh position={[0, 1.5, 0]} castShadow>
              <sphereGeometry args={[1]} />
              <meshLambertMaterial color="#228b22" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function EnhancedPlayerController({
  playerPosition,
  setPlayerPosition,
}: {
  playerPosition: [number, number, number]
  setPlayerPosition: (pos: [number, number, number]) => void
}) {
  const playerRef = useRef<any>()
  const [keys, setKeys] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log("[v0] Key pressed:", e.key.toLowerCase())
      setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: true }))
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: false }))
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  useEffect(() => {
    const movePlayer = () => {
      if (!playerRef.current) return

      const speed = 0.15
      let moveX = 0
      let moveZ = 0

      if (keys["w"]) moveZ -= speed
      if (keys["s"]) moveZ += speed
      if (keys["a"]) moveX -= speed
      if (keys["d"]) moveX += speed

      if (moveX !== 0 || moveZ !== 0) {
        const newX = Math.max(-9, Math.min(9, playerPosition[0] + moveX))
        const newZ = Math.max(-9, Math.min(9, playerPosition[2] + moveZ))
        const newPosition: [number, number, number] = [newX, playerPosition[1], newZ]

        setPlayerPosition(newPosition)
        playerRef.current.position.set(newX, playerPosition[1], newZ)

        console.log("[v0] Player moved to:", newPosition)
      }
    }

    const interval = setInterval(movePlayer, 16)
    return () => clearInterval(interval)
  }, [keys, playerPosition, setPlayerPosition])

  return (
    <mesh ref={playerRef} position={playerPosition}>
      <boxGeometry args={[0.5, 1.8, 0.5]} />
      <meshLambertMaterial color="#4169E1" transparent opacity={0.7} />
    </mesh>
  )
}

function MiniMap({
  crystalPositions,
  collectedCrystals,
  playerPosition,
}: {
  crystalPositions: number[][]
  collectedCrystals: Set<number>
  playerPosition: [number, number, number]
}) {
  const mapSize = 120
  const scale = mapSize / 20 // Island radius is about 10, so 20 total width

  return (
    <div className="absolute top-4 right-4 bg-black/80 p-3 rounded-lg">
      <h3 className="text-white text-sm font-bold mb-2 text-center">Map</h3>
      <div
        className="relative bg-green-600 rounded-full border-2 border-green-400"
        style={{ width: mapSize, height: mapSize }}
      >
        {/* Island representation */}
        <div className="absolute inset-1 bg-green-500 rounded-full"></div>

        {/* Player position */}
        <div
          className="absolute w-2 h-2 bg-blue-400 rounded-full border border-white transform -translate-x-1 -translate-y-1"
          style={{
            left: `${(playerPosition[0] / 10) * (mapSize / 2) + mapSize / 2}px`,
            top: `${(playerPosition[2] / 10) * (mapSize / 2) + mapSize / 2}px`,
          }}
        />

        {/* Crystal positions */}
        {crystalPositions.map((pos, i) => {
          if (collectedCrystals.has(i)) return null

          return (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full transform -translate-x-0.5 -translate-y-0.5 animate-pulse"
              style={{
                left: `${(pos[0] / 10) * (mapSize / 2) + mapSize / 2}px`,
                top: `${(pos[2] / 10) * (mapSize / 2) + mapSize / 2}px`,
              }}
            />
          )
        })}
      </div>
      <div className="text-xs text-white/80 mt-1 text-center">
        <div>🔵 You</div>
        <div>💎 Crystals</div>
      </div>
    </div>
  )
}

function SimpleGameUI({
  crystalsCollected,
  totalCrystals,
  gameWon,
  timeElapsed,
  crystalPositions,
  collectedCrystals,
  playerPosition,
}: {
  crystalsCollected: number
  totalCrystals: number
  gameWon: boolean
  timeElapsed: number
  crystalPositions: number[][]
  collectedCrystals: Set<number>
  playerPosition: [number, number, number]
}) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Game UI */}
      <div className="absolute top-4 left-4 bg-black/70 text-white p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Crystal Hunt</h2>
        <div className="space-y-1">
          <div className="text-lg">
            💎 Crystals: {crystalsCollected}/{totalCrystals}
          </div>
          <div>⏱️ Time: {formatTime(timeElapsed)}</div>
          <div className="text-sm text-yellow-300 mt-2">Find all crystals to win!</div>
        </div>
      </div>

      <MiniMap
        crystalPositions={crystalPositions}
        collectedCrystals={collectedCrystals}
        playerPosition={playerPosition}
      />

      {/* Controls */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white p-4 rounded-lg">
        <h3 className="font-bold mb-2">Controls:</h3>
        <div className="text-sm space-y-1">
          <div>🎮 WASD - Move around</div>
          <div>🖱️ Mouse - Look around</div>
          <div>👆 Click crystals to collect</div>
          <div>🗺️ Check map for crystal locations</div>
        </div>
      </div>

      {/* Win screen */}
      {gameWon && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto">
          <div className="bg-white p-8 rounded-lg text-center">
            <h1 className="text-4xl font-bold text-green-600 mb-4">🎉 You Won! 🎉</h1>
            <p className="text-xl mb-4">All crystals collected!</p>
            <p className="text-lg">Time: {formatTime(timeElapsed)}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GamePage() {
  const [crystalsCollected, setCrystalsCollected] = useState(0)
  const [collectedCrystals, setCollectedCrystals] = useState<Set<number>>(new Set())
  const [gameWon, setGameWon] = useState(false)
  const [startTime] = useState(Date.now())
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 2, 8])

  const totalCrystals = 10
  const crystalPositions = [
    [4, 1, 2],
    [-3, 1, 4],
    [5, 1, -2],
    [-4, 1, -3],
    [2, 1, -5],
    [-2, 1, 5],
    [6, 1, 0],
    [-6, 1, 1],
    [0, 1, 6],
    [1, 1, -6],
  ]

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  useEffect(() => {
    if (crystalsCollected >= totalCrystals && !gameWon) {
      setGameWon(true)
    }
  }, [crystalsCollected, totalCrystals, gameWon])

  const handleCrystalCollect = (id: number) => {
    if (!collectedCrystals.has(id)) {
      setCollectedCrystals((prev) => new Set([...prev, id]))
      setCrystalsCollected((prev) => prev + 1)
      console.log("[v0] Crystal collected:", id)
    }
  }

  if (!isClient) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-2xl mb-4">Loading Crystal Hunt...</div>
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen relative overflow-hidden bg-gradient-to-b from-blue-400 to-blue-600">
      <Canvas
        camera={{
          position: [0, 5, 10],
          fov: 75,
        }}
        className="absolute inset-0"
        shadows
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />

          <Physics gravity={[0, -30, 0]}>
            <TreasureHuntIsland onCrystalCollect={handleCrystalCollect} collectedCrystals={collectedCrystals} />
            <EnhancedPlayerController playerPosition={playerPosition} setPlayerPosition={setPlayerPosition} />
          </Physics>
        </Suspense>
      </Canvas>

      <SimpleGameUI
        crystalsCollected={crystalsCollected}
        totalCrystals={totalCrystals}
        gameWon={gameWon}
        timeElapsed={timeElapsed}
        crystalPositions={crystalPositions}
        collectedCrystals={collectedCrystals}
        playerPosition={playerPosition}
      />
    </div>
  )
}
