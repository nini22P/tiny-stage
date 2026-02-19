import { BaseNode, type BaseNodeProps } from '../core/BaseNode'

export interface ImageNodeData {
  src: string;
}

export type ImageNodeProps = Omit<BaseNodeProps<ImageNodeData>, 'type' | 'tagName'>

export class ImageNode extends BaseNode {
  constructor(props: ImageNodeProps) {
    super({
      type: 'image',
      id: props.id,
      tween: {
        backgroundImage: `url(${props.data?.src})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        imageRendering: 'auto',
        ...props.tween,
      }
    })

    this.data = {
      src: props.data?.src || ''
    }
  }

  public set src(src: string) {
    this.set({
      backgroundImage: `url(${src})`
    })
    this.data.src = src
  }

  public get src(): string {
    const match = this.element.style.backgroundImage.match(/url\("?(.*?)"?\)/)
    return match ? match[1] : ''
  }

  public override destroy(): void {
    super.destroy()
  }
}