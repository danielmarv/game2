"use client"

export default function LoadingScreen() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-sky-600 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-white text-2xl font-bold mb-2">Loading Mystical Island...</h2>
        <p className="text-white/80">Preparing your adventure</p>
      </div>
    </div>
  )
}
