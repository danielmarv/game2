"use client"

import { useRef, useEffect, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useSphere } from "@react-three/cannon"
import { Vector3 } from "three"
import { Text } from "@react-three/drei"

interface PlayerProps {
  playerName?: string
  position?: [number, number, number]
  color?: string
  isLocalPlayer?: boolean
  onMovement?: (position: [number, number, number], velocity: [number, number, number]) => void
  onStaminaChange?: (stamina: number) => void
  onHealthChange?: (health: number) => void
}

export default function Player({
  playerName = "Player",
  position: initialPosition = [0, 5, 0],
  color = "#FF6B6B",
  isLocalPlayer = true,
  onMovement,
  onStaminaChange,
  onHealthChange,
}: PlayerProps) {
  const { camera } = useThree()
  const [ref, api] = useSphere(() => ({
    mass: isLocalPlayer ? 1 : 0,
    position: initialPosition,
    args: [0.5],
    type: isLocalPlayer ? "Dynamic" : "Kinematic",
  }))

  const velocity = useRef([0, 0, 0])
  const position = useRef(initialPosition)
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false, // Added shift for sprinting
    ctrl: false, // Added ctrl for crouching
  })

  const [isMoving, setIsMoving] = useState(false)
  const [jumpAnimation, setJumpAnimation] = useState(0)
  const [stamina, setStamina] = useState(100)
  const [health, setHealth] = useState(100)
  const [isRunning, setIsRunning] = useState(false)
  const [isCrouching, setIsCrouching] = useState(false)
  const [playerState, setPlayerState] = useState<"idle" | "walking" | "running" | "jumping" | "crouching" | "falling">(
    "idle",
  )

  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 8, z: 15 })
  const [mouseDown, setMouseDown] = useState(false)
  const lastMousePos = useRef({ x: 0, y: 0 })

  // Subscribe to physics updates
  useEffect(() => {
    if (!isLocalPlayer) return

    const unsubscribeVelocity = api.velocity.subscribe((v) => {
      velocity.current = v
      setIsMoving(Math.abs(v[0]) > 0.1 || Math.abs(v[2]) > 0.1)

      if (onMovement) {
        onMovement(position.current as [number, number, number], v as [number, number, number])
      }
    })
    const unsubscribePosition = api.position.subscribe((p) => {
      position.current = p

      if (onMovement) {
        onMovement(p as [number, number, number], velocity.current as [number, number, number])
      }
    })

    return () => {
      unsubscribeVelocity()
      unsubscribePosition()
    }
  }, [api, isLocalPlayer, onMovement])

  useEffect(() => {
    if (!isLocalPlayer) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
          keys.current.w = true
          break
        case "KeyA":
          keys.current.a = true
          break
        case "KeyS":
          keys.current.s = true
          break
        case "KeyD":
          keys.current.d = true
          break
        case "Space":
          keys.current.space = true
          e.preventDefault()
          break
        case "ShiftLeft":
        case "ShiftRight":
          keys.current.shift = true
          break
        case "ControlLeft":
        case "ControlRight":
          keys.current.ctrl = true
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
          keys.current.w = false
          break
        case "KeyA":
          keys.current.a = false
          break
        case "KeyS":
          keys.current.s = false
          break
        case "KeyD":
          keys.current.d = false
          break
        case "Space":
          keys.current.space = false
          break
        case "ShiftLeft":
        case "ShiftRight":
          keys.current.shift = false
          break
        case "ControlLeft":
        case "ControlRight":
          keys.current.ctrl = false
          break
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        // Right mouse button
        setMouseDown(true)
        lastMousePos.current = { x: e.clientX, y: e.clientY }
        e.preventDefault()
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        setMouseDown(false)
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (mouseDown) {
        const deltaX = e.clientX - lastMousePos.current.x
        const deltaY = e.clientY - lastMousePos.current.y

        setCameraOffset((prev) => ({
          x: prev.x + deltaX * 0.01,
          y: Math.max(2, Math.min(20, prev.y - deltaY * 0.01)),
          z: Math.max(5, Math.min(30, prev.z)),
        }))

        lastMousePos.current = { x: e.clientX, y: e.clientY }
      }
    }

    const handleContextMenu = (e: MouseEvent) => e.preventDefault()

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)
    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("contextmenu", handleContextMenu)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [isLocalPlayer, mouseDown])

  useFrame((state, delta) => {
    if (!isLocalPlayer) return

    const [x, y, z] = position.current

    // Update player states
    const isGrounded = Math.abs(velocity.current[1]) < 0.1
    const hasMovementInput = keys.current.w || keys.current.a || keys.current.s || keys.current.d

    setIsCrouching(keys.current.ctrl)
    setIsRunning(keys.current.shift && hasMovementInput && stamina > 0)
    setIsMoving(hasMovementInput && isGrounded)

    // Determine player state
    if (!isGrounded && velocity.current[1] > 0.1) {
      setPlayerState("jumping")
    } else if (!isGrounded && velocity.current[1] < -0.1) {
      setPlayerState("falling")
    } else if (keys.current.ctrl) {
      setPlayerState("crouching")
    } else if (isRunning) {
      setPlayerState("running")
    } else if (isMoving) {
      setPlayerState("walking")
    } else {
      setPlayerState("idle")
    }

    // Movement force with stamina system
    const force = new Vector3()
    let baseSpeed = 5

    if (keys.current.ctrl) {
      baseSpeed = 2 // Slower when crouching
    } else if (keys.current.shift && stamina > 0) {
      baseSpeed = 8 // Faster when running
    }

    if (keys.current.w) force.z -= baseSpeed
    if (keys.current.s) force.z += baseSpeed
    if (keys.current.a) force.x -= baseSpeed
    if (keys.current.d) force.x += baseSpeed

    // Apply movement
    if (force.length() > 0) {
      api.velocity.set(force.x, velocity.current[1], force.z)
    } else {
      api.velocity.set(0, velocity.current[1], 0)
    }

    // Stamina management
    if (isRunning && hasMovementInput) {
      setStamina((prev) => {
        const newStamina = Math.max(0, prev - delta * 20)
        onStaminaChange?.(newStamina)
        return newStamina
      })
    } else if (stamina < 100) {
      setStamina((prev) => {
        const newStamina = Math.min(100, prev + delta * 15)
        onStaminaChange?.(newStamina)
        return newStamina
      })
    }

    // Jump with stamina cost
    if (keys.current.space && isGrounded && stamina > 10) {
      api.velocity.set(velocity.current[0], 10, velocity.current[2])
      setJumpAnimation(1)
      setStamina((prev) => {
        const newStamina = Math.max(0, prev - 10)
        onStaminaChange?.(newStamina)
        return newStamina
      })
    }

    // Fall damage
    if (isGrounded && velocity.current[1] < -15) {
      const damage = Math.abs(velocity.current[1]) - 15
      setHealth((prev) => {
        const newHealth = Math.max(0, prev - damage * 2)
        onHealthChange?.(newHealth)
        return newHealth
      })
    }

    if (jumpAnimation > 0) {
      setJumpAnimation((prev) => Math.max(0, prev - 0.05))
    }

    // Enhanced camera follow with free look
    const targetCameraPos = new Vector3(x + cameraOffset.x, y + cameraOffset.y, z + cameraOffset.z)
    camera.position.lerp(targetCameraPos, 0.1)
    camera.lookAt(x, y + (isCrouching ? -0.2 : 0), z)
  })

  const getPlayerScale = () => {
    if (isCrouching) return [1, 0.6, 1]
    if (playerState === "jumping") return [1, 1.2, 1]
    return [1, 1, 1]
  }

  const getEmissiveIntensity = () => {
    if (playerState === "running") return 0.3
    if (isMoving) return 0.1
    return 0
  }

  return (
    <group>
      <mesh ref={ref} castShadow scale={getPlayerScale()}>
        <sphereGeometry args={[0.5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={getEmissiveIntensity()} />
      </mesh>

      <mesh
        position={[
          position.current[0],
          position.current[1] + (isCrouching ? 0.4 : 0.8) + jumpAnimation * 0.3,
          position.current[2],
        ]}
      >
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} transparent opacity={0.8} />
      </mesh>

      <Text
        position={[position.current[0], position.current[1] + (isCrouching ? 1.2 : 1.8), position.current[2]]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Geist-Bold.ttf"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {playerName} {playerState !== "idle" && `(${playerState})`}
      </Text>

      {isMoving && (
        <mesh position={[position.current[0], position.current[1] - 0.3, position.current[2]]}>
          <ringGeometry args={[0.3, isRunning ? 0.8 : 0.6, 8]} />
          <meshBasicMaterial color={isRunning ? "#FF4444" : "#00FF88"} transparent opacity={0.3} />
        </mesh>
      )}

      {stamina < 30 && (
        <mesh position={[position.current[0], position.current[1] + 2.2, position.current[2]]}>
          <planeGeometry args={[1, 0.1]} />
          <meshBasicMaterial color="#FF4444" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  )
}
