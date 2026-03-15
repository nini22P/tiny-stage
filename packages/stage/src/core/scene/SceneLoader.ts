import { type NodeProps, type Node2D } from '../base/Node2D'
import { NodeFactory } from './NodeFactory'
import { Logger } from '../../utils/Logger'

export class SceneLoader {
  private _allNodes = new Map<string, Node2D>()

  public load(
    sceneNodes: NodeProps[],
    parent: Node2D
  ): void {
    const startTime = performance.now()
    const seenIds = new Set<string>()
    seenIds.add(parent.id)

    this._reconcileNodes(sceneNodes, parent, seenIds)

    for (const [id, node] of this._allNodes.entries()) {
      if (!seenIds.has(id)) {
        node.destroy()
        this._allNodes.delete(id)
      }
    }

    const duration = performance.now() - startTime
    Logger.debug(`Scene applied in ${duration.toFixed(2)}ms, active nodes: ${this._allNodes.size}`)
  }

  private _reconcileNodes(
    schemas: NodeProps[],
    parent: Node2D,
    seenIds: Set<string>
  ): void {
    schemas.forEach(schema => {
      seenIds.add(schema.id)
      let node = this._allNodes.get(schema.id)

      if (node) {
        if (node.type !== schema.type) {
          node.destroy()
          node = NodeFactory.createNode(schema)
          parent.addNode(node)
          this._allNodes.set(node.id, node)
        } else {
          node.name = schema.name ?? schema.id
          if (schema.data) node.updateData(schema.data)
          if (schema.transform) node.set(schema.transform)

          if (node.getNode('..') !== parent) {
            parent.addNode(node)
          }
        }
      } else {
        node = NodeFactory.createNode(schema)
        parent.addNode(node)
        this._allNodes.set(node.id, node)
      }

      if (schema.children) {
        this._reconcileNodes(schema.children, node, seenIds)
      }
    })
  }

  public findNodeById(id: string): Node2D | undefined {
    return this._allNodes.get(id)
  }

  public registerInternalNode(node: Node2D) {
    this._allNodes.set(node.id, node)
  }

  public clear() {
    this._allNodes.clear()
  }
}
