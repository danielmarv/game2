"use client"
import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { useBox } from "@react-three/cannon"
import { Text } from "@react-three/drei"
import type * as THREE from "three"

interface InteractiveObjectProps {
  position: [number, number, number]
  type: "chest" | "door" | "switch" | "portal"
  isActivated?: boolean
  onInteract?: (objectId: string) => void
  contents?: { [key: string]: number }
}

export default function InteractiveObject({
  position,
  type,
  isActivated = false,
  onInteract,
  contents,
}: InteractiveObjectProps) {
  const [isNearby, setIsNearby] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const meshRef = useRef<THREE.Mesh>(null)

  const [ref] = useBox(() => ({
    mass: 0,
    position,
    args: type === "chest" ? [1, 0.6, 0.8] : [1, 2, 0.2],
    type: "Static",
  }))

  useFrame(() => {
    if (meshRef.current && type === "portal") {
      meshRef.current.rotation.y += 0.02
    }
  })

  const handleClick = () => {
    if (type === "chest") {
      setIsOpen(!isOpen)
    }
    if (onInteract) {
      onInteract(`${type}-${position.join("-")}`)
    }
  }

  const getObjectGeometry = () => {
    switch (type) {
      case "chest":
        return <boxGeometry args={[1, 0.6, 0.8]} />
      case "door":
        return <boxGeometry args={[1, 2, 0.2]} />
      case "switch":
        return <cylinderGeometry args={[0.2, 0.2, 0.5]} />
      case "portal":
        return <torusGeometry args={[1, 0.3, 8, 16]} />
      default:
        return <boxGeometry args={[1, 1, 1]} />
    }
  }

  const getObjectColor = () => {
    switch (type) {
      case "chest":
        return isOpen ? "#8B4513" : "#654321"
      case "door":
        return isActivated ? "#00FF00" : "#8B4513"
      case "switch":
        return isActivated ? "#FF0000" : "#808080"
      case "portal":
        return "#9932CC"
      default:
        return "#808080"
    }
  }

  return (
    <group>
      <mesh ref={meshRef} position={position} onClick={handleClick} castShadow receiveShadow>
        {getObjectGeometry()}
        <meshStandardMaterial
          color={getObjectColor()}
          emissive={type === "portal" ? "#4B0082" : "#000000"}
          emissiveIntensity={type === "portal" ? 0.3 : 0}
        />
      </mesh>

      {/* Interaction Prompt */}
      {isNearby && (
        <Text
          position={[position[0], position[1] + 1.5, position[2]]}
          fontSize={0.2}
          color="#FFFF00"
          anchorX="center"
          anchorY="middle"
        >
          Press F to interact
        </Text>
      )}

      {/* Chest Contents Display */}
      {type === "chest" && isOpen && contents && (
        <Text
          position={[position[0], position[1] + 2, position[2]]}
          fontSize={0.15}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
        >
          {Object.entries(contents)
            .map(([item, count]) => `${item}: ${count}`)
            .join("\n")}
        </Text>
      )}
    </group>
  )
}
