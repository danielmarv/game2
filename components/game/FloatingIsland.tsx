"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Mesh } from "three"
import { Text } from "@react-three/drei"

export default function FloatingIsland() {
  const islandRef = useRef<Mesh>(null)

  // Gentle floating animation
  useFrame((state) => {
    if (islandRef.current) {
      islandRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2
      islandRef.current.rotation.y = state.clock.elapsedTime * 0.05
    }
  })

  return (
    <group>
      {/* Main Island Base */}
      <mesh ref={islandRef} receiveShadow castShadow position={[0, -2, 0]}>
        <cylinderGeometry args={[15, 12, 4, 16]} />
        <meshStandardMaterial color="#4a7c59" />
      </mesh>

      {/* Island Top Surface */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[15, 15, 0.5, 16]} />
        <meshStandardMaterial color="#6b8e23" />
      </mesh>

      {/* Decorative Elements */}
      {/* Small hills */}
      <mesh castShadow position={[8, 0.5, 3]}>
        <sphereGeometry args={[2, 8, 6]} />
        <meshStandardMaterial color="#5a7c3a" />
      </mesh>

      <mesh castShadow position={[-6, 0.3, -4]}>
        <sphereGeometry args={[1.5, 8, 6]} />
        <meshStandardMaterial color="#5a7c3a" />
      </mesh>

      {/* Welcome Text */}
      <Text
        position={[0, 5, 0]}
        fontSize={2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Geist-Bold.ttf"
      >
        Mystical Island
      </Text>
    </group>
  )
}
