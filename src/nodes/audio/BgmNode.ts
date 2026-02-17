import gsap from 'gsap'
import { Logger } from '../../utils/Logger'
import { BaseNode, type BaseNodeProps } from '../BaseNode'

export type BgmNodeProps = Omit<BaseNodeProps, 'type' | 'tagName'>

export class BgmNode extends BaseNode {
  private audios: [HTMLAudioElement, HTMLAudioElement]
  private currentIndex: number = 0
  private targetVolume: number = 1

  constructor(props: BgmNodeProps) {
    super({ ...props, type: 'bgm' })

    this.audios = [new Audio(), new Audio()]
    this.audios.forEach(audio => {
      audio.loop = true
      audio.preload = 'auto'
      audio.crossOrigin = 'anonymous'
    })
  }

  public async play(options: { src?: string, loop?: boolean; volume?: number; fade?: number } = {}): Promise<void> {
    const fade = options.fade ?? 0
    if (options.volume !== undefined)
      this.targetVolume = options.volume

    if (!options.src) {
      if (this.audio.src) {
        this.audio.loop = options.loop ?? this.loop
        if (this.audio.paused) {
          this.audio.volume = 0
          await this.audio.play()
        }
        return await this.setVolume({ index: this.currentIndex, volume: this.targetVolume, fade })
      }
      return
    }

    const oldIndex = this.currentIndex
    const newIndex = (this.currentIndex + 1) % 2
    // const oldAudio = this.audios[oldIndex]
    const newAudio = this.audios[newIndex]

    newAudio.src = options.src
    newAudio.loop = options.loop ?? this.loop
    newAudio.volume = fade > 0 ? 0 : this.targetVolume

    newAudio.load()
    await new Promise((resolve) => {
      newAudio.addEventListener('canplaythrough', resolve, { once: true })
    })

    try {
      await newAudio.play()
    } catch (e) {
      Logger.error('Playback error:', e)
      this.stopAudio(newIndex)
      return
    }

    this.currentIndex = newIndex

    if (fade > 0) {
      await Promise.all([
        this.setVolume({ index: oldIndex, volume: 0, fade, stopOnEnd: true }),
        this.setVolume({ index: newIndex, volume: this.targetVolume, fade })
      ])
    } else {
      this.stopAudio(oldIndex)
    }
  }

  public async pause(fade: number = 0): Promise<void> {
    if (fade > 0) {
      await this.setVolume({ index: this.currentIndex, volume: 0, fade, pauseOnEnd: true })
    } else {
      this.audio.pause()
    }
  }

  public async stop(fade: number = 0): Promise<void> {
    if (fade > 0) {
      await this.setVolume({ index: this.currentIndex, volume: 0, fade, stopOnEnd: true })
    } else {
      this.audios.forEach((_, i) => this.stopAudio(i))
    }
  }

  public fade(volume: number, fade: number = 0): Promise<void> {
    this.targetVolume = volume
    return this.setVolume({ index: this.currentIndex, volume, fade })
  }

  public resume(fade: number = 0): Promise<void> {
    return this.play({ fade })
  }

  private get audio() { return this.audios[this.currentIndex] }

  public get volume() { return this.audio.volume }
  public set volume(value: number) {
    this.targetVolume = value
    gsap.killTweensOf(this.audio, 'volume')
    this.audio.volume = Math.max(0, Math.min(1, value))
  }

  public get loop() { return this.audio.loop }
  public set loop(value: boolean) { this.audios.forEach(a => a.loop = value) }

  public get muted() { return this.audio.muted }
  public set muted(value: boolean) { this.audios.forEach(a => a.muted = value) }

  private setVolume(
    { index, volume, fade, stopOnEnd, pauseOnEnd }
      : { index: number, volume: number, fade: number, stopOnEnd?: boolean, pauseOnEnd?: boolean }
  ): Promise<void> {
    const audio = this.audios[index]

    if (!audio.src) return Promise.resolve()

    gsap.killTweensOf(audio, 'volume')

    return new Promise((resolve) => {
      if (fade <= 0) {
        audio.volume = volume
        if (stopOnEnd) this.stopAudio(index)
        resolve()
        return
      }

      gsap.to(audio, {
        volume,
        duration: fade,
        ease: volume > audio.volume ? 'sine.out' : 'sine.in',
        overwrite: 'auto',
        onComplete: () => {
          if (stopOnEnd)
            this.stopAudio(index)
          else if (pauseOnEnd)
            audio.pause()
          resolve()
        },
        onInterrupt: () => resolve(),
      })
    })
  }

  private stopAudio(index: number) {
    const audio = this.audios[index]
    gsap.killTweensOf(audio, 'volume')
    audio.pause()
    audio.src = ''
    audio.removeAttribute('src')
    audio.load()
  }

  public override destroy(): void {
    this.stop()
    super.destroy()
  }
}