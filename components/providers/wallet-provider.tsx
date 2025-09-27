"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { HederaSessionEvent, HederaJsonRpcMethod, DAppConnector, HederaChainId } from "@hashgraph/hedera-wallet-connect"
import { LedgerId } from "@hashgraph/sdk"
import { toast } from "@/hooks/use-toast"

interface WalletContextType {
  connectedAccount: string | null
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
  dAppConnector: DAppConnector | null
}

const WalletContext = createContext<WalletContextType | null>(null)

export function useWalletContext() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWalletContext must be used within WalletProvider")
  }
  return context
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [dAppConnector, setDAppConnector] = useState<DAppConnector | null>(null)

  useEffect(() => {
    const initializeConnector = async () => {
      try {
        const metadata = {
          name: "Hedera Gaming Platform",
          description: "A Web3 gaming platform built on Hedera",
          url: window.location.origin,
          icons: [`${window.location.origin}/logo.png`],
        }

        const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

        if (!projectId) {
          console.error("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will not function.")
          toast({
            title: "WalletConnect Error",
            description:
              "WalletConnect Project ID is missing. Please set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in your environment variables.",
            variant: "destructive",
            duration: 5000,
          })
          return
        }

        const connector = new DAppConnector(
          metadata,
          LedgerId.TESTNET, // Using TESTNET as per the provided example
          projectId,
          Object.values(HederaJsonRpcMethod),
          [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
          [HederaChainId.Testnet], // Using Testnet as per the provided example
        )

        await connector.init({ logger: "error" })
        setDAppConnector(connector)

        // Check for existing session
        const existingSession = connector.signers?.[0]
        if (existingSession) {
          setConnectedAccount(existingSession.getAccountId()?.toString() || null)
        }

        // Listen for session events
        connector.onSessionIframeCreated = (session) => {
          console.log("Session iframe created:", session)
        }
        connector.onSessionDelete = () => {
          console.log("Session deleted")
          setConnectedAccount(null)
          toast({
            title: "Wallet Disconnected",
            description: "Your wallet session has ended.",
          })
        }
        connector.onSessionUpdate = ({ topic, peer, session }) => {
          console.log("Session updated:", { topic, peer, session })
          // Update connected account if it changes
          const updatedAccount = session.namespaces?.hedera?.accounts?.[0]?.split(":")[2]
          if (updatedAccount) {
            setConnectedAccount(updatedAccount)
          }
        }
      } catch (error) {
        console.error("Failed to initialize DApp connector:", error)
        toast({
          title: "WalletConnect Initialization Failed",
          description: `Error: ${(error as Error).message}. Please check your WalletConnect Project ID and network connection.`,
          variant: "destructive",
          duration: 7000,
        })
      }
    }

    initializeConnector()
  }, []) // Empty dependency array to run only once on mount

  const connect = async () => {
    if (!dAppConnector) {
      toast({
        title: "WalletConnect Not Ready",
        description: "Wallet connector is still initializing or failed to initialize. Please try again.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsConnecting(true)
      await dAppConnector.openModal()

      // The modal will handle the connection. We need to wait for the session to be established.
      // The onSessionIframeCreated or onSessionUpdate listeners will update the connectedAccount.
      // For a more robust solution, you might want to poll or use a promise that resolves on session establishment.
      // For now, we'll rely on the state update from the event listeners.
      // A small delay to allow state to update after modal closes
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const signer = dAppConnector.signers?.[0]
      if (signer) {
        const accountId = signer.getAccountId()?.toString()
        setConnectedAccount(accountId || null)
      } else {
        throw new Error("No signer found after connection attempt.")
      }
    } catch (error) {
      console.error("Wallet connection failed:", error)
      toast({
        title: "Connection Failed",
        description: `Error: ${(error as Error).message}. Please try again.`,
        variant: "destructive",
      })
      throw error // Re-throw to be caught by WalletConnectButton
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    if (dAppConnector) {
      dAppConnector.disconnectAll()
    }
    setConnectedAccount(null)
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    })
  }

  const value: WalletContextType = {
    connectedAccount,
    isConnecting,
    connect,
    disconnect,
    dAppConnector,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}
