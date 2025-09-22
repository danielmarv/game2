"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface InteractableObjectProps {
  type: "tree" | "rock" | "crystal" | "npc" | "chest"
  position: [number, number, number]
  onInteract?: (type: string, data?: any) => void
  children?: React.ReactNode
}

export default function InteractableObject({ type, position, onInteract, children }: InteractableObjectProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isCollected, setIsCollected] = useState(false)
  const meshRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (glowRef.current && !isCollected) {
      // Pulsing glow effect
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 0.2
      glowRef.current.material.opacity = pulse
    }

    if (meshRef.current && isHovered && !isCollected) {
      // Gentle floating animation when hovered
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1
    }
  })

  const handleClick = () => {
    if (isCollected) return

    if (onInteract) {
      let data = {}
      switch (type) {
        case "tree":
          data = { resource: "wood", amount: Math.floor(Math.random() * 3) + 1 }
          break
        case "rock":
          data = { resource: "stone", amount: Math.floor(Math.random() * 2) + 1 }
          break
        case "crystal":
          data = { resource: "crystal", amount: 1 }
          break
        case "npc":
          data = { npcId: "trader", dialogue: "Hello, adventurer!" }
          break
        case "chest":
          data = {
            rewards: [
              { resource: "wood", amount: 5 },
              { resource: "stone", amount: 3 },
              { resource: "crystal", amount: 2 },
            ],
          }
          break
      }
      onInteract(type, data)
    }

    // Mark as collected for resources
    if (["tree", "rock", "crystal", "chest"].includes(type)) {
      setIsCollected(true)
      setTimeout(() => setIsCollected(false), 5000) // Respawn after 5 seconds
    }
  }

  const getGlowColor = () => {
    switch (type) {
      case "tree":
        return "#90EE90"
      case "rock":
        return "#D3D3D3"
      case "crystal":
        return "#9370db"
      case "npc":
        return "#FFD700"
      case "chest":
        return "#FFD700"
      default:
        return "#ffffff"
    }
  }

  return (
    <group
      ref={meshRef}
      position={position}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      {children}

      {/* Interaction glow */}
      {!isCollected && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[1.5]} />
          <meshBasicMaterial color={getGlowColor()} transparent opacity={0.1} side={THREE.BackSide} />
        </mesh>
      )}

      {/* Interaction prompt */}
      {isHovered && !isCollected && (
        <mesh position={[0, 2, 0]}>
          <planeGeometry args={[2, 0.5]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  )
}
