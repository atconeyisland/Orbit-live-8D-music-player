import { useEffect, useRef } from 'react'
import { engine } from '../../engine/orbit-engine.js'

export function useVisualizer(canvasRef, mode) {
  const rafRef = useRef(null)
  const posRef = useRef({ x: 0, z: 1, angle: 0 })

  useEffect(() => {
    engine.onPosition = (x, z, angle) => {
      posRef.current = { x, z, angle }
    }
    return () => { engine.onPosition = null }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width  = canvas.offsetWidth  * devicePixelRatio
      canvas.height = canvas.offsetHeight * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    function draw() {
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      ctx.clearRect(0, 0, W, H)

      if (mode === 'bars') {
        const freq  = engine.getFrequencyData()
        const barW  = W / freq.length
        ctx.fillStyle = 'rgba(29,185,84,0.5)'
        for (let i = 0; i < freq.length; i++) {
          const h = (freq[i] / 255) * H
          ctx.fillRect(i * barW, H - h, Math.max(1, barW - 1), h)
        }
      }

      if (mode === 'dot') {
        const { x, z } = posRef.current
        const rms = engine.getRMS()
        const r   = 5 + rms * 24

        // Guide ring
        ctx.beginPath()
        ctx.arc(W / 2, H / 2, Math.min(W, H) * 0.38, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Dot
        const sx = (x * 0.45 + 0.5) * W
        const sy = (z * 0.45 + 0.5) * H
        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.fillStyle = '#1db954'
        ctx.shadowBlur = 12
        ctx.shadowColor = '#1db954'
        ctx.fill()
        ctx.shadowBlur = 0
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [mode, canvasRef])
}