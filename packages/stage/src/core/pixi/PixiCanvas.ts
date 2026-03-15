import * as PIXI from 'pixi.js'
import { gsap } from 'gsap'
import { PixiPlugin } from 'gsap/PixiPlugin'
import { DomNode } from '../dom/DomNode'
import { PixiNode } from './PixiNode'
import { Node2D, type NodeProps } from '../base/Node2D'

export class PixiCanvas extends DomNode<HTMLCanvasElement> {
  private _pixiApp: PIXI.Application | undefined = undefined
  private _rootContainer: PIXI.Container

  constructor(props: Omit<NodeProps, 'type' | 'tagName'>) {
    super({
      ...props,
      type: 'pixi-stage',
      tagName: 'canvas',
    })

    this._rootContainer = new PIXI.Container()
    this._initPixi()
  }

  private async _initPixi() {
    gsap.registerPlugin(PixiPlugin)
    PixiPlugin.registerPIXI(PIXI)

    this._pixiApp = new PIXI.Application()

    await this._pixiApp.init({
      canvas: this._element,
      width: this.transform.width ?? 1920,
      height: this.transform.height ?? 1080,
      backgroundAlpha: 0,
      autoStart: false,
    })

    gsap.ticker.add(this._renderPixi)
  }

  private _renderPixi = () => {
    if (this._isDestroyed || !this._pixiApp) {
      gsap.ticker.remove(this._renderPixi)
      return
    }
    this._pixiApp.renderer.render(this._rootContainer)
  }

  protected override _onChildAdded(node: Node2D<unknown>): void {
    if (node instanceof PixiNode) {
      this._rootContainer.addChild(node.renderObject)
    } else if (node instanceof DomNode) {
      super._onChildAdded(node)
    } else {
      console.error(`Cannot add node of type ${node.type} to PixiCanvas`)
    }
  }

  protected override _onChildRemoved(node: Node2D<unknown>): void {
    if (node instanceof PixiNode) {
      this._rootContainer.removeChild(node.renderObject)
    } else if (node instanceof DomNode) {
      super._onChildRemoved(node)
    } else {
      console.error(`Cannot remove node of type ${node.type} from PixiCanvas`)
    }
  }

  protected override _onDestroy(): void {
    gsap.ticker.remove(this._renderPixi)
    if (this._pixiApp) {
      this._pixiApp.destroy(true, { children: true, texture: true })
      this._pixiApp = undefined
    }
    super._onDestroy()
  }
}
