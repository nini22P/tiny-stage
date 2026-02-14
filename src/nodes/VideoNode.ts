import { BaseNode, type BaseNodeProps } from './BaseNode'
import { Logger } from '../utils/Logger'

export interface VideoNodeProps extends BaseNodeProps {
  src: string;
  loop?: boolean;
  muted?: boolean;
}

export class VideoNode extends BaseNode<HTMLVideoElement> {
  constructor({ type = 'video', id, tagName = 'video', src, loop = false, muted = false, tween }: VideoNodeProps) {
    super({
      type,
      id,
      tagName,
      tween,
    })

    this.element.playsInline = true
    this.element.autoplay = true
    this.element.loop = loop
    this.element.muted = muted

    this.element.src = src

    Logger.debug(`VideoNode initialized: ${id} with src: ${src}`)
  }

  public set src(src: string) {
    this.element.src = src
  }

  public get src(): string {
    return this.element.src
  }

  public override destroy(): void {
    this.element.pause()
    this.element.src = ''
    super.destroy()
  }
}