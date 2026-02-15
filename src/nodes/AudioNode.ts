import gsap from 'gsap'
import { Logger } from '../utils/Logger'
import { BaseNode, type BaseNodeProps } from './BaseNode'

export type AudioNodeProps = Omit<BaseNodeProps, 'type' | 'tagName'>

export class AudioNode extends BaseNode {
  private audios: [HTMLAudioElement, HTMLAudioElement]
  private currentIndex: number = 0
  private targetVolume: number = 1

  constructor(props: AudioNodeProps) {
    super({ ...props, type: 'audio' })

    this.audios = [new Audio(), new Audio()]
    this.audios.forEach(a => {
      a.preload = 'auto'
      a.crossOrigin = 'anonymous'
    })
  }

  public async play(options: { src?: string, loop?: boolean; volume?: number; duration?: number } = {}): Promise<void> {
    const duration = options.duration ?? 0
    if (options.volume !== undefined) this.targetVolume = options.volume

    if (!options.src) {
      if (this.activeAudio.src) {
        this.activeAudio.loop = options.loop ?? this.loop
        if (this.activeAudio.paused) {
          this.activeAudio.volume = 0
          await this.activeAudio.play()
        }
        return await this.setVolume({ index: this.currentIndex, volume: this.targetVolume, duration })
      }
      return
    }

    const oldIndex = this.currentIndex
    const newIndex = (this.currentIndex + 1) % 2
    // const oldAudio = this.audios[oldIndex]
    const newAudio = this.audios[newIndex]

    newAudio.src = options.src
    newAudio.loop = options.loop ?? this.loop
    newAudio.volume = duration > 0 ? 0 : this.targetVolume

    newAudio.load()
    await new Promise((resolve) => {
      newAudio.addEventListener('canplaythrough', resolve, { once: true })
    })

    try {
      await newAudio.play()
    } catch (e) {
      Logger.error('Playback error:', e)
      this.stopChannel(newIndex)
      return
    }

    this.currentIndex = newIndex

    if (duration > 0) {
      await Promise.all([
        this.setVolume({ index: oldIndex, volume: 0, duration, stopOnEnd: true }),
        this.setVolume({ index: newIndex, volume: this.targetVolume, duration })
      ])
    } else {
      this.stopChannel(oldIndex)
    }
  }

  public async pause(duration: number = 0): Promise<void> {
    if (duration > 0) {
      await this.setVolume({ index: this.currentIndex, volume: 0, duration, pauseOnEnd: true })
    } else {
      this.activeAudio.pause()
    }
  }

  public async stop(duration: number = 0): Promise<void> {
    if (duration > 0) {
      await this.setVolume({ index: this.currentIndex, volume: 0, duration, stopOnEnd: true })
    } else {
      this.audios.forEach((_, i) => this.stopChannel(i))
    }
  }

  public fade(volume: number, duration: number = 0): Promise<void> {
    this.targetVolume = volume
    return this.setVolume({ index: this.currentIndex, volume, duration })
  }

  public resume(duration: number = 0): Promise<void> {
    return this.play({ duration })
  }

  private get activeAudio() { return this.audios[this.currentIndex] }

  public get volume() { return this.activeAudio.volume }
  public set volume(volume: number) {
    this.targetVolume = volume
    gsap.killTweensOf(this.activeAudio, 'volume')
    this.activeAudio.volume = Math.max(0, Math.min(1, volume))
  }

  public get loop() { return this.activeAudio.loop }
  public set loop(v: boolean) { this.audios.forEach(a => a.loop = v) }

  public get muted() { return this.activeAudio.muted }
  public set muted(v: boolean) { this.audios.forEach(a => a.muted = v) }

  private setVolume(
    { index, volume, duration, stopOnEnd, pauseOnEnd }
      : { index: number, volume: number, duration: number, stopOnEnd?: boolean, pauseOnEnd?: boolean }
  ): Promise<void> {
    const audio = this.audios[index]

    if (!audio.src) return Promise.resolve()

    gsap.killTweensOf(audio, 'volume')

    return new Promise((resolve) => {
      if (duration <= 0) {
        audio.volume = volume
        if (stopOnEnd) this.stopChannel(index)
        resolve()
        return
      }

      gsap.to(audio, {
        volume,
        duration: duration / 1000,
        ease: 'power1.inOut',
        overwrite: 'auto',
        onComplete: () => {
          if (stopOnEnd) this.stopChannel(index)
          else if (pauseOnEnd) audio.pause()
          resolve()
        },
        onKill: () => resolve(),
      })
    })
  }

  private stopChannel(index: number) {
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