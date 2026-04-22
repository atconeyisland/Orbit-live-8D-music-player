// @ts-nocheck
/* globals AudioWorkletProcessor, registerProcessor, sampleRate */
/**
 * rotation.worklet.js
 * Runs on the AudioWorklet thread — completely off the main thread.
 * Drives the 8D panning by updating the PannerNode position on every
 * render quantum (128 samples). Communicates back to the main thread
 * via MessagePort so the visualizer can mirror the current angle.
 */

class RotationProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    const p = options.processorOptions || {}

    this.angle = 0
    this.speed  = p.speed  ?? 0.4   // Hz — full rotations per second
    this.width  = p.width  ?? 0.8   // 0–1 scale factor on the pan radius
    this.shape  = p.shape  ?? 'circle'
    this.bypass = p.bypass ?? false

    // Listen for parameter updates from the main thread
    this.port.onmessage = (e) => {
      const { type, payload } = e.data
      if (type === 'setParams') {
        if (payload.speed  !== undefined) this.speed  = payload.speed
        if (payload.width  !== undefined) this.width  = payload.width
        if (payload.shape  !== undefined) this.shape  = payload.shape
        if (payload.bypass !== undefined) this.bypass = payload.bypass
      }
    }
  }

  /**
   * Returns [x, z] position on the unit sphere for a given angle and shape.
   * y stays 0 — we only pan horizontally for the classic 8D feel.
   */
  getPosition(angle) {
    const w = this.width
    switch (this.shape) {
      case 'figure8':
        return [Math.sin(angle) * w, Math.sin(angle * 2) * w * 0.5]
      case 'sidesweep':
        return [Math.sin(angle) * w, 0]
      case 'randomdrift':
        // Smooth random: two slow sine waves at irrational frequency ratio
        return [
          Math.sin(angle * 1.0) * w * 0.7 + Math.sin(angle * 1.618) * w * 0.3,
          Math.cos(angle * 0.7) * w * 0.4,
        ]
      case 'circle':
      default:
        return [Math.sin(angle) * w, Math.cos(angle) * w]
    }
  }

  process() {
    if (this.bypass) return true

    // Advance angle by (speed * 2π) per second, scaled to one render quantum
    const deltaAngle = (this.speed * 2 * Math.PI) / sampleRate * 128
    this.angle += deltaAngle
    if (this.angle > 2 * Math.PI) this.angle -= 2 * Math.PI

    const [x, z] = this.getPosition(this.angle)

    // Post position back to main thread for PannerNode + visualizer updates
    this.port.postMessage({ type: 'position', x, z, angle: this.angle })

    return true
  }
}

registerProcessor('rotation-processor', RotationProcessor)