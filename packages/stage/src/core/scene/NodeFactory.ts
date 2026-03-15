import { DomNode } from '../dom/DomNode'
import { PixiNode } from '../pixi/PixiNode'
import { Node2D, type NodeProps } from '../base/Node2D'
import { Logger } from '../../utils/Logger'

export type NodeConstructor = new (props: NodeProps) => Node2D

export class NodeFactory {
  private static _domRegistry = new Map<string, NodeConstructor>()
  private static _pixiRegistry = new Map<string, NodeConstructor>()

  public static registerNode(
    type: string,
    nodeClass: NodeConstructor,
    renderer: 'dom' | 'pixi' = 'dom'
  ): void {
    switch (renderer) {
      case 'dom':
        if (!(nodeClass.prototype instanceof DomNode)) {
          Logger.warn(`Registering DOM node ${type} but class does not extend DomNode`)
        }
        this._domRegistry.set(type, nodeClass)
        break
      case 'pixi':
        if (!(nodeClass.prototype instanceof PixiNode)) {
          Logger.warn(`Registering Pixi node ${type} but class does not extend PixiNode`)
        }
        this._pixiRegistry.set(type, nodeClass)
        break
    }
    Logger.info(`Node registered: [${renderer}] ${type}`)
  }

  public static createNode(schema: NodeProps<Record<string, unknown>>): Node2D {
    const renderer = schema.renderer || 'dom'
    let NodeClass: NodeConstructor | undefined

    switch (renderer) {
      case 'dom':
        NodeClass = this._domRegistry.get(schema.type)
        if (!NodeClass)
          NodeClass = DomNode as unknown as NodeConstructor
        break
      case 'pixi':
        NodeClass = this._pixiRegistry.get(schema.type)
        if (!NodeClass)
          NodeClass = PixiNode as unknown as NodeConstructor
        break
    }

    return new NodeClass(schema)
  }
}

