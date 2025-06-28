"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Heart, Zap, Apple, Smile, Frown, Skull, Play, Pause, RotateCcw, Star, Trophy, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Bird {
  x: number
  y: number
  velocity: number
  health: number
  hunger: number
  energy: number
  happiness: number
  isAlive: boolean
  lastFed: number
  lastPetted: number
  age: number
  wingPhase: number
}

interface Obstacle {
  id: string
  x: number
  topHeight: number
  bottomHeight: number
  passed: boolean
  type: "pipe" | "pollution" | "storm" | "predator"
}

interface Collectible {
  id: string
  x: number
  y: number
  type: "food" | "medicine" | "energy" | "toy"
  collected: boolean
  pulsePhase: number
}

interface Particle {
  id: string
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface GameState {
  bird: Bird
  obstacles: Obstacle[]
  collectibles: Collectible[]
  particles: Particle[]
  score: number
  gameStarted: boolean
  gamePaused: boolean
  gameSpeed: number
  timeAlive: number
  careActions: number
  lastCareAction: number
  highScore: number
}

const GAME_CONFIG = {
  gravity: 0.6,
  jumpStrength: -15, // Increased from -12 to -15 for stronger jumps
  gameSpeed: 3, // Increased from 2 to 3 for faster horizontal movement
  canvasWidth: 800,
  canvasHeight: 600,
  birdSize: 35,
  obstacleWidth: 80,
  obstacleGap: 200,
  healthDecay: 0.08,
  hungerDecay: 0.12,
  energyDecay: 0.04,
  happinessDecay: 0.06,
}

const COLLECTIBLE_TYPES = {
  food: { color: "#10B981", glowColor: "#34D399", icon: "🍎", effect: "hunger", value: 30, label: "Food" },
  medicine: { color: "#EF4444", glowColor: "#F87171", icon: "💊", effect: "health", value: 25, label: "Medicine" },
  energy: { color: "#F59E0B", glowColor: "#FBBF24", icon: "⚡", effect: "energy", value: 35, label: "Energy" },
  toy: { color: "#8B5CF6", glowColor: "#A78BFA", effect: "happiness", value: 40, label: "Toy" },
}

const OBSTACLE_TYPES = {
  pipe: { color: "#22C55E", glowColor: "#4ADE80", damage: 15, label: "Pipe", icon: "🟢" },
  pollution: { color: "#6B7280", glowColor: "#9CA3AF", damage: 25, label: "Pollution", icon: "☁️" },
  storm: { color: "#3B82F6", glowColor: "#60A5FA", damage: 20, label: "Storm", icon: "⛈️" },
  predator: { color: "#DC2626", glowColor: "#F87171", damage: 35, label: "Predator", icon: "🦅" },
}

// Add error handling for localStorage
const getHighScore = () => {
  try {
    return Number.parseInt(localStorage.getItem("flappyBirdHighScore") || "0")
  } catch {
    return 0
  }
}

const setHighScore = (score: number) => {
  try {
    localStorage.setItem("flappyBirdHighScore", score.toString())
  } catch {
    // Silently fail if localStorage is not available
  }
}

// Update the initializeGame function to use safe localStorage access
function initializeGame(): GameState {
  return {
    bird: {
      x: 150,
      y: 300,
      velocity: 0,
      health: 100,
      hunger: 100,
      energy: 100,
      happiness: 100,
      isAlive: true,
      lastFed: Date.now(),
      lastPetted: Date.now(),
      age: 0,
      wingPhase: 0,
    },
    obstacles: [],
    collectibles: [],
    particles: [],
    score: 0,
    gameStarted: false,
    gamePaused: false,
    gameSpeed: GAME_CONFIG.gameSpeed,
    timeAlive: 0,
    careActions: 0,
    lastCareAction: 0,
    highScore: typeof window !== "undefined" ? getHighScore() : 0,
  }
}

export default function EnhancedFlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [gameState, setGameState] = useState<GameState>(() => initializeGame())
  const [careItems, setCareItems] = useState({
    food: 3,
    medicine: 2,
    energy: 3,
    toys: 2,
  })

  const useCareItem = useCallback(
    (type: keyof typeof careItems) => {
      if (careItems[type] <= 0 || !gameState.bird.isAlive) return

      setCareItems((prev) => ({ ...prev, [type]: prev[type] - 1 }))

      setGameState((prev) => {
        const bird = { ...prev.bird }
        const newParticles = [...prev.particles]

        switch (type) {
          case "food":
            bird.hunger = Math.min(100, bird.hunger + 40)
            bird.lastFed = Date.now()
            newParticles.push(...createParticles(bird.x, bird.y, "#10B981", 12))
            break
          case "medicine":
            bird.health = Math.min(100, bird.health + 30)
            newParticles.push(...createParticles(bird.x, bird.y, "#EF4444", 10))
            break
          case "energy":
            bird.energy = Math.min(100, bird.energy + 50)
            newParticles.push(...createParticles(bird.x, bird.y, "#F59E0B", 15))
            break
          case "toys":
            bird.happiness = Math.min(100, bird.happiness + 25)
            newParticles.push(...createParticles(bird.x, bird.y, "#8B5CF6", 20))
            break
        }

        return {
          ...prev,
          bird,
          particles: newParticles,
          careActions: prev.careActions + 1,
          lastCareAction: Date.now(),
        }
      })
    },
    [gameState, careItems],
  )

  const jump = useCallback(() => {
    if (!gameState.gameStarted || !gameState.bird.isAlive || gameState.gamePaused) return

    setGameState((prev) => ({
      ...prev,
      bird: {
        ...prev.bird,
        velocity: GAME_CONFIG.jumpStrength,
        energy: Math.max(0, prev.bird.energy - GAME_CONFIG.energyDecay * 12), // Reduced from 15 to 12
      },
      particles: [...prev.particles, ...createParticles(prev.bird.x - 10, prev.bird.y + 15, "#60A5FA", 6)],
    }))
  }, [gameState.gameStarted, gameState.bird.isAlive, gameState.gamePaused])

  const startGame = () => {
    setGameState((prev) => ({ ...prev, gameStarted: true, gamePaused: false }))
  }

  const pauseGame = () => {
    setGameState((prev) => ({ ...prev, gamePaused: !prev.gamePaused }))
  }

  const restartGame = () => {
    setGameState(initializeGame())
    setCareItems({ food: 3, medicine: 2, energy: 3, toys: 2 })
  }

  const petBird = () => {
    if (!gameState.bird.isAlive) return

    setGameState((prev) => ({
      ...prev,
      bird: {
        ...prev.bird,
        happiness: Math.min(100, prev.bird.happiness + 15),
        lastPetted: Date.now(),
      },
      particles: [...prev.particles, ...createParticles(prev.bird.x, prev.bird.y, "#FF69B4", 15)],
      careActions: prev.careActions + 1,
      lastCareAction: Date.now(),
    }))
  }

  // Enhanced game loop
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gamePaused || !gameState.bird.isAlive) return

    const gameLoop = () => {
      setGameState((prev) => {
        const newState = { ...prev }
        const now = Date.now()
        const timeDelta = 0.016

        // Update bird physics and animation
        newState.bird = {
          ...prev.bird,
          y: prev.bird.y + prev.bird.velocity,
          velocity: prev.bird.velocity + GAME_CONFIG.gravity,
          age: prev.bird.age + timeDelta,
          wingPhase: prev.bird.wingPhase + 0.4, // Increased from 0.3 to 0.4 for faster wing flapping
        }

        // Decay vital stats
        newState.bird.health = Math.max(0, newState.bird.health - GAME_CONFIG.healthDecay * timeDelta)
        newState.bird.hunger = Math.max(0, newState.bird.hunger - GAME_CONFIG.hungerDecay * timeDelta)
        newState.bird.happiness = Math.max(0, newState.bird.happiness - GAME_CONFIG.happinessDecay * timeDelta)

        // Accelerated decay for neglect
        if (now - prev.bird.lastFed > 8000) {
          newState.bird.hunger = Math.max(0, newState.bird.hunger - 0.8)
        }
        if (now - prev.bird.lastPetted > 12000) {
          newState.bird.happiness = Math.max(0, newState.bird.happiness - 0.5)
        }

        // Death conditions
        if (
          newState.bird.health <= 0 ||
          newState.bird.hunger <= 0 ||
          newState.bird.energy <= 0 ||
          newState.bird.happiness <= 0 ||
          newState.bird.y < 0 ||
          newState.bird.y > GAME_CONFIG.canvasHeight - GAME_CONFIG.birdSize
        ) {
          newState.bird.isAlive = false
          if (newState.score > newState.highScore) {
            newState.highScore = newState.score
            setHighScore(newState.score)
          }
        }

        // Update particles
        newState.particles = prev.particles
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vx: particle.vx * 0.98,
            vy: particle.vy * 0.98,
            life: particle.life - 1 / particle.maxLife,
            size: particle.size * 0.99,
          }))
          .filter((particle) => particle.life > 0)

        // Move and update obstacles
        newState.obstacles = prev.obstacles
          .map((obstacle) => ({ ...obstacle, x: obstacle.x - newState.gameSpeed }))
          .filter((obstacle) => obstacle.x > -GAME_CONFIG.obstacleWidth)

        // Move and update collectibles
        newState.collectibles = prev.collectibles
          .map((collectible) => ({
            ...collectible,
            x: collectible.x - newState.gameSpeed,
            pulsePhase: collectible.pulsePhase + 0.15,
          }))
          .filter((collectible) => collectible.x > -30)

        // Generate obstacles
        if (
          newState.obstacles.length === 0 ||
          newState.obstacles[newState.obstacles.length - 1].x < GAME_CONFIG.canvasWidth - 350
        ) {
          const obstacleTypes = Object.keys(OBSTACLE_TYPES) as Array<keyof typeof OBSTACLE_TYPES>
          const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)]

          newState.obstacles.push({
            id: `obstacle-${Date.now()}`,
            x: GAME_CONFIG.canvasWidth,
            topHeight: Math.random() * 180 + 80,
            bottomHeight: Math.random() * 180 + 80,
            passed: false,
            type: randomType,
          })
        }

        // Generate collectibles
        if (Math.random() < 0.025) {
          const collectibleTypes = Object.keys(COLLECTIBLE_TYPES) as Array<keyof typeof COLLECTIBLE_TYPES>
          const randomType = collectibleTypes[Math.floor(Math.random() * collectibleTypes.length)]

          newState.collectibles.push({
            id: `collectible-${Date.now()}`,
            x: GAME_CONFIG.canvasWidth,
            y: Math.random() * (GAME_CONFIG.canvasHeight - 150) + 75,
            type: randomType,
            collected: false,
            pulsePhase: 0,
          })
        }

        // Collision detection
        newState.obstacles.forEach((obstacle) => {
          if (
            !obstacle.passed &&
            newState.bird.x + GAME_CONFIG.birdSize > obstacle.x &&
            newState.bird.x < obstacle.x + GAME_CONFIG.obstacleWidth
          ) {
            if (
              newState.bird.y < obstacle.topHeight ||
              newState.bird.y + GAME_CONFIG.birdSize > GAME_CONFIG.canvasHeight - obstacle.bottomHeight
            ) {
              const damage = OBSTACLE_TYPES[obstacle.type].damage
              newState.bird.health = Math.max(0, newState.bird.health - damage)
              newState.particles.push(...createParticles(newState.bird.x, newState.bird.y, "#FF0000", 20))
            }
          }

          if (!obstacle.passed && newState.bird.x > obstacle.x + GAME_CONFIG.obstacleWidth) {
            obstacle.passed = true
            newState.score += 1
            newState.particles.push(...createParticles(newState.bird.x, newState.bird.y, "#FFD700", 10))
          }
        })

        // Collectible collection
        newState.collectibles.forEach((collectible) => {
          if (
            !collectible.collected &&
            Math.abs(newState.bird.x - collectible.x) < 35 &&
            Math.abs(newState.bird.y - collectible.y) < 35
          ) {
            collectible.collected = true
            const effect = COLLECTIBLE_TYPES[collectible.type]

            switch (effect.effect) {
              case "health":
                newState.bird.health = Math.min(100, newState.bird.health + effect.value)
                break
              case "hunger":
                newState.bird.hunger = Math.min(100, newState.bird.hunger + effect.value)
                newState.bird.lastFed = Date.now()
                break
              case "energy":
                newState.bird.energy = Math.min(100, newState.bird.energy + effect.value)
                break
              case "happiness":
                newState.bird.happiness = Math.min(100, newState.bird.happiness + effect.value)
                newState.bird.lastPetted = Date.now()
                break
            }

            newState.particles.push(...createParticles(collectible.x, collectible.y, effect.glowColor, 15))
          }
        })

        newState.timeAlive = prev.timeAlive + timeDelta

        return newState
      })

      animationRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState.gameStarted, gameState.gamePaused, gameState.bird.isAlive])

  // Enhanced canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.canvasHeight)
    if (gameState.bird.isAlive) {
      gradient.addColorStop(0, "#87CEEB")
      gradient.addColorStop(0.7, "#98D8E8")
      gradient.addColorStop(1, "#B0E0E6")
    } else {
      gradient.addColorStop(0, "#2D3748")
      gradient.addColorStop(1, "#1A202C")
    }
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight)

    // Draw animated clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
    for (let i = 0; i < 6; i++) {
      const x = (i * 180 + ((Date.now() / 80) % 1080)) % (GAME_CONFIG.canvasWidth + 100)
      const y = 80 + Math.sin(Date.now() / 2000 + i) * 20

      ctx.beginPath()
      ctx.arc(x, y, 25, 0, Math.PI * 2)
      ctx.arc(x + 20, y, 30, 0, Math.PI * 2)
      ctx.arc(x + 40, y, 25, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw enhanced obstacles
    gameState.obstacles.forEach((obstacle) => {
      const obstacleType = OBSTACLE_TYPES[obstacle.type]

      // Gradient for obstacles
      const obstacleGradient = ctx.createLinearGradient(obstacle.x, 0, obstacle.x + GAME_CONFIG.obstacleWidth, 0)
      obstacleGradient.addColorStop(0, obstacleType.color)
      obstacleGradient.addColorStop(0.5, obstacleType.glowColor)
      obstacleGradient.addColorStop(1, obstacleType.color)

      ctx.fillStyle = obstacleGradient
      ctx.shadowColor = obstacleType.glowColor
      ctx.shadowBlur = 10

      // Top obstacle
      ctx.fillRect(obstacle.x, 0, GAME_CONFIG.obstacleWidth, obstacle.topHeight)

      // Bottom obstacle
      ctx.fillRect(
        obstacle.x,
        GAME_CONFIG.canvasHeight - obstacle.bottomHeight,
        GAME_CONFIG.obstacleWidth,
        obstacle.bottomHeight,
      )

      ctx.shadowBlur = 0

      // Obstacle icon
      ctx.font = "24px Arial"
      ctx.textAlign = "center"
      ctx.fillStyle = "white"
      ctx.fillText(obstacleType.icon, obstacle.x + GAME_CONFIG.obstacleWidth / 2, obstacle.topHeight + 35)
    })

    // Draw enhanced collectibles
    gameState.collectibles.forEach((collectible) => {
      if (collectible.collected) return

      const collectibleType = COLLECTIBLE_TYPES[collectible.type]
      const pulseSize = 18 + Math.sin(collectible.pulsePhase) * 4

      // Glow effect
      ctx.shadowColor = collectibleType.glowColor
      ctx.shadowBlur = 15

      // Outer glow
      const glowGradient = ctx.createRadialGradient(
        collectible.x,
        collectible.y,
        0,
        collectible.x,
        collectible.y,
        pulseSize + 10,
      )
      glowGradient.addColorStop(0, collectibleType.glowColor + "80")
      glowGradient.addColorStop(1, collectibleType.glowColor + "00")

      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(collectible.x, collectible.y, pulseSize + 10, 0, Math.PI * 2)
      ctx.fill()

      // Main collectible
      ctx.fillStyle = collectibleType.color
      ctx.beginPath()
      ctx.arc(collectible.x, collectible.y, pulseSize, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowBlur = 0

      // Icon
      ctx.font = "20px Arial"
      ctx.textAlign = "center"
      ctx.fillStyle = "white"
      ctx.fillText(collectibleType.icon, collectible.x, collectible.y + 7)
    })

    // Draw particles
    gameState.particles.forEach((particle) => {
      ctx.globalAlpha = particle.life
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1

    // Draw enhanced bird
    const bird = gameState.bird
    const wingOffset = Math.sin(bird.wingPhase) * 8

    // Bird shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
    ctx.beginPath()
    ctx.ellipse(
      bird.x + GAME_CONFIG.birdSize / 2,
      bird.y + GAME_CONFIG.birdSize + 5,
      GAME_CONFIG.birdSize / 2,
      8,
      0,
      0,
      Math.PI * 2,
    )
    ctx.fill()

    // Bird body gradient
    const birdGradient = ctx.createRadialGradient(
      bird.x + 10,
      bird.y + 10,
      0,
      bird.x + GAME_CONFIG.birdSize / 2,
      bird.y + GAME_CONFIG.birdSize / 2,
      GAME_CONFIG.birdSize,
    )

    if (bird.isAlive) {
      if (bird.happiness > 70) {
        birdGradient.addColorStop(0, "#FFD700")
        birdGradient.addColorStop(1, "#FFA500")
      } else if (bird.happiness > 30) {
        birdGradient.addColorStop(0, "#FFA500")
        birdGradient.addColorStop(1, "#FF8C00")
      } else {
        birdGradient.addColorStop(0, "#FF6B6B")
        birdGradient.addColorStop(1, "#FF4444")
      }
    } else {
      birdGradient.addColorStop(0, "#8B5A2B")
      birdGradient.addColorStop(1, "#654321")
    }

    // Bird glow when happy
    if (bird.happiness > 80 && bird.isAlive) {
      ctx.shadowColor = "#FFD700"
      ctx.shadowBlur = 20
    }

    // Bird body
    ctx.fillStyle = birdGradient
    ctx.beginPath()
    ctx.arc(
      bird.x + GAME_CONFIG.birdSize / 2,
      bird.y + GAME_CONFIG.birdSize / 2,
      GAME_CONFIG.birdSize / 2,
      0,
      Math.PI * 2,
    )
    ctx.fill()

    ctx.shadowBlur = 0

    // Wings
    ctx.fillStyle = bird.isAlive ? "#FF8C00" : "#654321"
    ctx.beginPath()
    ctx.ellipse(bird.x + 8, bird.y + 15 + wingOffset, 12, 6, -0.3, 0, Math.PI * 2)
    ctx.fill()

    // Beak
    ctx.fillStyle = "#FFA500"
    ctx.beginPath()
    ctx.moveTo(bird.x + 30, bird.y + 15)
    ctx.lineTo(bird.x + 40, bird.y + 18)
    ctx.lineTo(bird.x + 30, bird.y + 21)
    ctx.fill()

    // Eye
    ctx.fillStyle = "white"
    ctx.beginPath()
    ctx.arc(bird.x + 22, bird.y + 12, 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "black"
    ctx.beginPath()
    if (bird.isAlive) {
      ctx.arc(bird.x + 24, bird.y + 12, 3, 0, Math.PI * 2)
    } else {
      // X for dead eyes
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText("×", bird.x + 22, bird.y + 16)
    }
    ctx.fill()

    // Expression
    ctx.strokeStyle = "black"
    ctx.lineWidth = 2
    if (bird.isAlive) {
      if (bird.happiness > 50) {
        // Happy smile
        ctx.beginPath()
        ctx.arc(bird.x + 18, bird.y + 22, 6, 0, Math.PI)
        ctx.stroke()
      } else {
        // Sad frown
        ctx.beginPath()
        ctx.arc(bird.x + 18, bird.y + 28, 6, Math.PI, 0)
        ctx.stroke()
      }
    }

    // Score and time display
    ctx.fillStyle = "white"
    ctx.font = "bold 28px Arial"
    ctx.textAlign = "left"
    ctx.strokeStyle = "black"
    ctx.lineWidth = 3
    ctx.strokeText(`Score: ${gameState.score}`, 20, 45)
    ctx.fillText(`Score: ${gameState.score}`, 20, 45)

    ctx.font = "bold 20px Arial"
    ctx.strokeText(`Time: ${Math.floor(gameState.timeAlive)}s`, 20, 75)
    ctx.fillText(`Time: ${Math.floor(gameState.timeAlive)}s`, 20, 75)

    if (gameState.highScore > 0) {
      ctx.strokeText(`Best: ${gameState.highScore}`, 20, 105)
      ctx.fillText(`Best: ${gameState.highScore}`, 20, 105)
    }
  }, [gameState])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault()
        jump()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [jump])

  const getBirdStatus = () => {
    if (!gameState.bird.isAlive) return { emoji: "💀", text: "Dead", color: "text-red-400" }
    if (gameState.bird.happiness > 80) return { emoji: "😊", text: "Ecstatic", color: "text-green-400" }
    if (gameState.bird.happiness > 60) return { emoji: "🙂", text: "Happy", color: "text-blue-400" }
    if (gameState.bird.happiness > 40) return { emoji: "😐", text: "Okay", color: "text-yellow-400" }
    if (gameState.bird.happiness > 20) return { emoji: "😟", text: "Sad", color: "text-orange-400" }
    return { emoji: "😢", text: "Miserable", color: "text-red-400" }
  }

  const getCriticalNeeds = () => {
    const needs = []
    if (gameState.bird.health < 25) needs.push({ text: "Health Critical!", color: "bg-red-500", icon: "💔" })
    if (gameState.bird.hunger < 25) needs.push({ text: "Starving!", color: "bg-orange-500", icon: "🍽️" })
    if (gameState.bird.energy < 20) needs.push({ text: "Exhausted!", color: "bg-yellow-500", icon: "😴" })
    if (gameState.bird.happiness < 25) needs.push({ text: "Depressed!", color: "bg-purple-500", icon: "💔" })
    return needs
  }

  const getStatColor = (value: number) => {
    if (value > 70) return "bg-green-500"
    if (value > 40) return "bg-yellow-500"
    if (value > 20) return "bg-orange-500"
    return "bg-red-500"
  }

  const status = getBirdStatus()
  const criticalNeeds = getCriticalNeeds()

  const itemConfig = {
    food: { icon: "🍎", label: "Food", color: "from-green-500 to-green-600", effect: "+40 🍽️" },
    medicine: { icon: "💊", label: "Medicine", color: "from-red-500 to-red-600", effect: "+30 ❤️" },
    energy: { icon: "⚡", label: "Energy", color: "from-yellow-500 to-yellow-600", effect: "+50 ⚡" },
    toys: { icon: "🎾", label: "Toys", color: "from-purple-500 to-purple-600", effect: "+25 😊" },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Enhanced Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <motion.div
            animate={{
              scale: gameState.bird.isAlive ? [1, 1.1, 1] : 1,
              rotate: gameState.bird.isAlive ? [0, 5, -5, 0] : 0,
            }}
            transition={{
              scale: { duration: 2, repeat: Number.POSITIVE_INFINITY },
              rotate: { duration: 3, repeat: Number.POSITIVE_INFINITY },
            }}
            className="text-7xl mb-4 filter drop-shadow-lg"
          >
            🐦
          </motion.div>
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent">
            Keep It Alive: Flappy Bird
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Your bird needs constant love and care to survive! Feed, pet, and nurture it while navigating through
            obstacles.
          </p>
        </motion.div>

        {/* Enhanced Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <motion.div whileHover={{ scale: 1.05, rotateY: 5 }}>
            <Card className="bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-400/30 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Heart className="w-8 h-8 mx-auto mb-3 text-red-400" />
                <Progress value={gameState.bird.health} className={`mb-2 h-3 ${getStatColor(gameState.bird.health)}`} />
                <div className="text-lg font-bold">{Math.round(gameState.bird.health)}%</div>
                <div className="text-sm opacity-80">Health</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05, rotateY: 5 }}>
            <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-400/30 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Apple className="w-8 h-8 mx-auto mb-3 text-green-400" />
                <Progress value={gameState.bird.hunger} className={`mb-2 h-3 ${getStatColor(gameState.bird.hunger)}`} />
                <div className="text-lg font-bold">{Math.round(gameState.bird.hunger)}%</div>
                <div className="text-sm opacity-80">Hunger</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05, rotateY: 5 }}>
            <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-400/30 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Zap className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
                <Progress value={gameState.bird.energy} className={`mb-2 h-3 ${getStatColor(gameState.bird.energy)}`} />
                <div className="text-lg font-bold">{Math.round(gameState.bird.energy)}%</div>
                <div className="text-sm opacity-80">Energy</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05, rotateY: 5 }}>
            <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-400/30 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                {gameState.bird.happiness > 50 ? (
                  <Smile className="w-8 h-8 mx-auto mb-3 text-purple-400" />
                ) : (
                  <Frown className="w-8 h-8 mx-auto mb-3 text-purple-400" />
                )}
                <Progress
                  value={gameState.bird.happiness}
                  className={`mb-2 h-3 ${getStatColor(gameState.bird.happiness)}`}
                />
                <div className="text-lg font-bold">{Math.round(gameState.bird.happiness)}%</div>
                <div className="text-sm opacity-80">Happiness</div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Enhanced Game Canvas */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-black/40 to-black/20 border-blue-400/30 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{status.emoji}</span>
                      <span className={`text-xl font-bold ${status.color}`}>{status.text}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-yellow-400/50 bg-yellow-400/10 text-yellow-300">
                        <Star className="w-4 h-4 mr-1" />
                        {gameState.score}
                      </Badge>
                      <Badge variant="outline" className="border-blue-400/50 bg-blue-400/10 text-blue-300">
                        <Clock className="w-4 h-4 mr-1" />
                        {Math.floor(gameState.bird.age)}s
                      </Badge>
                      {gameState.highScore > 0 && (
                        <Badge variant="outline" className="border-purple-400/50 bg-purple-400/10 text-purple-300">
                          <Trophy className="w-4 h-4 mr-1" />
                          {gameState.highScore}
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 relative">
                  <canvas
                    ref={canvasRef}
                    width={GAME_CONFIG.canvasWidth}
                    height={GAME_CONFIG.canvasHeight}
                    className="w-full h-auto border-b border-blue-400/30 cursor-pointer transition-all duration-300 hover:brightness-110"
                    onClick={jump}
                  />

                  {/* Critical Alerts */}
                  <AnimatePresence>
                    {criticalNeeds.map((need, index) => (
                      <motion.div
                        key={need.text}
                        initial={{ opacity: 0, x: 50, scale: 0.8 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          scale: [0.8, 1.1, 1],
                        }}
                        exit={{ opacity: 0, x: 50, scale: 0.8 }}
                        transition={{
                          scale: { duration: 0.3 },
                          opacity: { duration: 0.2 },
                        }}
                        className={`absolute top-4 right-4 ${need.color} text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg`}
                        style={{ top: `${20 + index * 50}px` }}
                      >
                        <span className="mr-2">{need.icon}</span>
                        {need.text}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Game Controls */}
                  <div className="p-6 bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-3">
                        {!gameState.gameStarted ? (
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={startGame}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-6 py-3 rounded-lg shadow-lg"
                            >
                              <Play className="w-5 h-5 mr-2" />
                              Start Adventure
                            </Button>
                          </motion.div>
                        ) : (
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={pauseGame}
                              variant="outline"
                              className="border-blue-400/50 bg-blue-400/10 text-blue-300 hover:bg-blue-400/20"
                            >
                              <Pause className="w-5 h-5 mr-2" />
                              {gameState.gamePaused ? "Resume" : "Pause"}
                            </Button>
                          </motion.div>
                        )}
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={restartGame}
                            variant="outline"
                            className="border-red-400/50 bg-red-400/10 text-red-300 hover:bg-red-400/20"
                          >
                            <RotateCcw className="w-5 h-5 mr-2" />
                            New Life
                          </Button>
                        </motion.div>
                      </div>

                      <div className="text-sm opacity-80 text-center">
                        <div className="font-semibold mb-1">🎮 Controls</div>
                        <div>Click canvas or press SPACE to flap</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Enhanced Care Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Bird Care */}
            <Card className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-pink-400/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Heart className="w-6 h-6 text-pink-400" />
                  Bird Care
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={petBird}
                    disabled={!gameState.bird.isAlive}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3 rounded-lg shadow-lg"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Pet Bird (+15 💖)
                  </Button>
                </motion.div>

                <div className="text-sm opacity-80 bg-black/20 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span>Last petted:</span>
                    <Badge variant="outline" className="border-pink-400/50">
                      {Math.floor((Date.now() - gameState.bird.lastPetted) / 1000)}s ago
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Care Items */}
            <Card className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border-green-400/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Apple className="w-6 h-6 text-green-400" />
                  Care Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(careItems).map(([type, count]) => {
                    return (
                      <motion.div key={type} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={() => useCareItem(type as keyof typeof careItems)}
                          disabled={count <= 0 || !gameState.bird.isAlive}
                          className={`w-full bg-gradient-to-r ${itemConfig[type].color} hover:brightness-110 text-white font-bold py-3 rounded-lg shadow-lg text-xs relative overflow-hidden`}
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-lg mb-1">{itemConfig[type].icon}</span>
                            <span className="font-semibold">{itemConfig[type].label}</span>
                            <Badge variant="outline" className="mt-1 border-white/50 bg-white/20 text-white text-xs">
                              {count}
                            </Badge>
                          </div>
                          {count <= 0 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white font-bold">Empty</span>
                            </div>
                          )}
                        </Button>
                      </motion.div>
                    )
                  })}
                </div>

                <div className="text-xs opacity-80 bg-black/20 rounded-lg p-3 text-center">
                  💡 Collect items in-game or use your limited supplies wisely!
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Statistics */}
            <Card className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-400/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-blue-400" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
                    <span className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      Current Score
                    </span>
                    <Badge variant="outline" className="border-yellow-400/50 bg-yellow-400/10 text-yellow-300">
                      {gameState.score}
                    </Badge>
                  </div>

                  {gameState.highScore > 0 && (
                    <div className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
                      <span className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-purple-400" />
                        High Score
                      </span>
                      <Badge variant="outline" className="border-purple-400/50 bg-purple-400/10 text-purple-300">
                        {gameState.highScore}
                      </Badge>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      Time Alive
                    </span>
                    <Badge variant="outline" className="border-blue-400/50 bg-blue-400/10 text-blue-300">
                      {Math.floor(gameState.timeAlive)}s
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
                    <span className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-400" />
                      Care Actions
                    </span>
                    <Badge variant="outline" className="border-pink-400/50 bg-pink-400/10 text-pink-300">
                      {gameState.careActions}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Game Guide */}
            <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  How to Play
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3 opacity-90">
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="text-lg">🐦</span>
                    <strong>Flap:</strong> Click or press SPACE to fly
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-lg">❤️</span>
                    <strong>Care:</strong> Pet and use items to keep happy
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-lg">🍎</span>
                    <strong>Feed:</strong> Collect food to prevent starvation
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <strong>Energy:</strong> Rest and collect energy boosts
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-lg">💊</span>
                    <strong>Health:</strong> Avoid obstacles, use medicine
                  </p>
                  <p className="flex items-center gap-2 text-red-300 font-semibold">
                    <span className="text-lg">💀</span>
                    <strong>Death:</strong> Any stat at 0 = Game Over!
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Enhanced Game Over Screen */}
        <AnimatePresence>
          {!gameState.bird.isAlive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.8, y: 50, opacity: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="bg-gradient-to-br from-gray-900 to-black border border-red-400/50 rounded-2xl p-8 text-center max-w-md mx-4 shadow-2xl"
              >
                <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5, repeat: 2 }}>
                  <Skull className="w-20 h-20 mx-auto mb-6 text-red-400" />
                </motion.div>

                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  Your Bird Died!
                </h2>

                <div className="space-y-3 mb-8 text-sm bg-black/40 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span>Final Score:</span>
                    <Badge variant="outline" className="border-yellow-400/50 bg-yellow-400/10 text-yellow-300">
                      {gameState.score}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Survived:</span>
                    <Badge variant="outline" className="border-blue-400/50 bg-blue-400/10 text-blue-300">
                      {Math.floor(gameState.timeAlive)}s
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Care Given:</span>
                    <Badge variant="outline" className="border-pink-400/50 bg-pink-400/10 text-pink-300">
                      {gameState.careActions}
                    </Badge>
                  </div>
                  {gameState.score === gameState.highScore && gameState.score > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-yellow-400 font-bold flex items-center justify-center gap-2"
                    >
                      <Trophy className="w-5 h-5" />
                      NEW HIGH SCORE!
                    </motion.div>
                  )}
                </div>

                <div className="mb-6 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                  <p className="text-red-300 font-semibold text-sm">
                    💀 Cause of Death: {gameState.bird.health <= 0 && "Health depleted"}
                    {gameState.bird.hunger <= 0 && "Starvation"}
                    {gameState.bird.energy <= 0 && "Exhaustion"}
                    {gameState.bird.happiness <= 0 && "Depression"}
                  </p>
                </div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={restartGame}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold px-8 py-3 rounded-lg shadow-lg"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Give Life Another Chance
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12 py-6 border-t border-blue-400/30"
        >
          <div className="mb-4">
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              🏆 NodeForSpeed 1.0 Hackathon Submission
            </h3>
            <p className="text-lg opacity-80 mb-4">
              "Keep It Alive" Theme • Your bird needs constant love to survive! 💖
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Badge variant="outline" className="border-purple-400/50 bg-purple-400/10 text-purple-300">
                Enhanced UI/UX
              </Badge>
              <Badge variant="outline" className="border-blue-400/50 bg-blue-400/10 text-blue-300">
                Smooth Animations
              </Badge>
              <Badge variant="outline" className="border-green-400/50 bg-green-400/10 text-green-300">
                Interactive Care
              </Badge>
              <Badge variant="outline" className="border-yellow-400/50 bg-yellow-400/10 text-yellow-300">
                Emotional Gameplay
              </Badge>
            </div>
          </div>
          <p className="text-sm opacity-60">Built with Next.js • Framer Motion • Canvas 2D • Tailwind CSS • Love ❤️</p>
        </motion.div>
      </div>
    </div>
  )
}

const createParticles = (x: number, y: number, color: string, count = 8) => {
  const newParticles: Particle[] = []
  for (let i = 0; i < count; i++) {
    newParticles.push({
      id: `particle-${Date.now()}-${i}`,
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 1,
      maxLife: 30 + Math.random() * 20,
      color,
      size: 3 + Math.random() * 4,
    })
  }
  return newParticles
}
