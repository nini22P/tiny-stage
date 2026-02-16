import { Logger } from '../../utils/Logger'
import { HowlNode, type HowlNodeProps, type SoundInstance } from './HowlNode'

export type BgmNodeProps = Omit<HowlNodeProps, 'type' | 'tagName'>

export class BgmNode extends HowlNode {
  private currentSrc: string | null = null
  private targetVolume: number = 1

  constructor(props: BgmNodeProps) {
    super({ ...props, type: 'bgm' })
  }

  public preload(src: string): void {
    if (!src || src === this.currentSrc) return
    Logger.info(`Preloading BGM: ${src}`)
    this.getHowlInstance(src, true)
  }

  public async play(options: {
    src?: string;
    loop?: boolean;
    volume?: number;
    fade?: number;
  } = {}): Promise<SoundInstance> {
    const fadeTime = options.fade ?? 0
    const volume = options.volume ?? this.targetVolume
    if (options.volume !== undefined) this.targetVolume = volume

    if (!options.src || options.src === this.currentSrc) {
      const current = this.currentHowl
      if (!current)
        return Promise.reject('No BGM to play')

      const howl = current.howl
      howl.loop(options.loop ?? howl.loop())

      if (!howl.playing()) {
        const id = howl.play()
        howl.volume(0, id)
        current.sounds.clear()
        current.sounds.set(id, { id, src: current.src, startTime: Date.now() })
      }

      const soundId = Array.from(current.sounds.keys())[0]
      await this.fadeHowl(current, { volume, fade: fadeTime, soundId })
      return current.sounds.get(soundId)!
    }

    const oldSrc = this.currentSrc
    const newSrc = options.src

    this.currentSrc = newSrc
    const newHowlInstance = this.getHowlInstance(newSrc, true)

    try {
      await this.waitLoaded(newHowlInstance.howl)

      if (this.currentSrc !== newSrc)
        return Promise.reject('Play interrupted by new BGM')

      const soundId = newHowlInstance.howl.play()
      newHowlInstance.sounds.clear()
      newHowlInstance.sounds.set(soundId, { id: soundId, src: newSrc, startTime: Date.now() })

      newHowlInstance.howl.volume(0, soundId)
      newHowlInstance.howl.loop(options.loop ?? true, soundId)

      const fadeTasks: Promise<void>[] = []

      if (oldSrc && oldSrc !== newSrc) {
        const oldHowl = this.howls.get(oldSrc)
        if (oldHowl) {
          fadeTasks.push(this.fadeHowl(oldHowl, {
            volume: 0,
            fade: fadeTime,
            onComplete: () => {
              if (this.currentSrc !== oldSrc) {
                oldHowl.howl.stop()
                oldHowl.sounds.clear()
              }
            }
          }))
        }
      }

      fadeTasks.push(this.fadeHowl(newHowlInstance, {
        volume,
        fade: fadeTime,
        soundId
      }))

      await Promise.all(fadeTasks)
      return newHowlInstance.sounds.get(soundId)!

    } catch (e) {
      this.howls.delete(newSrc)
      Logger.error('BGM Switch Error:', e)
      return Promise.reject(e)
    }
  }

  public async pause(fade: number = 0): Promise<void> {
    const currentHowl = this.currentHowl
    if (currentHowl) {
      await this.fadeHowl(currentHowl, {
        volume: 0,
        fade,
        onComplete: () => currentHowl.howl.pause()
      })
    }
  }

  public async stop(fade: number = 0): Promise<void> {
    const currentHowl = this.currentHowl
    if (currentHowl) {
      await this.fadeHowl(currentHowl, {
        volume: 0,
        fade,
        onComplete: () => {
          currentHowl.howl.stop()
          currentHowl.sounds.clear()
          this.currentSrc = null
        }
      })
    }
  }

  public async resume(fade: number = 0): Promise<SoundInstance> {
    return await this.play({ fade })
  }

  public async fade(volume: number, fade: number = 0): Promise<void> {
    this.targetVolume = volume
    const currentHowl = this.currentHowl
    if (currentHowl) {
      await this.fadeHowl(currentHowl, {
        volume,
        fade
      })
    }
  }

  public async seek(time: number): Promise<void> {
    const currentHowl = this.currentHowl
    if (currentHowl && currentHowl.howl.playing()) {
      currentHowl.howl.seek(time)
    }
  }

  private get currentHowl() {
    return this.currentSrc ? this.howls.get(this.currentSrc) : null
  }

  public get volume() {
    return this.currentHowl?.howl.volume() ?? this.targetVolume
  }

  public set volume(value: number) {
    const oldVolume = this.targetVolume
    this.targetVolume = value

    const currentHowl = this.currentHowl
    if (currentHowl) {
      if (Math.abs(oldVolume - value) < 0.01) return

      this.fadeHowl(currentHowl, {
        volume: value,
        fade: 0.2,
      }).catch(err => {
        Logger.warn('BGM Volume Setter Fade Error:', err)
      })
    }
  }

  public get loop() {
    return this.currentHowl?.howl.loop() ?? false
  }

  public set loop(value: boolean) {
    this.currentHowl?.howl.loop(value)
  }

  public destroy(): void {
    super.destroy()
  }
}