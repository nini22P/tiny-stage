import { BaseNode, type BaseNodeProps } from './BaseNode'
import gsap from 'gsap'

export type TypewriterNodeProps = Omit<BaseNodeProps, 'type' | 'tagName'>

export interface TypewriterOptions {
  speed?: number;
  loop?: boolean;
  onChar?: (char: string, index: number) => void;
}

export class TypewriterNode extends BaseNode<HTMLParagraphElement> {
  private _text: string = ''
  private _typeTween?: gsap.core.Tween

  constructor(props: TypewriterNodeProps) {
    super({
      type: 'typewriter',
      id: props.id,
      tagName: 'p',
      tween: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        ...props.tween,
      }
    })

    this._text = ''
    this.element.textContent = ''
  }

  public get text(): string {
    return this._text
  }

  public set text(text: string) {
    this._text = text
    this._typeTween?.kill()
    this.element.textContent = text
  }

  public setText(text: string): this {
    this._text = text
    return this
  }

  public showText(text?: string): this {
    if (text !== undefined) this._text = text
    this._typeTween?.kill()
    this.element.textContent = this._text
    return this
  }

  public isTypingActive(): boolean {
    return this._typeTween?.isActive() ?? false
  }

  public play(text?: string, options?: TypewriterOptions): Promise<this> {
    const speed = options?.speed ?? 0.025
    const onChar = options?.onChar

    if (text !== undefined) this._text = text
    this._typeTween?.kill()
    this.element.textContent = ''

    if (!this._text) return Promise.resolve(this)

    const chars = Array.from(this._text)
    const total = chars.length

    return new Promise((resolve) => {
      const obj = { count: 0 }

      let lastProgress = 0

      this._typeTween = gsap.to(obj, {
        count: total,
        duration: total * speed,
        ease: 'none',
        onUpdate: () => {
          const progress = Math.floor(obj.count)

          if (progress !== lastProgress) {
            const currentText = chars.slice(0, progress).join('')
            this.element.textContent = currentText

            for (let i = lastProgress; i < progress; i++) {
              if (this._typeTween?.isActive()) {
                onChar?.(chars[i], i)
              }
            }

            lastProgress = progress
          }
        },
        onComplete: () => {
          this.element.textContent = this._text
          this._typeTween = undefined
          resolve(this)
        },
        onInterrupt: () => {
          this._typeTween = undefined
          resolve(this)
        }
      })
    })
  }

  public skip(): this {
    if (this._typeTween?.isActive()) {
      this._typeTween.progress(1)
    } else {
      this.element.textContent = this._text
    }
    return this
  }

  public override destroy(): void {
    this._typeTween?.kill()
    super.destroy()
  }
}