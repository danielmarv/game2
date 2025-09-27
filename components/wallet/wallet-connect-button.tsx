"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { WalletConnectModal } from "./wallet-connect-modal"
import { toast } from "@/hooks/use-toast"

export function WalletConnectButton() {
  const { connectedAccount, isConnecting, connect, disconnect, error } = useWallet()
  const [showModal, setShowModal] = useState(false)

  const handleConnect = async () => {
    try {
      await connect()
      toast({
        title: "Wallet Connected!",
        description: `Successfully connected account: ${connectedAccount}`,
      })
    } catch (err) {
      console.error("Connection error:", err)
      toast({
        title: "Connection Failed",
        description: error || "Failed to connect wallet. Please ensure your WalletConnect Project ID is correct.",
        variant: "destructive",
      })
    }
  }

  const handleDisconnect = () => {
    disconnect()
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    })
  }

  if (connectedAccount) {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant="secondary" className="hidden sm:flex">
          <Wallet className="h-3 w-3 mr-1" />
          {connectedAccount.slice(0, 8)}...
        </Badge>
        <Button variant="outline" size="sm" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button onClick={() => setShowModal(true)} size="sm" disabled={isConnecting}>
        <Wallet className="h-4 w-4 mr-2" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>

      <WalletConnectModal
        open={showModal}
        onOpenChange={setShowModal}
        onConnect={handleConnect}
        isConnecting={isConnecting}
      />
    </>
  )
}
