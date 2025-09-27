"use client"

import { useWalletContext } from "@/components/providers/wallet-provider"

export function useWallet() {
  return useWalletContext()
}
