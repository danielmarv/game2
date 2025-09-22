"use client"
import { usePlane } from "@react-three/cannon"
import { useState } from "react"
import FloatingIsland from "./FloatingIsland"
import ResourceNode from "./ResourceNode"
import Player from "./Player"
import MultiplayerPlayer from "./MultiplayerPlayer"
import NPC from "./NPC"
import InteractiveObject from "./InteractiveObject"
import { useMultiplayer } from "@/hooks/useMultiplayer"
import { useInventory } from "@/hooks/useInventory"

interface GameWorldProps {
  playerName?: string
  onInventoryUpdate?: (inventory: any) => void
  onHealthChange?: (health: number) => void
  onStaminaChange?: (stamina: number) => void
}

export default function GameWorld({
  playerName = "Player",
  onInventoryUpdate,
  onHealthChange,
  onStaminaChange,
}: GameWorldProps) {
  const [collectedResources, setCollectedResources] = useState<Set<string>>(new Set())
  const [playerHealth, setPlayerHealth] = useState(100)
  const [playerStamina, setPlayerStamina] = useState(100)
  const [activatedObjects, setActivatedObjects] = useState<Set<string>>(new Set())
  const { inventory, addItem } = useInventory()

  // Ground plane physics
  const [groundRef] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -1, 0],
    type: "Static",
  }))

  const { otherPlayers, isConnected, sendMovement, sendResourceCollection } = useMultiplayer({
    playerName,
    onResourceCollected: (data) => {
      console.log("[v0] Resource collected by another player:", data)
      setCollectedResources((prev) => new Set([...prev, data.resourceId]))

      setTimeout(() => {
        setCollectedResources((prev) => {
          const newSet = new Set(prev)
          newSet.delete(data.resourceId)
          return newSet
        })
      }, 15000)
    },
  })

  const handlePlayerMovement = (position: [number, number, number], velocity: [number, number, number]) => {
    sendMovement(position, velocity)
  }

  const handleHealthChange = (health: number) => {
    setPlayerHealth(health)
    if (onHealthChange) {
      onHealthChange(health)
    }
  }

  const handleStaminaChange = (stamina: number) => {
    setPlayerStamina(stamina)
    if (onStaminaChange) {
      onStaminaChange(stamina)
    }
  }

  const handleResourceCollection = (resourceType: string, nodeId: string) => {
    // Add to local inventory
    addItem(resourceType, 1)

    // Send to multiplayer server
    sendResourceCollection(nodeId, resourceType)

    // Mark as collected locally
    setCollectedResources((prev) => new Set([...prev, nodeId]))

    // Update parent component
    if (onInventoryUpdate) {
      onInventoryUpdate({ ...inventory, [resourceType]: inventory[resourceType as keyof typeof inventory] + 1 })
    }

    // Remove from collected after respawn time
    setTimeout(() => {
      setCollectedResources((prev) => {
        const newSet = new Set(prev)
        newSet.delete(nodeId)
        return newSet
      })
    }, 15000)
  }

  const handleNPCInteraction = (npcId: string, quest?: any) => {
    console.log(`[v0] Interacting with NPC: ${npcId}`, quest)
    // Handle quest acceptance, dialogue, etc.
  }

  const handleObjectInteraction = (objectId: string) => {
    console.log(`[v0] Interacting with object: ${objectId}`)
    setActivatedObjects((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(objectId)) {
        newSet.delete(objectId)
      } else {
        newSet.add(objectId)
      }
      return newSet
    })
  }

  const resourceNodes = [
    { type: "tree" as const, position: [5, 0, 5] as [number, number, number], resource: "wood" },
    { type: "rock" as const, position: [-3, 0, 8] as [number, number, number], resource: "stone" },
    { type: "crystal" as const, position: [10, 0, -5] as [number, number, number], resource: "crystal" },
    { type: "tree" as const, position: [-8, 0, -3] as [number, number, number], resource: "wood" },
    { type: "rock" as const, position: [2, 0, -10] as [number, number, number], resource: "stone" },
    { type: "crystal" as const, position: [-12, 0, 8] as [number, number, number], resource: "crystal" },
    { type: "tree" as const, position: [15, 0, 2] as [number, number, number], resource: "wood" },
  ]

  const npcs = [
    {
      position: [7, 0, 0] as [number, number, number],
      name: "Elder Oak",
      color: "#8B4513",
      dialogue: ["Welcome, traveler!", "The forest needs your help.", "Collect resources to aid our cause."],
      quest: {
        id: "gather-wood",
        title: "Gather Wood",
        description: "Collect 5 wood from trees",
        requirements: { wood: 5 },
        rewards: { crystal: 2 },
      },
    },
    {
      position: [-5, 0, -7] as [number, number, number],
      name: "Stone Guardian",
      color: "#696969",
      dialogue: ["Greetings, adventurer!", "The mountains call for aid.", "Bring me stones and I'll reward you."],
      quest: {
        id: "collect-stones",
        title: "Stone Collector",
        description: "Gather 3 stone from rocks",
        requirements: { stone: 3 },
        rewards: { wood: 5 },
      },
    },
  ]

  const interactiveObjects = [
    {
      position: [0, 0, 12] as [number, number, number],
      type: "chest" as const,
      contents: { crystal: 3, wood: 2 },
    },
    {
      position: [-10, 0, 5] as [number, number, number],
      type: "portal" as const,
    },
    {
      position: [12, 0, -8] as [number, number, number],
      type: "switch" as const,
    },
  ]

  return (
    <>
      <FloatingIsland />

      <mesh ref={groundRef} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>

      {/* Resource Nodes */}
      {resourceNodes.map((node, index) => {
        const nodeId = `${node.type}-${node.position.join("-")}`
        return (
          <ResourceNode
            key={nodeId}
            type={node.type}
            position={node.position}
            resource={node.resource}
            onCollect={handleResourceCollection}
            isCollected={collectedResources.has(nodeId)}
          />
        )
      })}

      {npcs.map((npc, index) => (
        <NPC
          key={`npc-${index}`}
          position={npc.position}
          name={npc.name}
          color={npc.color}
          dialogue={npc.dialogue}
          quest={npc.quest}
          onInteract={handleNPCInteraction}
        />
      ))}

      {interactiveObjects.map((obj, index) => (
        <InteractiveObject
          key={`object-${index}`}
          position={obj.position}
          type={obj.type}
          isActivated={activatedObjects.has(`${obj.type}-${obj.position.join("-")}`)}
          onInteract={handleObjectInteraction}
          contents={obj.contents}
        />
      ))}

      <Player
        playerName={playerName}
        isLocalPlayer={true}
        color="#FF6B6B"
        onMovement={handlePlayerMovement}
        onHealthChange={handleHealthChange}
        onStaminaChange={handleStaminaChange}
      />

      {otherPlayers.map((player) => (
        <MultiplayerPlayer
          key={player.id}
          id={player.id}
          name={player.name}
          position={player.position}
          color={player.color}
          velocity={player.velocity}
        />
      ))}

      {!isConnected && (
        <mesh position={[0, 10, 0]}>
          <sphereGeometry args={[0.5]} />
          <meshBasicMaterial color="#FF0000" />
        </mesh>
      )}
    </>
  )
}
