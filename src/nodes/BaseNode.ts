import gsap from 'gsap'
import { Logger } from '../utils/Logger'

export type Tween = gsap.TweenVars

export interface BaseNodeProps {
  type?: string;
  id: string;
  tagName?: keyof HTMLElementTagNameMap,
  tween?: Tween;
}

export class BaseNode<T extends HTMLElement = HTMLElement> {
  public element: T
  public id: string

  protected _children: BaseNode[] = []

  private _animationCount = 0
  private _isDestroyed = false

  constructor({ type = 'base', id, tagName = 'div', tween }: BaseNodeProps) {
    this.id = id
    this.element = document.createElement(tagName) as T
    this.element.id = `${type}:${id}`
    this.element.style.position = 'absolute'
    this.element.style.display = 'block'
    this.element.style.boxSizing = 'border-box'
    this.element.style.margin = '0'
    this.element.style.padding = '0'

    if (tween) {
      this.set(tween)
    }

    Logger.debug(`Node created: ${this.element.id} `)
  }

  public set(tween: Tween): this {
    if (this._isDestroyed) {
      Logger.warn(`Attempting to set destroyed node: ${this.element.id} `)
      return this
    }

    Logger.debug(`Tween set: ${this.element.id} `, tween)

    gsap.set(this.element, tween)

    return this
  }

  public async to(tween: Tween): Promise<this> {
    if (this._isDestroyed) {
      Logger.warn(`Attempting to animate destroyed node: ${this.element.id} `)
      return this
    }

    Logger.debug(`Tween To: ${this.element.id} `, tween)

    this._enableWillChange()

    await gsap.to(this.element, {
      ...tween,
      overwrite: 'auto',
      onComplete: () => {
        this._disableWillChange()
        tween.onComplete?.()
      },
      onInterrupt: () => {
        this._disableWillChange()
        tween.onInterrupt?.()
      }
    })

    return this
  }

  public addNode(node: BaseNode): this {
    this._children.push(node)
    this.element.appendChild(node.element)
    Logger.debug(`Node added: ${node.element.id} to ${this.element.id} `)
    return this
  }

  public removeNode(node: BaseNode): this {
    this._children = this._children.filter(c => c !== node)
    if (node.element.parentElement === this.element) {
      this.element.removeChild(node.element)
      Logger.debug(`Node removed: ${node.element.id} from ${this.element.id} `)
    }
    return this
  }

  private _enableWillChange(): void {
    if (this._animationCount === 0) {
      this.element.style.willChange = 'transform, opacity'
    }
    this._animationCount++
  }

  private _disableWillChange(): void {
    this._animationCount--
    if (this._animationCount <= 0) {
      this._animationCount = 0
      this.element.style.willChange = 'auto'
    }
  }

  public destroy(): void {
    if (this._isDestroyed) {
      return
    }

    [...this._children].forEach(child => child.destroy())
    this._children = []

    gsap.killTweensOf(this.element)

    this.element.remove()
    this._isDestroyed = true

    Logger.debug(`Node destroyed: ${this.element.id} `)
  }
}