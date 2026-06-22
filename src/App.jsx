import { useRef } from 'react'
import { useEngine } from './hooks/useEngine.js'
import useEngineStore from './store/useEngineStore.js'
import Knob from './components/Knob.jsx'
import ShapePicker from './components/ShapePicker.jsx'
import Visualizer from './components/Visualizer.jsx'
import NowPlaying from './components/NowPlaying.jsx'

const SEP = () => (
  <div style={{ width:'100%', height:1, background:'rgba(255,255,255,0.06)', margin:'4px 0' }} />
)

export default function App() {
  const { connectFile } = useEngine()
  const fileRef = useRef(null)

  const {
    speed,  setSpeed,
    width,  setWidth,
    reverb, setReverb,
    shape,  setShape,
    bypass, setBypass,
    vizMode, setVizMode,
  } = useEngineStore()

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    await connectFile(file)
  }

  return (
    <div style={{
      width: 400,
      background: '#111',
      borderRadius: 16,
      padding: '20px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      fontFamily: 'system-ui, sans-serif',
      color: '#fff',
      margin: '40px auto',
      boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
    }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:15, fontWeight:600, letterSpacing:'0.02em' }}>Orbit</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', letterSpacing:'0.04em' }}>LIVE 8D</div>
      </div>

      <SEP />

      {/* Now playing */}
      <NowPlaying />

      <SEP />

      {/* Visualizer */}
      <Visualizer
        mode={vizMode}
        onToggle={() => setVizMode(vizMode === 'dot' ? 'bars' : 'dot')}
      />

      <SEP />

      {/* Knobs */}
      <div style={{ display:'flex', justifyContent:'space-around', alignItems:'flex-end' }}>
        <Knob
          label="Speed"
          value={speed}
          min={0.05} max={2.0} step={0.05}
          format={v => v.toFixed(1) + ' Hz'}
          onChange={setSpeed}
        />
        <Knob
          label="Width"
          value={width}
          min={0.1} max={1.0} step={0.05}
          format={v => Math.round(v * 100) + '%'}
          onChange={setWidth}
        />
        <Knob
          label="Reverb"
          value={reverb}
          min={0} max={1.0} step={0.05}
          format={v => Math.round(v * 100) + '%'}
          onChange={setReverb}
        />
      </div>

      {/* Shape picker */}
      <ShapePicker value={shape} onChange={setShape} />

      <SEP />

      {/* Bottom row — bypass + file load */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>

        {/* Bypass toggle */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>8D active</div>
          <div
            onClick={() => setBypass(!bypass)}
            style={{
              width:36, height:20, borderRadius:10, cursor:'pointer',
              background: bypass ? 'rgba(255,255,255,0.15)' : '#1db954',
              position:'relative', transition:'background 0.2s',
            }}
          >
            <div style={{
              position:'absolute', top:3,
              left: bypass ? 3 : 19,
              width:14, height:14, borderRadius:'50%',
              background:'#fff', transition:'left 0.2s',
            }} />
          </div>
        </div>

        {/* File loader */}
        <button
          onClick={() => fileRef.current.click()}
          style={{
            background:'rgba(255,255,255,0.06)',
            border:'1px solid rgba(255,255,255,0.12)',
            borderRadius:8, color:'rgba(255,255,255,0.7)',
            fontSize:12, padding:'6px 12px', cursor:'pointer',
          }}
        >
          Load file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          style={{ display:'none' }}
          onChange={handleFile}
        />

      </div>
    </div>
  )
}