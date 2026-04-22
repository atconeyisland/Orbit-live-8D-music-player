// @ts-nocheck

/**
 * orbit-engine.js
 * The core 8D audio processing engine.
 * Framework-agnostic — no React imports. Consumed via useEngine.js hook.
 *
 * Audio graph:
 *   source → gainIn → [dry path] ──────────────────────┐
 *                   → panner → convolver → gainWet → gainOut → destination
 *
 * The rotation.worklet drives panner position updates on every render quantum.
 */

const WORKLET_PATH = '/engine/rotation.worklet.js'

const DEFAULTS = {
  speed:  0.4,
  width:  0.8,
  reverb: 0.35,
  shape:  'circle',
  bypass: false,
}

export class OrbitEngine {
  constructor() {
    this.ctx          = null
    this.source       = null   // MediaStreamAudioSourceNode or AudioBufferSourceNode
    this.gainIn       = null
    this.panner       = null
    this.convolver    = null
    this.gainWet      = null
    this.gainDry      = null
    this.gainOut      = null
    this.workletNode  = null
    this.analyser     = null

    this.params = { ...DEFAULTS }
    this.onPosition = null   // callback(x, z, angle) — for visualizer
    this._ir = null          // cached impulse response AudioBuffer
    this._started = false
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  async init() {
    if (this.ctx) return

    this.ctx = new AudioContext({ latencyHint: 'interactive', sampleRate: 44100 })

    // Worklet must be loaded before any AudioWorkletNode is created
    await this.ctx.audioWorklet.addModule(WORKLET_PATH)

    this._buildGraph()
    await this._loadImpulseResponse()
    this._startWorklet()

    this._started = true
  }

  async resume() {
    if (this.ctx?.state === 'suspended') await this.ctx.resume()
  }

  destroy() {
    this.workletNode?.disconnect()
    this.source?.disconnect()
    this.gainIn?.disconnect()
    this.panner?.disconnect()
    this.convolver?.disconnect()
    this.gainWet?.disconnect()
    this.gainDry?.disconnect()
    this.gainOut?.disconnect()
    this.analyser?.disconnect()
    this.ctx?.close()
    this.ctx = null
    this._started = false
  }

  // ─── Graph construction ───────────────────────────────────────────────────

  _buildGraph() {
    const ctx = this.ctx

    // Input gain — unity by default
    this.gainIn = ctx.createGain()
    this.gainIn.gain.value = 1

    // Panner — HRTF for binaural effect
    this.panner = ctx.createPanner()
    this.panner.panningModel  = 'HRTF'
    this.panner.distanceModel = 'inverse'
    this.panner.refDistance   = 1
    this.panner.maxDistance   = 10
    this.panner.positionX.value = 0
    this.panner.positionY.value = 0
    this.panner.positionZ.value = 1

    // Convolver — reverb (IR loaded separately)
    this.convolver = ctx.createConvolver()

    // Wet gain — reverb mix
    this.gainWet = ctx.createGain()
    this.gainWet.gain.value = this.params.reverb

    // Dry gain — bypasses convolver
    this.gainDry = ctx.createGain()
    this.gainDry.gain.value = 1 - this.params.reverb

    // Analyser — for visualizer
    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.8

    // Output gain — master
    this.gainOut = ctx.createGain()
    this.gainOut.gain.value = 1

    // Wire: gainIn → panner → convolver → gainWet → gainOut
    this.gainIn.connect(this.panner)
    this.panner.connect(this.convolver)
    this.convolver.connect(this.gainWet)
    this.gainWet.connect(this.gainOut)

    // Wire: gainIn → gainDry → gainOut (dry path, skips convolver)
    this.gainIn.connect(this.gainDry)
    this.gainDry.connect(this.gainOut)

    // Wire: gainOut → analyser → destination
    this.gainOut.connect(this.analyser)
    this.analyser.connect(ctx.destination)
  }

  // ─── Impulse response ────────────────────────────────────────────────────

  /**
   * Generates a synthetic impulse response if no IR file is available.
   * A real IR file (hall.wav, room.wav etc.) will sound much better —
   * drop one in /public/ir/room.wav and it will be used automatically.
   */
  async _loadImpulseResponse() {
    try {
      const res = await fetch('/ir/room.wav')
      if (res.ok) {
        const buf = await res.arrayBuffer()
        this._ir = await this.ctx.decodeAudioData(buf)
        this.convolver.buffer = this._ir
        return
      }
    } catch {
      // No IR file found — fall through to synthetic
    }

    this.convolver.buffer = this._syntheticIR()
  }

  _syntheticIR() {
    const ctx    = this.ctx
    const length = ctx.sampleRate * 1.5   // 1.5 second tail
    const ir     = ctx.createBuffer(2, length, ctx.sampleRate)

    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch)
      for (let i = 0; i < length; i++) {
        // Exponentially decaying white noise — convincing enough for v1
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5)
      }
    }
    return ir
  }

  // ─── AudioWorklet ─────────────────────────────────────────────────────────

  _startWorklet() {
    this.workletNode = new AudioWorkletNode(this.ctx, 'rotation-processor', {
      processorOptions: {
        speed:  this.params.speed,
        width:  this.params.width,
        shape:  this.params.shape,
        bypass: this.params.bypass,
      },
      numberOfInputs:  0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    })

    // Receive position updates from the worklet
    this.workletNode.port.onmessage = (e) => {
      if (e.data.type !== 'position') return
      const { x, z, angle } = e.data

      if (!this.params.bypass && this.panner) {
        this.panner.positionX.setTargetAtTime(x, this.ctx.currentTime, 0.01)
        this.panner.positionZ.setTargetAtTime(z, this.ctx.currentTime, 0.01)
        this.panner.positionY.value = 0
      }

      if (this.onPosition) this.onPosition(x, z, angle)
    }
  }

  _sendToWorklet(payload) {
    this.workletNode?.port.postMessage({ type: 'setParams', payload })
  }

  // ─── Audio source ─────────────────────────────────────────────────────────

  /**
   * Connect a MediaStream (from tab capture or system audio).
   * Call this once a stream is available; call disconnectSource() to swap.
   */
  connectStream(stream) {
    this._disconnectSource()
    this.source = this.ctx.createMediaStreamSource(stream)
    this.source.connect(this.gainIn)
  }

  /**
   * Connect an AudioBuffer (for file upload / testing).
   */
  connectBuffer(audioBuffer, loop = true) {
    this._disconnectSource()
    const node = this.ctx.createBufferSource()
    node.buffer = audioBuffer
    node.loop   = loop
    node.connect(this.gainIn)
    node.start()
    this.source = node
  }

  _disconnectSource() {
    try { this.source?.disconnect() } catch {
      // Ignore errors from disconnect attempt
    }
    this.source = null
  }

  // ─── Parameter setters ────────────────────────────────────────────────────

  setSpeed(hz) {
    this.params.speed = Math.max(0.05, Math.min(2.0, hz))
    this._sendToWorklet({ speed: this.params.speed })
  }

  setWidth(pct) {
    // pct is 0–1
    this.params.width = Math.max(0.1, Math.min(1.0, pct))
    this._sendToWorklet({ width: this.params.width })
  }

  setReverb(pct) {
    // pct is 0–1 — crossfades dry/wet
    this.params.reverb = Math.max(0, Math.min(1.0, pct))
    const now = this.ctx.currentTime
    this.gainWet.gain.setTargetAtTime(this.params.reverb,       now, 0.05)
    this.gainDry.gain.setTargetAtTime(1 - this.params.reverb,   now, 0.05)
  }

  setShape(shape) {
    const valid = ['circle', 'figure8', 'sidesweep', 'randomdrift']
    if (!valid.includes(shape)) return
    this.params.shape = shape
    this._sendToWorklet({ shape })
  }

  setBypass(bool) {
    this.params.bypass = bool
    this._sendToWorklet({ bypass: bool })

    if (bool) {
      // Snap panner to centre so dry signal is centred
      this.panner.positionX.setTargetAtTime(0, this.ctx.currentTime, 0.02)
      this.panner.positionZ.setTargetAtTime(1, this.ctx.currentTime, 0.02)
    }
  }

  // ─── Analyser helpers (for visualizer) ───────────────────────────────────

  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(0)
    const data = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(data)
    return data
  }

  getTimeDomainData() {
    if (!this.analyser) return new Float32Array(0)
    const data = new Float32Array(this.analyser.fftSize)
    this.analyser.getFloatTimeDomainData(data)
    return data
  }

  getRMS() {
    const data = this.getTimeDomainData()
    if (!data.length) return 0
    const sum = data.reduce((acc, v) => acc + v * v, 0)
    return Math.sqrt(sum / data.length)
  }
}

// Singleton — one engine per app instance
export const engine = new OrbitEngine()