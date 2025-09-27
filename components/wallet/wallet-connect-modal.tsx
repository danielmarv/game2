"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, Smartphone, Monitor, Wallet } from "lucide-react"

interface WalletConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnect: () => Promise<void>
  isConnecting: boolean
}

export function WalletConnectModal({ open, onOpenChange, onConnect, isConnecting }: WalletConnectModalProps) {
  const [activeTab, setActiveTab] = useState("desktop")

  const handleConnect = async () => {
    await onConnect()
    // The modal should close automatically once connection is successful via the onConnect callback
    // onOpenChange(false); // This might be handled by the DAppConnector itself
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wallet className="h-5 w-5 mr-2" />
            Connect Hedera Wallet
          </DialogTitle>
          <DialogDescription>Choose your preferred connection method to access your Hedera account.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="desktop">
              <Monitor className="h-4 w-4 mr-2" />
              Desktop
            </TabsTrigger>
            <TabsTrigger value="mobile">
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="desktop" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">HashPack Wallet</CardTitle>
                <CardDescription>Connect using the HashPack browser extension</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
                  {isConnecting ? "Connecting..." : "Connect HashPack"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mobile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  QR Code Connection
                </CardTitle>
                <CardDescription>Scan with your mobile Hedera wallet app</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">QR code will appear here when connecting</p>
                <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
                  {isConnecting ? "Generating QR Code..." : "Generate QR Code"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
