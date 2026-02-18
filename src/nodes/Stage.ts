import gsap from 'gsap'
import { Logger, LogLevel } from '../utils/Logger'
import { BaseNode, type BaseNodeProps } from './BaseNode'

export interface StageConfig extends Omit<BaseNodeProps, 'type' | 'tagName'> {
  container: HTMLElement;
  width: number;
  height: number;
  debug?: boolean;
}

export class Stage extends BaseNode<HTMLElement> {

  public config: StageConfig

  private _resizeObserver: ResizeObserver
  private _resizeTimer: number | null = null

  constructor(config: StageConfig) {
    super({
      type: 'stage',
      id: config.id,
      tween: {
        ...config.tween,
        x: 0,
        y: 0,
        width: config.width,
        height: config.height,
        overflow: 'hidden',
        userSelect: 'none',
        position: 'absolute',
        transformOrigin: 'top left',
      }
    })

    if (config.debug) {
      Logger.setLevel(LogLevel.DEBUG)
    }

    Logger.info('Stage initializing...', {
      width: config.width,
      height: config.height,
      debug: config.debug
    })

    this.config = config
    this.config.container.appendChild(this.element)

    this._updateLayout()

    this._resizeObserver = new ResizeObserver(() => {
      if (this._resizeTimer !== null) {
        cancelAnimationFrame(this._resizeTimer)
      }
      this._resizeTimer = requestAnimationFrame(() => {
        this._updateLayout()
        this._resizeTimer = null
      })
    })
    this._resizeObserver.observe(config.container)

    Logger.info('Stage created successfully')
  }

  private _updateLayout(): void {
    const { container, width, height } = this.config
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    const scaleX = containerWidth / width
    const scaleY = containerHeight / height
    const scale = Math.min(scaleX, scaleY)

    const scaledWidth = width * scale
    const scaledHeight = height * scale
    const offsetX = Math.round((containerWidth - scaledWidth) / 2)
    const offsetY = Math.round((containerHeight - scaledHeight) / 2)

    gsap.set(this.element, {
      width: width,
      height: height,
      x: offsetX,
      y: offsetY,
      scale: scale
    })

    Logger.debug('Layout updated', { scale, offsetX, offsetY })
  }

  public override destroy(): void {
    Logger.info('Stage destroying...')

    if (this._resizeTimer !== null) {
      cancelAnimationFrame(this._resizeTimer)
      this._resizeTimer = null
    }

    this._resizeObserver.disconnect()

    super.destroy()

    Logger.info('Stage destroyed')
  }
}

