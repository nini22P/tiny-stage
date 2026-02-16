import gsap from 'gsap'
import { Howl } from 'howler'
import { BaseNode, type BaseNodeProps } from '../BaseNode'

export interface SoundInstance {
  id: number;
  src: string;
  speakerId?: string;
  startTime: number;
}

export interface HowlInstance {
  howl: Howl;
  src: string;
  sounds: Map<number, SoundInstance>;
  lastUsed: number;
}

export interface HowlNodeProps extends BaseNodeProps {
  poolSize?: number
}

export abstract class HowlNode extends BaseNode {
  protected howls: Map<string, HowlInstance> = new Map()
  protected poolSize: number

  private howlTweens: Map<string, { proxy: { volume: number } }> = new Map()

  constructor(props: BaseNodeProps & { poolSize?: number }) {
    super(props)
    this.poolSize = props.poolSize ?? 10
  }

  protected getHowlInstance(src: string, html5 = false): HowlInstance {
    const howlInstance = this.howls.get(src)

    if (howlInstance) {
      howlInstance.lastUsed = Date.now()
      return howlInstance
    }

    this.purgeCache()

    const howl = new Howl({ src: [src], html5, preload: true })

    const instance: HowlInstance = {
      howl,
      src,
      sounds: new Map(),
      lastUsed: Date.now()
    }

    this.howls.set(src, instance)
    return instance
  }

  protected removeAudioInstance(howl: HowlInstance, soundId: number) {
    howl.sounds.delete(soundId)
    howl.lastUsed = Date.now()
  }

  private purgeCache() {
    if (this.howls.size < this.poolSize) {
      return
    }

    const idleHowls = Array.from(this.howls.values())
      .filter(howl => howl.sounds.size === 0)
      .sort((a, b) => a.lastUsed - b.lastUsed)

    const oldest = idleHowls.shift()
    if (oldest) {
      oldest.howl.unload()
      this.howls.delete(oldest.src)
    }
  }

  protected async waitLoaded(howl: Howl): Promise<void> {
    if (howl.state() === 'loaded')
      return

    let timeoutId: number | undefined = undefined
    const cleanup = () => {
      howl.off('load')
      howl.off('loaderror')
      clearTimeout(timeoutId)
    }

    try {
      await Promise.race([
        new Promise<void>((resolve) => howl.once('load', () => resolve())),
        new Promise<void>((_, reject) => howl.once('loaderror', (_, e) => reject(e))),
        new Promise<void>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Audio load timeout')), 8000)
        })
      ])
    } finally {
      cleanup()
    }
  }

  protected async fadeHowl(
    howlInstance: HowlInstance,
    options: {
      volume: number;
      fade: number;
      soundId?: number;
      onComplete?: () => void;
    }
  ): Promise<void> {
    const { volume, fade, soundId, onComplete } = options
    const howl = howlInstance.howl

    const tweenKey = `${howlInstance.src}_${soundId ?? 'global'}`

    const existing = this.howlTweens.get(tweenKey)
    if (existing) {
      gsap.killTweensOf(existing.proxy)
      this.howlTweens.delete(tweenKey)
    }

    const currentVolume = soundId !== undefined ? howl.volume(soundId) as number : howl.volume()
    const targetVolume = Math.max(0, Math.min(1, volume))

    if (fade <= 0) {
      if (soundId !== undefined)
        howl.volume(targetVolume, soundId)
      else
        howl.volume(targetVolume)
      onComplete?.()
      return Promise.resolve()
    }

    const proxy = { volume: currentVolume }
    this.howlTweens.set(tweenKey, { proxy })

    return new Promise((resolve) => {

      gsap.to(proxy, {
        volume: targetVolume,
        duration: fade,
        ease: targetVolume > currentVolume ? 'power1.out' : 'power2.in',
        overwrite: 'auto',
        onUpdate: () => {
          if (howl.state() === 'unloaded')
            return
          if (soundId !== undefined)
            howl.volume(proxy.volume, soundId)
          else
            howl.volume(proxy.volume)
        },
        onComplete: () => {
          onComplete?.()
          resolve()
        },
        onInterrupt: resolve
      })
    })
  }

  public abstract play(...args: unknown[]): Promise<SoundInstance>

  public abstract stop(...args: unknown[]): Promise<void>

  public stopAll(fade: number = 0) {
    this.howls.forEach(howlInstance => {
      if (fade <= 0) {
        this.killTweensBySrc(howlInstance.src)
        howlInstance.howl.stop()
        howlInstance.sounds.clear()
      } else {
        Array.from(howlInstance.sounds.values()).forEach(sound => {
          this.fadeHowl(howlInstance, {
            volume: 0,
            fade,
            soundId: sound.id,
            onComplete: () => {
              howlInstance.howl.stop(sound.id)
              this.removeAudioInstance(howlInstance, sound.id)
            }
          })
        })
      }
    })
  }

  protected killTweensBySrc(src: string) {
    this.howlTweens.forEach((val, key) => {
      if (key.startsWith(`${src}_`)) {
        gsap.killTweensOf(val.proxy)
        this.howlTweens.delete(key)
      }
    })
  }

  protected *activeSoundsIterator() {
    for (const howlInstance of this.howls.values()) {
      for (const sound of howlInstance.sounds.values()) {
        yield { howlInstance, sound }
      }
    }
  }

  protected get totalActiveCount(): number {
    let count = 0
    for (const howlInstance of this.howls.values()) {
      count += howlInstance.sounds.size
    }
    return count
  }

  public destroy(): void {
    this.howlTweens.forEach(val => {
      gsap.killTweensOf(val.proxy)
    })
    this.howlTweens.clear()
    this.stopAll()
    this.howls.forEach(h => h.howl.unload())
    this.howls.clear()
    super.destroy()
  }
}