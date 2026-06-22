import { create } from 'zustand'

const useEngineStore = create((set) => ({
  speed:  0.4,
  width:  0.8,
  reverb: 0.35,
  shape:  'circle',
  bypass: false,
  vizMode: 'dot', // 'dot' | 'bars'

  setSpeed:   (v) => set({ speed: v }),
  setWidth:   (v) => set({ width: v }),
  setReverb:  (v) => set({ reverb: v }),
  setShape:   (v) => set({ shape: v }),
  setBypass:  (v) => set({ bypass: v }),
  setVizMode: (v) => set({ vizMode: v }),
}))

export default useEngineStore