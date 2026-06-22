const SHAPES = [
  { id: 'circle',      label: 'Circle' },
  { id: 'figure8',     label: 'Figure-8' },
  { id: 'sidesweep',   label: 'Side sweep' },
  { id: 'randomdrift', label: 'Random drift' },
]

export default function ShapePicker({ value, onChange }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
        Pan shape
      </div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {SHAPES.map(s => (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              border: '1px solid',
              borderColor: value === s.id ? '#1db954' : 'rgba(255,255,255,0.12)',
              background:   value === s.id ? '#1db954' : 'transparent',
              color:        value === s.id ? '#000'    : 'rgba(255,255,255,0.6)',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontWeight: value === s.id ? 600 : 400,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}