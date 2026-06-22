import { useRef } from 'react'
import { useVisualizer } from '../hooks/useVisualizer.js'

export default function Visualizer({ mode, onToggle }) {
  const canvasRef = useRef(null)
  useVisualizer(canvasRef, mode)

  return (
    <div style={{ position:'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width:'100%', height:110, borderRadius:8, background:'rgba(255,255,255,0.02)', display:'block' }}
      />
      <button
        onClick={onToggle}
        style={{
          position:'absolute', top:8, right:8,
          background:'rgba(255,255,255,0.06)',
          border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:6, color:'rgba(255,255,255,0.5)',
          fontSize:11, padding:'3px 8px', cursor:'pointer',
        }}
      >
        {mode === 'dot' ? 'bars' : 'dot'}
      </button>
    </div>
  )
}