"use client"

import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Vector3 } from "three"
import { Text } from "@react-three/drei"

interface MultiplayerPlayerProps {
  id: string
  name: string
  position: [number, number, number]
  color: string
  velocity?: [number, number, number]
}

export default function MultiplayerPlayer({ id, name, position, color, velocity = [0, 0, 0] }: MultiplayerPlayerProps) {
  const meshRef = useRef<any>()
  const targetPosition = useRef(new Vector3(...position))
  const currentPosition = useRef(new Vector3(...position))

  // Update target position when props change
  useEffect(() => {
    targetPosition.current.set(...position)
  }, [position])

  // Smooth interpolation to target position
  useFrame(() => {
    if (meshRef.current) {
      // Lerp to target position for smooth movement
      currentPosition.current.lerp(targetPosition.current, 0.1)
      meshRef.current.position.copy(currentPosition.current)
    }
  })

  const isMoving = Math.abs(velocity[0]) > 0.1 || Math.abs(velocity[2]) > 0.1

  return (
    <group>
      {/* Player Avatar */}
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.5]} />
        <meshStandardMaterial
          color={color}
          emissive={isMoving ? color : "#000000"}
          emissiveIntensity={isMoving ? 0.1 : 0}
        />
      </mesh>

      {/* Player Orb */}
      <mesh position={[currentPosition.current.x, currentPosition.current.y + 0.8, currentPosition.current.z]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} transparent opacity={0.8} />
      </mesh>

      {/* Player Name Tag */}
      <Text
        position={[currentPosition.current.x, currentPosition.current.y + 1.8, currentPosition.current.z]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Geist-Bold.ttf"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {name}
      </Text>

      {/* Movement Indicator */}
      {isMoving && (
        <mesh position={[currentPosition.current.x, currentPosition.current.y - 0.3, currentPosition.current.z]}>
          <ringGeometry args={[0.3, 0.6, 8]} />
          <meshBasicMaterial color="#00FF88" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  )
}
