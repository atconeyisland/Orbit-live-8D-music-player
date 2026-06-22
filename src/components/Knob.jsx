import { useRef, useCallback, useEffect } from 'react'

const MIN_ANGLE = Math.PI * 0.75
const MAX_ANGLE = Math.PI * 2.25

function valToAngle(val, min, max) {
  return MIN_ANGLE + ((val - min) / (max - min)) * (MAX_ANGLE - MIN_ANGLE)
}

export default function Knob({ label, value, min, max, step, format, onChange }) {
  const startY   = useRef(null)
  const startVal = useRef(null)
  const knobRef  = useRef(null)

  const draw = useCallback((canvas, val) => {
    if (!canvas) return
    const ctx  = canvas.getContext('2d')
    const size = canvas.offsetWidth
    canvas.width  = size * devicePixelRatio
    canvas.height = size * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio)

    const cx = size / 2
    const cy = size / 2
    const r  = size * 0.38
    const lw = size * 0.07

    ctx.clearRect(0, 0, size, size)
    ctx.lineCap = 'round'

    // Track
    ctx.beginPath()
    ctx.arc(cx, cy, r, MIN_ANGLE, MAX_ANGLE)
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = lw
    ctx.stroke()

    // Fill
    const angle = valToAngle(val, min, max)
    ctx.beginPath()
    ctx.arc(cx, cy, r, MIN_ANGLE, angle)
    ctx.strokeStyle = '#1db954'
    ctx.lineWidth = lw
    ctx.stroke()

    // Dot
    ctx.beginPath()
    ctx.arc(
      cx + r * Math.cos(angle),
      cy + r * Math.sin(angle),
      lw * 0.7, 0, Math.PI * 2
    )
    ctx.fillStyle = '#1db954'
    ctx.fill()
  }, [min, max])

  const canvasRef = useCallback((canvas) => {
    if (!canvas) return
    knobRef.current = canvas
    draw(canvas, value)
  }, [value, draw])

  // Redraw when value changes
  useEffect(() => {
    draw(knobRef.current, value)
  }, [value, draw])

  function onDragStart(clientY) {
    startY.current   = clientY
    startVal.current = value
  }

  function onDragMove(clientY) {
    if (startY.current === null) return
    const delta = (startY.current - clientY) / 120 * (max - min)
    const next  = Math.min(max, Math.max(min, startVal.current + delta))
    const snapped = Math.round(next / step) * step
    onChange(parseFloat(snapped.toFixed(10)))
    draw(knobRef.current, snapped)
  }

  function onDragEnd() {
    startY.current   = null
    startVal.current = null
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, userSelect:'none' }}>
      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
        {label}
      </div>
      <canvas
        ref={canvasRef}
        width={72} height={72}
        style={{ width:72, height:72, cursor:'ns-resize', touchAction:'none' }}
        onMouseDown={e => { e.preventDefault(); onDragStart(e.clientY) }}
        onMouseMove={e => { if (startY.current !== null) onDragMove(e.clientY) }}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
        onTouchStart={e => onDragStart(e.touches[0].clientY)}
        onTouchMove={e => { e.preventDefault(); onDragMove(e.touches[0].clientY) }}
        onTouchEnd={onDragEnd}
      />
      <div style={{ fontSize:13, fontWeight:500, color:'#fff', minWidth:48, textAlign:'center' }}>
        {format(value)}
      </div>
    </div>
  )
}