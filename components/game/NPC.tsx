"use client"
import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { useSphere } from "@react-three/cannon"
import { Text } from "@react-three/drei"
import type * as THREE from "three"

interface NPCProps {
  position: [number, number, number]
  name: string
  color: string
  dialogue: string[]
  quest?: {
    id: string
    title: string
    description: string
    requirements: { [key: string]: number }
    rewards: { [key: string]: number }
  }
  onInteract?: (npcId: string, quest?: any) => void
}

export default function NPC({ position, name, color, dialogue, quest, onInteract }: NPCProps) {
  const [isInteracting, setIsInteracting] = useState(false)
  const [currentDialogue, setCurrentDialogue] = useState(0)
  const meshRef = useRef<THREE.Mesh>(null)
  const [ref] = useSphere(() => ({
    mass: 0,
    position,
    args: [0.8],
    type: "Static",
  }))

  // Simple idle animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2
    }
  })

  const handleClick = () => {
    setIsInteracting(true)
    if (onInteract) {
      onInteract(name, quest)
    }
  }

  return (
    <group>
      {/* NPC Body */}
      <mesh ref={meshRef} position={position} onClick={handleClick} castShadow receiveShadow>
        <capsuleGeometry args={[0.4, 1.2]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* NPC Head */}
      <mesh position={[position[0], position[1] + 1, position[2]]} castShadow>
        <sphereGeometry args={[0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Name Tag */}
      <Text
        position={[position[0], position[1] + 2, position[2]]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>

      {/* Quest Indicator */}
      {quest && (
        <mesh position={[position[0], position[1] + 2.5, position[2]]}>
          <sphereGeometry args={[0.1]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
      )}

      {/* Interaction Prompt */}
      {isInteracting && (
        <Text
          position={[position[0], position[1] + 1.5, position[2]]}
          fontSize={0.2}
          color="#00FF00"
          anchorX="center"
          anchorY="middle"
        >
          Press E to talk
        </Text>
      )}
    </group>
  )
}
