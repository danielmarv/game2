"use client"

import { useRef, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useSphere } from "@react-three/cannon"
import * as THREE from "three"

interface PlayerControllerProps {
  position?: [number, number, number]
  onResourceCollect?: (type: string, amount: number) => void
  onNPCInteract?: (npcId: string) => void
  onObjectInteract?: (objectId: string) => void
}

export default function PlayerController({
  position = [0, 2, 5],
  onResourceCollect,
  onNPCInteract,
  onObjectInteract,
}: PlayerControllerProps) {
  const { camera, gl } = useThree()
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position,
    args: [0.3],
  }))

  const velocity = useRef([0, 0, 0])
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
    space: false,
  })

  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const isPointerLocked = useRef(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log("[v0] Key pressed:", e.key, e.code) // Added debug logging
      const key = e.key.toLowerCase()

      if (key === "w" || e.code === "KeyW") keys.current.w = true
      if (key === "a" || e.code === "KeyA") keys.current.a = true
      if (key === "s" || e.code === "KeyS") keys.current.s = true
      if (key === "d" || e.code === "KeyD") keys.current.d = true
      if (key === "shift" || e.code === "ShiftLeft" || e.code === "ShiftRight") keys.current.shift = true
      if (key === " " || e.code === "Space") keys.current.space = true // Fixed space key detection

      // Interaction keys
      if (key === "e") {
        handleInteraction()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      console.log("[v0] Key released:", e.key, e.code) // Added debug logging
      const key = e.key.toLowerCase()

      if (key === "w" || e.code === "KeyW") keys.current.w = false
      if (key === "a" || e.code === "KeyA") keys.current.a = false
      if (key === "s" || e.code === "KeyS") keys.current.s = false
      if (key === "d" || e.code === "KeyD") keys.current.d = false
      if (key === "shift" || e.code === "ShiftLeft" || e.code === "ShiftRight") keys.current.shift = false
      if (key === " " || e.code === "Space") keys.current.space = false // Fixed space key detection
    }

    const handleClick = () => {
      if (!isPointerLocked.current) {
        gl.domElement.requestPointerLock()
      } else {
        handleInteraction()
      }
    }

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === gl.domElement
      console.log("[v0] Pointer lock changed:", isPointerLocked.current) // Added debug logging
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked.current) return

      const sensitivity = 0.002
      camera.rotation.y -= e.movementX * sensitivity
      camera.rotation.x -= e.movementY * sensitivity
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x))
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)
    document.addEventListener("pointerlockchange", handlePointerLockChange)
    gl.domElement.addEventListener("click", handleClick)
    gl.domElement.addEventListener("mousemove", handleMouseMove)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
      document.removeEventListener("pointerlockchange", handlePointerLockChange)
      gl.domElement.removeEventListener("click", handleClick)
      gl.domElement.removeEventListener("mousemove", handleMouseMove)
    }
  }, [camera, gl])

  const handleInteraction = () => {
    // Cast ray from camera center
    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera)

    // Check for intersections with interactable objects
    const scene = gl.getContext().canvas.parentElement?.querySelector("canvas")
    if (!scene) return

    // This would need to be implemented with proper object detection
    // For now, simulate resource collection
    if (onResourceCollect) {
      const resourceTypes = ["wood", "stone", "crystal"]
      const randomType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)]
      const amount = Math.floor(Math.random() * 3) + 1
      onResourceCollect(randomType, amount)
    }
  }

  useFrame(() => {
    // Get current velocity
    api.velocity.subscribe((v) => (velocity.current = v))

    // Calculate movement direction
    const direction = new THREE.Vector3()
    const speed = keys.current.shift ? 8 : 5

    if (keys.current.w || keys.current.a || keys.current.s || keys.current.d) {
      console.log("[v0] Movement keys active:", keys.current)
    }

    if (keys.current.w) direction.z -= 1
    if (keys.current.s) direction.z += 1
    if (keys.current.a) direction.x -= 1
    if (keys.current.d) direction.x += 1

    // Apply camera rotation to movement direction
    direction.applyEuler(new THREE.Euler(0, camera.rotation.y, 0))
    direction.normalize()
    direction.multiplyScalar(speed)

    // Apply movement
    if (direction.length() > 0) {
      api.velocity.set(direction.x, velocity.current[1], direction.z)
    }

    // Jump
    if (keys.current.space && Math.abs(velocity.current[1]) < 0.1) {
      console.log("[v0] Jump triggered") // Added debug logging
      api.velocity.set(velocity.current[0], 10, velocity.current[2])
    }

    // Update camera position to follow player
    if (ref.current) {
      const playerPosition = ref.current.position
      camera.position.set(playerPosition.x, playerPosition.y + 1.5, playerPosition.z)
    }
  })

  return (
    <group ref={ref}>
      {/* Player body */}
      <mesh position={[0, 0, 0]} castShadow>
        <capsuleGeometry args={[0.3, 1]} />
        <meshLambertMaterial color="#ff6b6b" />
      </mesh>
      {/* Player head */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.25]} />
        <meshLambertMaterial color="#ffdbac" />
      </mesh>
    </group>
  )
}
