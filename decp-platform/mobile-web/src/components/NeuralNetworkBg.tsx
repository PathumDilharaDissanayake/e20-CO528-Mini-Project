import { useEffect, useRef } from 'react'

interface NeuralNetworkBgProps {
  nodeCount?: number
  distThresh?: number
  opacity?: number
}

export default function NeuralNetworkBg({ nodeCount = 48, distThresh = 140, opacity = 1 }: NeuralNetworkBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let running = true

    const setSize = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }
    setSize()
    const ro = new ResizeObserver(setSize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    interface NodeDef { x: number; y: number; vx: number; vy: number; r: number; phase: number; phaseSpeed: number }
    interface Pulse { a: number; b: number; t: number; speed: number }

    const nodes: NodeDef[] = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 1,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.012 + Math.random() * 0.018,
    }))

    const pulses: Pulse[] = []
    let tick = 0

    const draw = () => {
      if (!running) return
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      tick++

      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy
        n.phase += n.phaseSpeed
        if (n.x < 0 || n.x > W) { n.vx *= -1; n.x = Math.max(0, Math.min(W, n.x)) }
        if (n.y < 0 || n.y > H) { n.vy *= -1; n.y = Math.max(0, Math.min(H, n.y)) }
      })

      if (tick % 40 === 0 && pulses.length < 14 && Math.random() < 0.7) {
        const a = Math.floor(Math.random() * nodes.length)
        const candidates: number[] = []
        for (let i = 0; i < nodes.length; i++) {
          if (i !== a && Math.hypot(nodes[a].x - nodes[i].x, nodes[a].y - nodes[i].y) < distThresh) candidates.push(i)
        }
        if (candidates.length > 0) {
          pulses.push({ a, b: candidates[Math.floor(Math.random() * candidates.length)], t: 0, speed: 0.009 + Math.random() * 0.013 })
        }
      }

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < distThresh) {
            const alpha = (1 - dist / distThresh) * 0.2
            ctx.strokeStyle = `rgba(0,217,138,${alpha})`
            ctx.lineWidth = 0.6
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke()
          }
        }
      }

      // Pulses
      for (let pi = pulses.length - 1; pi >= 0; pi--) {
        const pulse = pulses[pi]
        pulse.t += pulse.speed
        if (pulse.t >= 1) { pulses.splice(pi, 1); continue }
        const na = nodes[pulse.a], nb = nodes[pulse.b]
        const px = na.x + (nb.x - na.x) * pulse.t, py = na.y + (nb.y - na.y) * pulse.t
        const op = Math.sin(pulse.t * Math.PI)
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 7)
        grd.addColorStop(0, `rgba(0,229,204,${0.9 * op})`)
        grd.addColorStop(0.5, `rgba(0,217,138,${0.4 * op})`)
        grd.addColorStop(1, 'rgba(0,217,138,0)')
        ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill()
      }

      // Nodes
      nodes.forEach(n => {
        const pulse = (Math.sin(n.phase) + 1) / 2
        const glowAlpha = 0.1 + pulse * 0.22
        const nodeAlpha = 0.4 + pulse * 0.5
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 7)
        grd.addColorStop(0, `rgba(0,217,138,${glowAlpha})`); grd.addColorStop(1, 'rgba(0,217,138,0)')
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 7, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill()
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(0,217,138,${nodeAlpha})`; ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      running = false
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [nodeCount, distThresh])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity }}
    />
  )
}
