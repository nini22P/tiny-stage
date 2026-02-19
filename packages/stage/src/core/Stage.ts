import gsap from 'gsap'
import { Logger, LogLevel } from '../utils/Logger'
import { BaseNode, type BaseNodeProps } from './BaseNode'

export interface StageConfig {
  width: number;
  height: number;
  debug?: boolean;
}

export interface StageProps extends Omit<BaseNodeProps<StageConfig>, 'type' | 'tagName'> {
  container: HTMLElement;
}

export class Stage extends BaseNode<HTMLElement, StageConfig> {
  public container: HTMLElement

  private _resizeObserver: ResizeObserver
  private _resizeTimer: number | null = null

  constructor(props: StageProps) {
    const config: StageConfig = {
      width: 1920,
      height: 1080,
      debug: false,
      ...props.data,
    }

    super({
      type: 'stage',
      id: props.id,
      data: config,
      tween: {
        ...props.tween,
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

    this.container = props.container

    if (config.debug) {
      Logger.setLevel(LogLevel.DEBUG)
    }

    Logger.info('Stage initializing...', {
      width: config.width,
      height: config.height,
      debug: config.debug
    })

    this.data = config
    props.container.appendChild(this.element)

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
    this._resizeObserver.observe(props.container)

    Logger.info('Stage created successfully')
  }

  private _updateLayout(): void {
    const container = this.container
    const { width, height } = this.data
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

