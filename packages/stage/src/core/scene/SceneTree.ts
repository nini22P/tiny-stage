import gsap from 'gsap'
import { Logger, LogLevel } from '../../utils/Logger'
import { Node2D, type NodeKeyframe, type NodeProps, type NodeTransform } from '../base/Node2D'
import { DomNode } from '../dom/DomNode'
import { NodeFactory, type NodeConstructor } from './NodeFactory'
import { SceneLoader } from './SceneLoader'

export interface SceneProps {
  id: string;
  config: SceneTreeConfig;
  nodes: NodeProps<Record<string, unknown>>[];
  animations?: Record<string, NodeKeyframe[]>;
}

export interface SceneTreeConfig {
  width: number;
  height: number;
  backgroundColor?: string;
  debug?: boolean;
}

export class SceneTree extends DomNode<HTMLElement, SceneTreeConfig> {
  private _loader = new SceneLoader()

  public static registerNode(
    type: string,
    nodeClass: NodeConstructor,
    renderer: 'dom' | 'pixi' = 'dom'
  ): void {
    NodeFactory.registerNode(type, nodeClass, renderer)
  }

  public container: HTMLElement
  private _resizeObserver: ResizeObserver
  private _resizeTimer: number | undefined = undefined

  constructor(
    props: {
      id: string;
      container: HTMLElement;
      data?: Partial<SceneTreeConfig>;
      transform?: NodeTransform;
    }) {
    const config: SceneTreeConfig = {
      width: 1920,
      height: 1080,
      debug: false,
      ...props.data,
    }

    super({
      id: props.id,
      type: 'scenetree',
      tagName: 'div',
      data: config,
      transform: {
        width: config.width,
        height: config.height,
        ...props.transform
      },
      dom: {
        styles: {
          overflow: 'hidden',
          userSelect: 'none',
          transformOrigin: '0 0',
          position: 'relative',
        }
      }
    })

    this.container = props.container
    this._loader.registerInternalNode(this as unknown as DomNode)

    if (config.debug) {
      Logger.setLevel(LogLevel.DEBUG)
    }

    this.container.appendChild(this._element)

    this._updateLayout()
    this._resizeObserver = new ResizeObserver(() => {
      if (this._resizeTimer !== undefined)
        cancelAnimationFrame(this._resizeTimer)
      this._resizeTimer = requestAnimationFrame(() => {
        this._updateLayout()
        this._resizeTimer = undefined
      })
    })
    this._resizeObserver.observe(this.container)

    Logger.info('SceneTree initialized', { size: `${config.width}x${config.height}` })
  }

  public load(scene: SceneProps): void {
    if (scene.config) {
      this.updateData(scene.config)
      if (scene.config.backgroundColor) {
        this._element.style.backgroundColor = scene.config.backgroundColor
      }
    }

    this._loader.load(scene.nodes, this as unknown as DomNode)
  }

  public findNodeById(id: string): Node2D | undefined {
    return this._loader.findNodeById(id)
  }

  private _updateLayout(): void {
    const container = this.container
    const { width, height } = this.data
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    const scale = Math.min(containerWidth / width, containerHeight / height)
    const offsetX = Math.round((containerWidth - width * scale) / 2)
    const offsetY = Math.round((containerHeight - height * scale) / 2)

    gsap.set(this._element, {
      x: offsetX,
      y: offsetY,
      scale: scale
    })

    this.transform.x = offsetX
    this.transform.y = offsetY
    this.transform.scaleX = scale
    this.transform.scaleY = scale
  }

  protected override _onDestroy(): void {
    Logger.info('SceneTree destroying...')
    if (this._resizeTimer !== undefined)
      cancelAnimationFrame(this._resizeTimer)
    this._resizeObserver.disconnect()
    this._loader.clear()
    super._onDestroy()
    Logger.info('SceneTree destroyed')
  }
}
