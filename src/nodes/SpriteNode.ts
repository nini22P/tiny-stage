import { BaseNode, type BaseNodeProps } from './BaseNode'

export interface SpriteNodeProps extends BaseNodeProps {
  src: string;
}

export class SpriteNode extends BaseNode {
  constructor({ type = 'sprite', id, src, tween }: SpriteNodeProps) {
    super({
      type,
      id,
      tween: {
        ...tween,
        backgroundImage: `url(${src})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        imageRendering: 'auto',
      }
    })
  }

  public set src(src: string) {
    this.set({
      backgroundImage: `url(${src})`
    })
  }

  public get src(): string {
    const match = this.element.style.backgroundImage.match(/url\("?(.*?)"?\)/)
    return match ? match[1] : ''
  }

  public override destroy(): void {
    super.destroy()
  }
}