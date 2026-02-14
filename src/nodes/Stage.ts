import gsap from 'gsap'
import { Logger, LogLevel } from '../utils/Logger'
import { BaseNode, type BaseNodeEvents, type BaseNodeProps } from './BaseNode'

export interface StageConfig extends Omit<BaseNodeProps, 'id' | 'type'> {
  container: HTMLElement;
  width: number;
  height: number;
  debug?: boolean;
}

export type StageEvents = BaseNodeEvents & {
  stageCreated: [Stage];
  stageDestroying: [Stage];
  stageDestroyed: [Stage];
  layoutUpdated: [{ scale: number; offsetX: number; offsetY: number }];
};

export class Stage extends BaseNode<HTMLElement, StageEvents> {
  private config: StageConfig
  private resizeObserver: ResizeObserver
  private resizeTimer: number | null = null

  constructor(config: StageConfig) {
    super({
      type: 'stage',
      id: 'root',
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

    this.updateLayout()

    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeTimer !== null) {
        cancelAnimationFrame(this.resizeTimer)
      }
      this.resizeTimer = requestAnimationFrame(() => {
        this.updateLayout()
        this.resizeTimer = null
      })
    })
    this.resizeObserver.observe(config.container)

    this.emit('stageCreated', this)
    Logger.info('Stage created successfully')
  }

  private updateLayout(): void {
    const { container, width, height } = this.config
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    const scaleX = containerWidth / width
    const scaleY = containerHeight / height
    const scale = Math.min(scaleX, scaleY)

    const scaledWidth = width * scale
    const scaledHeight = height * scale
    const offsetX = (containerWidth - scaledWidth) / 2
    const offsetY = (containerHeight - scaledHeight) / 2

    gsap.set(this.element, {
      width: width,
      height: height,
      x: offsetX,
      y: offsetY,
      scale: scale
    })

    this.emit('layoutUpdated', { scale, offsetX, offsetY })
    Logger.debug('Layout updated', { scale, offsetX, offsetY })
  }

  public destroy(): void {
    this.emit('stageDestroying', this)
    Logger.info('Stage destroying...')

    if (this.resizeTimer !== null) {
      cancelAnimationFrame(this.resizeTimer)
      this.resizeTimer = null
    }

    this.resizeObserver.disconnect()

    super.destroy()

    this.emit('stageDestroyed', this)
    Logger.info('Stage destroyed')
  }
}

