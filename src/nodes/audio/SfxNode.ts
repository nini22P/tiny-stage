import { Logger } from '../../utils/Logger'
import { HowlNode, type HowlNodeProps, type HowlInstance, type SoundInstance } from './HowlNode'

export type SfxNodeProps = Omit<HowlNodeProps, 'type' | 'tagName'> & {
  maxConcurrent?: number
}

export class SfxNode extends HowlNode {
  private _maxConcurrent: number
  private _pendingTimeouts: Set<number> = new Set()

  constructor(props: SfxNodeProps) {
    super({
      ...props,
      type: 'sfx',
      poolSize: props.poolSize ?? 20,
    })
    this._maxConcurrent = props.maxConcurrent ?? 20
  }

  public async play(options: {
    src: string
    volume?: number
    loop?: number
    delay?: number | (() => number)
  }): Promise<SoundInstance> {
    const { delay = 0, loop = 1, volume = 1, src } = options
    const waitTime = typeof delay === 'function' ? delay() : delay

    if (waitTime > 0) {
      return new Promise((resolve) => {
        const timeoutId = window.setTimeout(async () => {
          this._pendingTimeouts.delete(timeoutId)
          resolve(await this._playSfx(src, loop, volume))
        }, waitTime)
        this._pendingTimeouts.add(timeoutId)
      })
    }

    return this._playSfx(src, loop, volume)
  }

  private async _playSfx(src: string, loopCount: number, volume: number): Promise<SoundInstance> {
    const howlInstance = this._getHowlInstance({ src })

    this._checkMaxConcurrent()

    try {
      await this._waitLoaded(howlInstance.howl)
      const soundId = howlInstance.howl.play()
      const isInfinite = loopCount === -1 || loopCount === Infinity

      howlInstance.howl.volume(volume, soundId)
      howlInstance.howl.loop(isInfinite, soundId)

      const instance: SoundInstance = { id: soundId, src, startTime: Date.now() }
      howlInstance.sounds.set(soundId, instance)

      let remaining = isInfinite ? -1 : loopCount - 1

      const onEnd = (id: number) => {
        if (id !== soundId) return

        if (!isInfinite && remaining > 0) {
          remaining--
          howlInstance.howl.play(id)
        } else if (!isInfinite) {
          this._cleanup(howlInstance, soundId)
          howlInstance.howl.off('end', onEnd, id)
        }
      }

      howlInstance.howl.on('end', onEnd, soundId)

      howlInstance.howl.once('playerror', () => this._cleanup(howlInstance, soundId), soundId)

      return instance
    } catch (error) {
      this._howls.delete(src)
      Logger.error('Sfx Node Play Error:', error)
      return Promise.reject(error)
    }
  }

  private _cleanup(howlInstance: HowlInstance, soundId: number) {
    this._removeAudioInstance(howlInstance, soundId)
  }

  private _checkMaxConcurrent() {
    if (this._totalActiveCount >= this._maxConcurrent) {

      let oldest: { howlInstance: HowlInstance; sound: SoundInstance } | null = null

      for (const item of this._activeSoundsIterator()) {
        if (!oldest || item.sound.startTime < oldest.sound.startTime) {
          oldest = item
        }
      }

      if (oldest) {
        this.stop(oldest.sound.id, 0.05)
      }
    }
  }

  public async stop(target: number | string, fade: number = 0) {
    this._howls.forEach(howlInstance => {
      const soundsToStop = Array.from(howlInstance.sounds.values()).filter(s =>
        typeof target === 'number' ? s.id === target : howlInstance.src === target
      )

      soundsToStop.forEach(async sound => {
        await this._fadeHowl(howlInstance, {
          volume: 0,
          fade,
          soundId: sound.id,
          onComplete: () => {
            howlInstance.howl.stop(sound.id)
            this._removeAudioInstance(howlInstance, sound.id)
          }
        })
      })
    })
  }

  public override stopAll(fade: number = 0) {
    this._pendingTimeouts.forEach(id => clearTimeout(id))
    this._pendingTimeouts.clear()
    super.stopAll(fade)
  }

  public override destroy(): void {
    this._pendingTimeouts.forEach(id => clearTimeout(id))
    super.destroy()
  }
}