"use client"

import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { useBox } from "@react-three/cannon"
import type { Mesh } from "three"
import { Text } from "@react-three/drei"

interface ResourceNodeProps {
  type: "tree" | "rock" | "crystal"
  position: [number, number, number]
  resource: string
  onCollect?: (resourceType: string, nodeId: string) => void
  isCollected?: boolean
}

export default function ResourceNode({ type, position, resource, onCollect, isCollected = false }: ResourceNodeProps) {
  const [collected, setCollected] = useState(isCollected)
  const [hovered, setHovered] = useState(false)
  const [collectAnimation, setCollectAnimation] = useState(0)
  const meshRef = useRef<Mesh>(null)
  const nodeId = `${type}-${position.join("-")}`

  // Physics body for collision
  const [ref] = useBox(() => ({
    position,
    args: [1, 2, 1],
    type: "Static",
  }))

  // Gentle floating animation and collection effects
  useFrame((state) => {
    if (meshRef.current && !collected) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1

      if (hovered) {
        meshRef.current.scale.setScalar(1.1 + Math.sin(state.clock.elapsedTime * 8) * 0.05)
      } else {
        meshRef.current.scale.setScalar(1)
      }
    }

    // Collection animation
    if (collectAnimation > 0) {
      setCollectAnimation((prev) => Math.max(0, prev - 0.05))
      if (meshRef.current) {
        meshRef.current.scale.setScalar(1 + collectAnimation * 2)
        meshRef.current.rotation.y += 0.2
      }
    }
  })

  const handleClick = () => {
    if (!collected) {
      setCollected(true)
      setCollectAnimation(1)

      // Trigger collection callback
      if (onCollect) {
        onCollect(resource, nodeId)
      }

      console.log(`[v0] Collected ${resource}!`)

      // Respawn after 15 seconds
      setTimeout(() => {
        setCollected(false)
        setCollectAnimation(0)
      }, 15000)
    }
  }

  if (collected && collectAnimation === 0) return null

  const getResourceModel = () => {
    const opacity = collected ? Math.max(0.1, 1 - collectAnimation * 2) : 1

    switch (type) {
      case "tree":
        return (
          <group>
            {/* Tree trunk */}
            <mesh position={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.4, 2]} />
              <meshStandardMaterial color="#8B4513" transparent opacity={opacity} />
            </mesh>
            {/* Tree leaves */}
            <mesh position={[0, 1.5, 0]} castShadow>
              <sphereGeometry args={[1.2]} />
              <meshStandardMaterial color="#228B22" transparent opacity={opacity} />
            </mesh>
            {/* Sparkle effect when collecting */}
            {collectAnimation > 0 && (
              <mesh position={[0, 1.5, 0]}>
                <sphereGeometry args={[1.5]} />
                <meshBasicMaterial color="#FFD700" transparent opacity={collectAnimation * 0.3} />
              </mesh>
            )}
          </group>
        )
      case "rock":
        return (
          <group>
            <mesh castShadow>
              <dodecahedronGeometry args={[1]} />
              <meshStandardMaterial color="#696969" transparent opacity={opacity} />
            </mesh>
            {collectAnimation > 0 && (
              <mesh>
                <sphereGeometry args={[1.3]} />
                <meshBasicMaterial color="#87CEEB" transparent opacity={collectAnimation * 0.3} />
              </mesh>
            )}
          </group>
        )
      case "crystal":
        return (
          <group>
            <mesh castShadow>
              <octahedronGeometry args={[1]} />
              <meshStandardMaterial
                color="#9370DB"
                transparent
                opacity={opacity * 0.8}
                emissive="#4B0082"
                emissiveIntensity={0.2 + (hovered ? 0.3 : 0)}
              />
            </mesh>
            {collectAnimation > 0 && (
              <mesh>
                <sphereGeometry args={[1.3]} />
                <meshBasicMaterial color="#FF69B4" transparent opacity={collectAnimation * 0.4} />
              </mesh>
            )}
          </group>
        )
      default:
        return null
    }
  }

  return (
    <group
      ref={ref}
      position={position}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh ref={meshRef}>{getResourceModel()}</mesh>

      {hovered && !collected && (
        <Text
          position={[0, 3, 0]}
          fontSize={0.5}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Geist-Regular.ttf"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          Click to collect {resource}
        </Text>
      )}

      {/* Collection particles */}
      {collectAnimation > 0 && (
        <>
          <mesh position={[Math.sin(collectAnimation * 10), 2 + collectAnimation * 3, 0]}>
            <sphereGeometry args={[0.1]} />
            <meshBasicMaterial color="#FFD700" />
          </mesh>
          <mesh position={[Math.cos(collectAnimation * 8), 2.5 + collectAnimation * 2, Math.sin(collectAnimation * 6)]}>
            <sphereGeometry args={[0.08]} />
            <meshBasicMaterial color="#00FF88" />
          </mesh>
          <mesh
            position={[-Math.sin(collectAnimation * 12), 2.2 + collectAnimation * 2.5, -Math.cos(collectAnimation * 9)]}
          >
            <sphereGeometry args={[0.12]} />
            <meshBasicMaterial color="#FF69B4" />
          </mesh>
        </>
      )}
    </group>
  )
}
