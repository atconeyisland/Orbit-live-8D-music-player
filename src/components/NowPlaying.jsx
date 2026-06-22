export default function NowPlaying() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      <div style={{
        width:40, height:40, borderRadius:6,
        background:'rgba(255,255,255,0.06)',
        border:'1px solid rgba(255,255,255,0.08)',
        display:'flex', alignItems:'center', justifyContent:'center',
        flexShrink:0,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
          <circle cx="8" cy="8" r="2" fill="rgba(255,255,255,0.2)"/>
        </svg>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.9)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          Connect Spotify
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>
          Phase 4 — coming soon
        </div>
      </div>
    </div>
  )
}