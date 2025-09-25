"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { GameProvider, useGame } from "@/hooks/useGameState"
import ModernGameUI from "@/components/game/ModernGameUI"
import LoadingScreen from "@/components/game/LoadingScreen"
import PlayerController from "@/components/game/PlayerController"

const Canvas = dynamic(() => import("@react-three/fiber").then((mod) => ({ default: mod.Canvas })), { ssr: false })
const Physics = dynamic(() => import("@react-three/cannon").then((mod) => ({ default: mod.Physics })), { ssr: false })

function ModernGameWorld() {
  const { gameState, actions } = useGame()
  const { currentLevel, playerPosition, collectedItems, gamePhase, powerUps, specialEffects, challengeMode } = gameState

  // Level configurations with increasing difficulty
  const levelConfigs = {
    1: {
      name: "Crystal Shores",
      objectives: { crystals: 5, time: 120 },
      crystalPositions: [
        [4, 1, 2],
        [-3, 1, 4],
        [5, 1, -2],
        [-4, 1, -3],
        [2, 1, -5],
      ],
      environment: { skyColor: "#87CEEB", islandColor: "#6b8e23" },
    },
    2: {
      name: "Mystic Peaks",
      objectives: { crystals: 8, time: 180 },
      crystalPositions: [
        [6, 1, 3],
        [-5, 1, 6],
        [7, 1, -3],
        [-6, 1, -4],
        [3, 1, -7],
        [-3, 1, 7],
        [8, 1, 0],
        [-8, 1, 2],
      ],
      environment: { skyColor: "#4B0082", islandColor: "#2F4F4F" },
    },
    3: {
      name: "Dragon's Realm",
      objectives: { crystals: 12, time: 240 },
      crystalPositions: [
        [8, 1, 4],
        [-7, 1, 6],
        [9, 1, -4],
        [-8, 1, -5],
        [4, 1, -9],
        [-4, 1, 9],
        [10, 1, 0],
        [-10, 1, 3],
        [0, 1, 10],
        [5, 1, 8],
        [-6, 1, -7],
        [7, 1, -6],
      ],
      environment: { skyColor: "#8B0000", islandColor: "#800080" },
    },
  }

  const currentConfig = levelConfigs[currentLevel as keyof typeof levelConfigs] || levelConfigs[1]

  const [powerUpPositions, setPowerUpPositions] = useState<
    Array<{
      id: string
      type: "speed" | "time" | "magnet" | "double"
      position: [number, number, number]
    }>
  >([])

  const [enemies, setEnemies] = useState<
    Array<{
      id: string
      position: [number, number, number]
      health: number
      maxHealth: number
      type: "basic" | "fast" | "heavy"
      lastAttack: number
    }>
  >([])

  useEffect(() => {
    // Spawn power-ups randomly during gameplay
    if (gamePhase === "playing") {
      const spawnInterval = setInterval(() => {
        if (Math.random() < 0.3 && powerUpPositions.length < 2) {
          const radius = 8 + currentLevel
          const angle = Math.random() * Math.PI * 2
          const x = Math.cos(angle) * radius * Math.random()
          const z = Math.sin(angle) * radius * Math.random()

          const powerUpTypes = ["speed", "time", "magnet", "double"] as const
          const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]

          setPowerUpPositions((prev) => [
            ...prev,
            {
              id: `powerup-${Date.now()}`,
              type: randomType,
              position: [x, 1.5, z],
            },
          ])
        }
      }, 8000) // Spawn every 8 seconds

      return () => clearInterval(spawnInterval)
    }
  }, [gamePhase, currentLevel, powerUpPositions.length])

  useEffect(() => {
    if (gamePhase === "challenge" && challengeMode.active) {
      // Spawn enemies for the current wave
      const enemyCount = challengeMode.enemiesRemaining
      const currentEnemyCount = enemies.length

      if (currentEnemyCount < enemyCount) {
        const enemiesToSpawn = enemyCount - currentEnemyCount
        const newEnemies = []

        for (let i = 0; i < enemiesToSpawn; i++) {
          const angle = Math.random() * Math.PI * 2
          const radius = 8 + Math.random() * 4
          const x = Math.cos(angle) * radius
          const z = Math.sin(angle) * radius

          const enemyTypes = ["basic", "fast", "heavy"] as const
          const weights =
            challengeMode.wave <= 2 ? [0.7, 0.2, 0.1] : challengeMode.wave <= 4 ? [0.5, 0.3, 0.2] : [0.3, 0.4, 0.3]
          const randomValue = Math.random()
          let enemyType: "basic" | "fast" | "heavy" = "basic"

          if (randomValue < weights[0]) enemyType = "basic"
          else if (randomValue < weights[0] + weights[1]) enemyType = "fast"
          else enemyType = "heavy"

          const baseHealth = enemyType === "basic" ? 30 : enemyType === "fast" ? 20 : 50
          const health = baseHealth + (challengeMode.wave - 1) * 10

          newEnemies.push({
            id: `enemy-${Date.now()}-${i}`,
            position: [x, 1, z] as [number, number, number],
            health,
            maxHealth: health,
            type: enemyType,
            lastAttack: 0,
          })
        }

        setEnemies((prev) => [...prev, ...newEnemies])
      }
    } else if (gamePhase !== "challenge") {
      // Clear enemies when not in challenge mode
      setEnemies([])
    }
  }, [gamePhase, challengeMode.active, challengeMode.enemiesRemaining, challengeMode.wave, enemies.length])

  useEffect(() => {
    if (gamePhase === "challenge" && enemies.length > 0) {
      const enemyUpdateInterval = setInterval(() => {
        setEnemies((prevEnemies) => {
          return prevEnemies.map((enemy) => {
            // Calculate distance to player
            const dx = playerPosition[0] - enemy.position[0]
            const dz = playerPosition[2] - enemy.position[2]
            const distance = Math.sqrt(dx * dx + dz * dz)

            // Move towards player
            const speed = enemy.type === "fast" ? 0.08 : enemy.type === "heavy" ? 0.04 : 0.06
            const moveX = (dx / distance) * speed
            const moveZ = (dz / distance) * speed

            const newX = enemy.position[0] + moveX
            const newZ = enemy.position[2] + moveZ

            // Attack player if close enough
            const now = Date.now()
            if (
              distance < 2 &&
              now - enemy.lastAttack > (enemy.type === "fast" ? 1000 : enemy.type === "heavy" ? 2000 : 1500)
            ) {
              const damage = enemy.type === "basic" ? 15 : enemy.type === "fast" ? 10 : 25
              actions.takeDamage(damage)
              return { ...enemy, lastAttack: now }
            }

            return {
              ...enemy,
              position: [newX, enemy.position[1], newZ] as [number, number, number],
            }
          })
        })
      }, 100)

      return () => clearInterval(enemyUpdateInterval)
    }
  }, [gamePhase, enemies.length, playerPosition, actions])

  const handlePowerUpCollection = (powerUpId: string, type: string) => {
    setPowerUpPositions((prev) => prev.filter((p) => p.id !== powerUpId))

    // Activate power-up based on type
    switch (type) {
      case "speed":
        actions.activatePowerUp("speedBoost", 10000) // 10 seconds
        break
      case "time":
        actions.activatePowerUp("timeFreeze", 5000) // 5 seconds
        break
      case "magnet":
        actions.activatePowerUp("magnetism", 15000) // 15 seconds
        break
      case "double":
        actions.activatePowerUp("doublePoints", 20000) // 20 seconds
        break
    }

    actions.addSpecialEffect({
      type: "explosion",
      position: powerUpPositions.find((p) => p.id !== powerUpId)?.position || [0, 0, 0],
    })
  }

  const handleEnemyAttack = (enemyId: string) => {
    const enemy = enemies.find((e) => e.id === enemyId)
    if (!enemy) return

    const damage = challengeMode.weaponLevel * 20 + 10
    const newHealth = enemy.health - damage

    if (newHealth <= 0) {
      // Enemy defeated
      setEnemies((prev) => prev.filter((e) => e.id !== enemyId))
      actions.defeatEnemy()
      actions.addSpecialEffect({
        type: "explosion",
        position: enemy.position,
      })
    } else {
      // Enemy damaged
      setEnemies((prev) => prev.map((e) => (e.id === enemyId ? { ...e, health: newHealth } : e)))
      actions.addSpecialEffect({
        type: "sparkle",
        position: enemy.position,
      })
    }
  }

  return (
    <group>
      {/* Physics ground */}
      <mesh position={[0, -1, 0]} receiveShadow>
        <boxGeometry args={[50, 2, 50]} />
        <meshLambertMaterial color="#4a5d23" transparent opacity={0} />
      </mesh>

      {gamePhase === "challenge" ? (
        <>
          {/* Arena floor */}
          <mesh position={[0, -1, 0]} receiveShadow>
            <cylinderGeometry args={[15, 15, 2, 32]} />
            <meshLambertMaterial color="#2a2a2a" />
          </mesh>

          {/* Arena walls */}
          {Array.from({ length: 16 }, (_, i) => {
            const angle = (i / 16) * Math.PI * 2
            const x = Math.cos(angle) * 16
            const z = Math.sin(angle) * 16
            return (
              <mesh key={`wall-${i}`} position={[x, 2, z]} rotation={[0, angle, 0]}>
                <boxGeometry args={[2, 4, 0.5]} />
                <meshLambertMaterial color="#444444" />
              </mesh>
            )
          })}

          {/* Arena lighting */}
          <pointLight position={[0, 8, 0]} intensity={1.5} color="#ff4444" distance={20} />
          <pointLight position={[8, 6, 8]} intensity={0.8} color="#ff8844" distance={15} />
          <pointLight position={[-8, 6, -8]} intensity={0.8} color="#ff8844" distance={15} />
        </>
      ) : (
        // Normal level environment
        <>
          {/* Dynamic Island based on level */}
          <mesh position={[0, -2, 0]} receiveShadow>
            <cylinderGeometry args={[12 + currentLevel * 2, 14 + currentLevel * 2, 4, 16]} />
            <meshLambertMaterial color={currentConfig.environment.islandColor} />
          </mesh>

          <mesh position={[0, 0, 0]} receiveShadow>
            <cylinderGeometry args={[12 + currentLevel * 2, 12 + currentLevel * 2, 0.5, 16]} />
            <meshLambertMaterial color={currentConfig.environment.islandColor} />
          </mesh>

          {/* Level-specific crystals */}
          {currentConfig.crystalPositions.map((pos, i) => {
            const crystalId = `level-${currentLevel}-crystal-${i}`
            if (collectedItems.has(crystalId)) return null

            return (
              <group key={crystalId} position={pos as [number, number, number]}>
                <mesh
                  onClick={() => actions.collectItem(crystalId, "crystal", pos as [number, number, number])}
                  onPointerOver={(e) => {
                    e.object.scale.setScalar(1.3)
                  }}
                  onPointerOut={(e) => {
                    e.object.scale.setScalar(1)
                  }}
                >
                  <octahedronGeometry args={[0.6 + currentLevel * 0.1]} />
                  <meshLambertMaterial
                    color={currentLevel === 1 ? "#FFD700" : currentLevel === 2 ? "#9370DB" : "#FF4500"}
                    emissive={currentLevel === 1 ? "#FFA500" : currentLevel === 2 ? "#8A2BE2" : "#FF6347"}
                    emissiveIntensity={0.4}
                  />
                </mesh>
                <pointLight
                  position={[0, 0, 0]}
                  color={currentLevel === 1 ? "#FFD700" : currentLevel === 2 ? "#9370DB" : "#FF4500"}
                  intensity={0.6}
                  distance={4}
                />
              </group>
            )
          })}

          {/* Level decorations */}
          {Array.from({ length: 8 + currentLevel * 2 }, (_, i) => {
            const angle = (i / (8 + currentLevel * 2)) * Math.PI * 2
            const radius = 9 + currentLevel
            const x = Math.cos(angle) * radius
            const z = Math.sin(angle) * radius
            return (
              <group key={`decoration-${i}`} position={[x, 1, z]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.15, 0.25, 1.5 + currentLevel * 0.3]} />
                  <meshLambertMaterial color="#654321" />
                </mesh>
                <mesh position={[0, 1.2 + currentLevel * 0.2, 0]} castShadow>
                  <sphereGeometry args={[0.8 + currentLevel * 0.1]} />
                  <meshLambertMaterial
                    color={currentLevel === 1 ? "#228b22" : currentLevel === 2 ? "#4B0082" : "#8B0000"}
                  />
                </mesh>
              </group>
            )
          })}
        </>
      )}

      {gamePhase === "challenge" &&
        enemies.map((enemy) => (
          <group key={enemy.id} position={enemy.position}>
            <mesh
              onClick={() => handleEnemyAttack(enemy.id)}
              onPointerOver={(e) => {
                e.object.scale.setScalar(1.2)
              }}
              onPointerOut={(e) => {
                e.object.scale.setScalar(1)
              }}
            >
              <boxGeometry
                args={
                  enemy.type === "heavy" ? [1.2, 1.5, 1.2] : enemy.type === "fast" ? [0.6, 1, 0.6] : [0.8, 1.2, 0.8]
                }
              />
              <meshLambertMaterial
                color={enemy.type === "heavy" ? "#8B0000" : enemy.type === "fast" ? "#FFD700" : "#FF4500"}
                emissive={enemy.type === "heavy" ? "#4B0000" : enemy.type === "fast" ? "#B8860B" : "#CC3300"}
                emissiveIntensity={0.3}
              />
            </mesh>

            {/* Enemy health bar */}
            <group position={[0, enemy.type === "heavy" ? 2 : enemy.type === "fast" ? 1.5 : 1.8, 0]}>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[1, 0.1]} />
                <meshBasicMaterial color="#333333" />
              </mesh>
              <mesh position={[-(1 - enemy.health / enemy.maxHealth) / 2, 0, 0.01]}>
                <planeGeometry args={[enemy.health / enemy.maxHealth, 0.08]} />
                <meshBasicMaterial
                  color={
                    enemy.health > enemy.maxHealth * 0.5
                      ? "#00FF00"
                      : enemy.health > enemy.maxHealth * 0.25
                        ? "#FFFF00"
                        : "#FF0000"
                  }
                />
              </mesh>
            </group>

            {/* Enemy glow */}
            <pointLight
              position={[0, 0.5, 0]}
              color={enemy.type === "heavy" ? "#8B0000" : enemy.type === "fast" ? "#FFD700" : "#FF4500"}
              intensity={0.4}
              distance={3}
            />
          </group>
        ))}

      {powerUpPositions.map((powerUp) => (
        <group key={powerUp.id} position={powerUp.position}>
          <mesh
            onClick={() => handlePowerUpCollection(powerUp.id, powerUp.type)}
            onPointerOver={(e) => {
              e.object.scale.setScalar(1.2)
            }}
            onPointerOut={(e) => {
              e.object.scale.setScalar(1)
            }}
          >
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshLambertMaterial
              color={
                powerUp.type === "speed"
                  ? "#00FF00"
                  : powerUp.type === "time"
                    ? "#00FFFF"
                    : powerUp.type === "magnet"
                      ? "#FF00FF"
                      : "#FFFF00"
              }
              emissive={
                powerUp.type === "speed"
                  ? "#008800"
                  : powerUp.type === "time"
                    ? "#008888"
                    : powerUp.type === "magnet"
                      ? "#880088"
                      : "#888800"
              }
              emissiveIntensity={0.3}
            />
          </mesh>
          <pointLight
            position={[0, 0, 0]}
            color={
              powerUp.type === "speed"
                ? "#00FF00"
                : powerUp.type === "time"
                  ? "#00FFFF"
                  : powerUp.type === "magnet"
                    ? "#FF00FF"
                    : "#FFFF00"
            }
            intensity={0.5}
            distance={3}
          />
          {/* Floating animation */}
          <mesh position={[0, Math.sin(Date.now() * 0.005) * 0.2, 0]}>
            <ringGeometry args={[0.6, 0.8, 8]} />
            <meshBasicMaterial
              color={
                powerUp.type === "speed"
                  ? "#00FF00"
                  : powerUp.type === "time"
                    ? "#00FFFF"
                    : powerUp.type === "magnet"
                      ? "#FF00FF"
                      : "#FFFF00"
              }
              transparent
              opacity={0.6}
            />
          </mesh>
        </group>
      ))}

      {/* Enhanced Player - Using the imported PlayerController */}
      <PlayerController
        position={playerPosition}
        onResourceCollect={(type, amount) => {
          // Handle resource collection for crystals
          if (type === "crystal") {
            // Find the nearest crystal and collect it
            const nearestCrystal = currentConfig.crystalPositions.find((pos) => {
              const distance = Math.sqrt(
                Math.pow(pos[0] - playerPosition[0], 2) + Math.pow(pos[2] - playerPosition[2], 2),
              )
              return distance < 2 // Within collection range
            })

            if (nearestCrystal) {
              const crystalId = `level-${currentLevel}-crystal-${currentConfig.crystalPositions.indexOf(nearestCrystal)}`
              if (!collectedItems.has(crystalId)) {
                actions.collectItem(crystalId, "crystal", nearestCrystal as [number, number, number])
              }
            }
          }
        }}
        onNPCInteract={(npcId) => {
          console.log("[v0] NPC interaction:", npcId)
        }}
        onObjectInteract={(objectId) => {
          console.log("[v0] Object interaction:", objectId)
        }}
      />

      {specialEffects.map((effect) => (
        <group key={effect.id} position={effect.position}>
          {effect.type === "sparkle" && (
            <mesh>
              <sphereGeometry args={[0.3]} />
              <meshBasicMaterial color="#FFD700" transparent opacity={effect.timeLeft / 1000} />
            </mesh>
          )}
          {effect.type === "explosion" && (
            <mesh>
              <sphereGeometry args={[1.5 - effect.timeLeft / 1500]} />
              <meshBasicMaterial color="#FF4500" transparent opacity={effect.timeLeft / 1500} />
            </mesh>
          )}
          {effect.type === "shockwave" && (
            <mesh>
              <ringGeometry args={[2 - effect.timeLeft / 2000, 3 - effect.timeLeft / 2000, 16]} />
              <meshBasicMaterial color="#00FFFF" transparent opacity={effect.timeLeft / 2000} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

function GameContent() {
  const { gameState } = useGame()
  const [isClient, setIsClient] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <LoadingScreen />
  }

  const levelConfigs = {
    1: { skyColor: "#87CEEB" },
    2: { skyColor: "#4B0082" },
    3: { skyColor: "#8B0000" },
  }

  const currentConfig =
    gameState.gamePhase === "challenge"
      ? { skyColor: "#2a0a0a" }
      : levelConfigs[gameState.currentLevel as keyof typeof levelConfigs] || levelConfigs[1]

  return (
    <div
      className="w-full h-screen relative overflow-hidden"
      style={{ background: `linear-gradient(to bottom, ${currentConfig.skyColor}, ${currentConfig.skyColor}dd)` }}
    >
      <Canvas ref={canvasRef} camera={{ position: [0, 8, 12], fov: 75 }} className="absolute inset-0" shadows>
        <Suspense fallback={null}>
          <ambientLight intensity={gameState.gamePhase === "challenge" ? 0.2 : 0.4} />
          <directionalLight
            position={[15, 15, 8]}
            intensity={gameState.gamePhase === "challenge" ? 0.8 : 1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />
          <pointLight position={[0, 10, 0]} intensity={0.3} color="#ffffff" />

          <Physics gravity={[0, -30, 0]}>
            <ModernGameWorld />
          </Physics>
        </Suspense>
      </Canvas>

      <ModernGameUI />

      <div className="absolute top-4 left-4 bg-black/50 text-white p-4 rounded-lg backdrop-blur-sm">
        <h3 className="font-bold mb-2">Controls:</h3>
        <div className="text-sm space-y-1">
          <div>
            <span className="font-semibold">WASD:</span> Move around
          </div>
          <div>
            <span className="font-semibold">Mouse:</span> Look around (click to lock)
          </div>
          <div>
            <span className="font-semibold">Space:</span> Jump
          </div>
          <div>
            <span className="font-semibold">Shift:</span> Sprint
          </div>
          <div>
            <span className="font-semibold">E:</span> Interact/Collect
          </div>
          {gameState.gamePhase === "challenge" && (
            <div>
              <span className="font-semibold">Click Enemy:</span> Attack
            </div>
          )}
          <div>
            <span className="font-semibold">ESC:</span> Pause game
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GamePage() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  )
}
