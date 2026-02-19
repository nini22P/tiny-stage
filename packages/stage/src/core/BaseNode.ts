import gsap from 'gsap'
import { Logger } from '../utils/Logger'

export interface BaseNodeState<TData = Record<string, unknown>> {
  id: string;
  type: string;
  transform: {
    x: number | string;
    y: number | string;
    width: number | string;
    height: number | string;
    rotation: number | string;
    scaleX: number | string;
    scaleY: number | string;
    skewX: number | string;
    skewY: number | string;
    xPercent: number | string;
    yPercent: number | string;
    transformOrigin: string;
    opacity: number | string;
    zIndex: number;
    visible: boolean;
  };
  data: TData;
  children: BaseNodeState[];
}

export type Tween = gsap.TweenVars

export interface BaseNodeProps<TData = Record<string, unknown>> {
  id: string;
  type?: string;
  tagName?: keyof HTMLElementTagNameMap;
  data?: TData;
  tween?: Tween;
}

export class BaseNode<T extends HTMLElement = HTMLElement, TData = Record<string, unknown>> {
  public element: T
  public id: string
  public type: string
  public data: TData

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected _children: BaseNode<any, any>[] = []

  private _animationCount = 0
  private _isDestroyed = false

  constructor(props: BaseNodeProps<TData>) {
    this.id = props.id
    this.type = props.type ?? 'base'
    this.data = props.data ?? {} as TData

    this.element = document.createElement(props.tagName ?? 'div') as T
    this.element.id = `${this.type}:${this.id}`
    this.element.style.position = 'absolute'
    this.element.style.display = 'block'
    this.element.style.boxSizing = 'border-box'
    this.element.style.margin = '0'
    this.element.style.padding = '0'

    if (props.tween) {
      this.set(props.tween)
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public addNode(node: BaseNode<any, any>): this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._children.push(node as BaseNode<any, any>)
    this.element.appendChild(node.element)
    Logger.debug(`Node added: ${node.element.id} to ${this.element.id} `)
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public removeNode(node: BaseNode<any, any>): this {
    this._children = this._children.filter(c => c !== node)
    if (node.element.parentElement === this.element) {
      this.element.removeChild(node.element)
      Logger.debug(`Node removed: ${node.element.id} from ${this.element.id} `)
    }
    return this
  }

  public toJSON(): BaseNodeState<TData> {
    return {
      id: this.id,
      type: this.type,
      transform: {
        x: gsap.getProperty(this.element, ('x')),
        y: gsap.getProperty(this.element, ('y')),
        width: gsap.getProperty(this.element, ('width')),
        height: gsap.getProperty(this.element, ('height')),
        rotation: gsap.getProperty(this.element, ('rotation')),
        scaleX: gsap.getProperty(this.element, ('scaleX')),
        scaleY: gsap.getProperty(this.element, ('scaleY')),
        skewX: gsap.getProperty(this.element, ('skewX')),
        skewY: gsap.getProperty(this.element, ('skewY')),
        xPercent: gsap.getProperty(this.element, ('xPercent')),
        yPercent: gsap.getProperty(this.element, ('yPercent')),
        transformOrigin: this.element.style.transformOrigin || '50% 50%',
        opacity: gsap.getProperty(this.element, ('opacity')),
        zIndex: Number(this.element.style.zIndex) || 0,
        visible: this.element.style.display !== 'none'
      },
      data: this.data,
      children: this._children.map(child => child.toJSON())
    }
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