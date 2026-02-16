import gsap from 'gsap'
import { Logger } from '../utils/Logger'
import { BaseNode, type BaseNodeProps } from './BaseNode'

export type BgmNodeProps = Omit<BaseNodeProps, 'type' | 'tagName'>

export class BgmNode extends BaseNode {
  private audios: [HTMLAudioElement, HTMLAudioElement]
  private currentIndex: number = 0
  private targetVolume: number = 1

  constructor(props: BgmNodeProps) {
    super({ ...props, type: 'bgm' })

    this.audios = [new Audio(), new Audio()]
    this.audios.forEach(a => {
      a.preload = 'auto'
      a.crossOrigin = 'anonymous'
    })
  }

  public async play(options: {
    src?: string;
    loop?: boolean;
    volume?: number;
    fade?: number;
  } = {}): Promise<void> {
    const fade = options.fade ?? 0
    const volume = options.volume ?? this.targetVolume
    if (options.volume !== undefined) this.targetVolume = options.volume

    if (!options.src) {
      if (this.audio.src) {
        this.audio.loop = options.loop ?? this.loop
        if (this.audio.paused) {
          this.audio.volume = 0
          await this.audio.play()
        }
        return await this.setAudio({ audio: this.audio, volume, fade })
      }
      return
    }

    const oldIndex = this.currentIndex
    const newIndex = (this.currentIndex + 1) % 2
    const oldAudio = this.audios[oldIndex]
    const newAudio = this.audios[newIndex]

    newAudio.src = options.src
    newAudio.loop = options.loop ?? this.loop
    newAudio.volume = fade > 0 ? 0 : volume

    newAudio.load()
    await new Promise((resolve) => {
      newAudio.addEventListener('canplaythrough', resolve, { once: true })
    })

    try {
      await newAudio.play()
    } catch (e) {
      Logger.error('Playback error:', e)
      this.stopAudio(newAudio)
      return
    }

    this.currentIndex = newIndex

    if (fade > 0) {
      this.setAudio({ audio: oldAudio, volume: 0, fade, stopOnEnd: true })
      this.setAudio({ audio: newAudio, volume: volume, fade })
    } else {
      this.stopAudio(oldAudio)
    }
  }

  public async pause(fade: number = 0): Promise<void> {
    await this.setAudio({ audio: this.audio, volume: 0, fade, pauseOnEnd: true })
  }

  public async stop(fade: number = 0): Promise<void> {
    await this.setAudio({ audio: this.audio, volume: 0, fade, stopOnEnd: true })
  }

  public async fade(volume: number, fade: number = 0): Promise<void> {
    this.targetVolume = volume
    return await this.setAudio({ audio: this.audio, volume, fade })
  }

  public async resume(fade: number = 0): Promise<void> {
    return await this.play({ fade })
  }

  public async seek(time: number): Promise<void> {
    this.audio.currentTime = time
  }

  private get audio() { return this.audios[this.currentIndex] }

  public get volume() { return this.audio.volume }
  public set volume(volume: number) {
    this.targetVolume = volume
    gsap.killTweensOf(this.audio, 'volume')
    this.audio.volume = Math.max(0, Math.min(1, volume))
  }

  public get loop() { return this.audio.loop }
  public set loop(v: boolean) { this.audios.forEach(a => a.loop = v) }

  private setAudio({ audio, volume, fade, stopOnEnd, pauseOnEnd }: {
    audio: HTMLAudioElement,
    volume: number,
    fade: number,
    stopOnEnd?: boolean,
    pauseOnEnd?: boolean
  }): Promise<void> {
    if (!audio) return Promise.resolve()

    gsap.killTweensOf(audio, 'volume')

    const targetVol = Math.max(0, Math.min(1, volume))

    if (fade <= 0) {
      audio.volume = targetVol
      if (stopOnEnd) this.stopAudio(audio)
      else if (pauseOnEnd) audio.pause()
      return Promise.resolve()
    }

    const isFadeIn = targetVol > audio.volume
    const ease = isFadeIn ? 'power1.out' : 'power1.in'

    return new Promise((resolve) => {
      gsap.to(audio, {
        volume: targetVol,
        duration: fade,
        ease: ease,
        overwrite: true,
        onComplete: () => {
          audio.volume = targetVol
          if (stopOnEnd) this.stopAudio(audio)
          else if (pauseOnEnd) audio.pause()
          resolve()
        },
        onInterrupt: () => {
          resolve()
        }
      })
    })
  }

  private stopAudio(audio: HTMLAudioElement) {
    gsap.killTweensOf(audio, 'volume')
    audio.pause()
    audio.onended = null
    audio.src = ''
    audio.removeAttribute('src')
    audio.load()
  }

  public override destroy(): void {
    this.stop()
    super.destroy()
  }
}