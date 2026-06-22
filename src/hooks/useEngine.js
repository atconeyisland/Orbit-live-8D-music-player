import { useEffect, useRef } from 'react'
import { engine } from '../../engine/orbit-engine.js'
import useEngineStore from '../store/useEngineStore.js'

export function useEngine() {
  const initialized = useRef(false)

  const { speed, width, reverb, shape, bypass } = useEngineStore()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    engine.init()
  }, [])

  useEffect(() => { if (engine.ctx) engine.setSpeed(speed)   }, [speed])
  useEffect(() => { if (engine.ctx) engine.setWidth(width)   }, [width])
  useEffect(() => { if (engine.ctx) engine.setReverb(reverb) }, [reverb])
  useEffect(() => { if (engine.ctx) engine.setShape(shape)   }, [shape])
  useEffect(() => { if (engine.ctx) engine.setBypass(bypass) }, [bypass])

  async function connectFile(file) {
    await engine.resume()
    const arrayBuf = await file.arrayBuffer()
    const audioBuf = await engine.ctx.decodeAudioData(arrayBuf)
    engine.connectBuffer(audioBuf, true)
  }

  return { engine, connectFile }
}