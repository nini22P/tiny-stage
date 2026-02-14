import gsap from 'gsap'
import { Logger } from '../utils/Logger'
import { EventEmitter } from '../utils/EventEmitter'

export type Tween = gsap.TweenVars

export interface BaseNodeProps {
  type?: string;
  id: string;
  tagName?: keyof HTMLElementTagNameMap,
  tween?: Tween;
}

export class BaseNode<T extends HTMLElement = HTMLElement> extends EventEmitter {
  public element: T
  public id: string

  private animationCount = 0
  private isDestroyed = false

  constructor({ type = 'base', id, tagName = 'div', tween }: BaseNodeProps) {
    super()
    this.id = id
    this.element = document.createElement(tagName) as T
    this.element.id = `${type}:${id}`
    this.element.style.position = 'absolute'
    this.element.style.display = 'block'
    this.element.style.boxSizing = 'border-box'
    this.element.style.margin = '0'
    this.element.style.padding = '0'

    Logger.debug(`Node created: ${type}:${id}`)

    if (tween) {
      this.set(tween)
    }
  }

  public set(tween: Tween): this {
    if (this.isDestroyed) {
      Logger.warn(`Attempting to set destroyed node: ${this.id}`)
      return this
    }

    this.emit('beforeUpdate', tween)

    gsap.set(this.element, tween)

    this.emit('afterUpdate', tween)
    Logger.debug(`Node set: ${this.id}`, tween)

    return this
  }

  public to(tween: Tween): this {
    if (this.isDestroyed) {
      Logger.warn(`Attempting to animate destroyed node: ${this.id}`)
      return this
    }

    this.emit('beforeUpdate', tween)
    this.enableWillChange()

    gsap.to(this.element, {
      ...tween,
      overwrite: 'auto',
      onStart: () => {
        this.emit('animationStart', tween)
      },
      onUpdate: () => {
        this.emit('animationUpdate', tween)
      },
      onComplete: () => {
        this.disableWillChange()
        this.emit('animationComplete', tween)
      },
      onInterrupt: () => {
        this.disableWillChange()
        this.emit('animationInterrupt', tween)
      }
    })

    this.emit('afterUpdate', tween)
    Logger.debug(`Node animated: ${this.id}`, tween)

    return this
  }

  public addNode(node: BaseNode): this {
    this.element.appendChild(node.element)
    Logger.debug(`Node added: ${node.id} to ${this.id}`)
    return this
  }

  public removeNode(node: BaseNode): this {
    if (node.element.parentElement === this.element) {
      this.element.removeChild(node.element)
      Logger.debug(`Node removed: ${node.id} from ${this.id}`)
    }
    return this
  }

  private enableWillChange(): void {
    if (this.animationCount === 0) {
      this.element.style.willChange = 'transform, opacity'
    }
    this.animationCount++
  }

  private disableWillChange(): void {
    this.animationCount--
    if (this.animationCount <= 0) {
      this.animationCount = 0
      this.element.style.willChange = 'auto'
    }
  }

  public destroy(): void {
    if (this.isDestroyed) {
      return
    }

    this.emit('beforeDestroy')

    gsap.killTweensOf(this.element)

    this.element.remove()

    this.clear()

    this.isDestroyed = true
    Logger.debug(`Node destroyed: ${this.id}`)
  }
}