import { Logger } from '../utils/Logger'
import { BaseNode, type BaseNodeProps } from '../core/BaseNode'

export interface VideoNodeData {
  src: string;
  muted?: boolean;
  loop?: boolean;
}

export type VideoNodeProps = Omit<BaseNodeProps<VideoNodeData>, 'type' | 'tagName'>

export class VideoNode extends BaseNode<HTMLVideoElement, VideoNodeData> {

  constructor(props: VideoNodeProps) {
    const data = {
      src: '',
      muted: false,
      loop: false,
      ...props.data,
    }

    super({
      type: 'video',
      id: props.id,
      tagName: 'video',
      data,
      tween: props.tween,
    })

    this.element.playsInline = true
    this.element.autoplay = true
    this.element.controls = false
    this.element.disablePictureInPicture = true

    this.element.src = data.src
    this.element.muted = data.muted
    this.element.loop = data.loop
  }

  public set src(src: string) {
    this.element.src = src
  }

  public get src(): string {
    return this.element.src
  }

  public waitEnded(): Promise<void> {
    if (this.element.ended || this.element.error) {
      if (this.element.error) {
        Logger.error('Video error:', this.element.error)
      }
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      const cleanup = () => {
        this.element.removeEventListener('ended', handler)
        this.element.removeEventListener('error', handler)
        this.element.removeEventListener('emptied', handler)
      }

      const handler = () => {
        cleanup()
        resolve()
      }

      this.element.addEventListener('ended', handler, { once: true })
      this.element.addEventListener('error', handler, { once: true })
      this.element.addEventListener('emptied', handler, { once: true })
    })
  }

  public override destroy(): void {
    this.element.pause()
    this.element.src = ''
    super.destroy()
  }
}