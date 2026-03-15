import { DomNode, BgmNode, SfxNode, DomImageNode, SceneTree, type NodeProps } from 'tiny-stage'
import type { ScriptTransform } from './ScenarioScene'

export interface SceneNodeProps<TData = any> extends Omit<NodeProps<TData>, 'type' | 'renderer'> {
  sceneTree: SceneTree;
}

export abstract class SceneNode<TData = any> extends DomNode<HTMLElement, TData> {
  protected camera: DomNode
  protected bgm: BgmNode
  protected sfx: SfxNode
  protected sceneTree: SceneTree

  constructor(props: SceneNodeProps<TData>) {
    const { sceneTree, ...rest } = props;
    super({
      ...rest,
      type: 'scene',
      transform: {
        width: sceneTree.data.width,
        height: sceneTree.data.height,
        ...rest.transform
      }
    });

    this.sceneTree = sceneTree;

    this.camera = new DomNode({
      id: `${props.id}-camera`,
      type: 'camera',
      transform: { width: this.sceneTree.data.width, height: this.sceneTree.data.height }
    });
    this.addNode(this.camera);

    this.bgm = new BgmNode({ id: `${props.id}-bgm` });
    this.sfx = new SfxNode({ id: `${props.id}-sfx` });

    this.addNode(this.bgm as any)
      .addNode(this.sfx as any);
  }

  abstract onStart(): Promise<void>;
  abstract onEnd(): Promise<void>;

  protected async waitClick(
    target: DomNode<any, any> | HTMLElement | SceneTree = this.sceneTree,
    callback?: () => boolean | void
  ): Promise<void> {
    const element = target instanceof DomNode ? target.renderObject : (target as any);
    return new Promise<void>(resolve => {
      const handler = (_event: MouseEvent | TouchEvent) => {
        if (callback?.() === true) return;
        element.removeEventListener('click', handler);
        element.removeEventListener('touchstart', (handler as any));
        resolve();
      };
      element.addEventListener('click', handler);
      element.addEventListener('touchstart', (handler as any), { passive: false });
    });
  }

  protected addImage(
    { id, src, target = this.camera, transform }
      : { id: string, src: string, target?: DomNode, transform?: ScriptTransform }
  ): DomImageNode {
    const node = new DomImageNode({
      id,
      renderer: 'dom',
      data: { src },
      transform: {
        x: this.sceneTree.data.width / 2,
        y: this.sceneTree.data.height / 2,
        anchorX: 0.5,
        anchorY: 0.5,
        ...transform,
      }
    })
    target.addNode(node)
    return node
  }

  public override destroy(): void {
    super.destroy();
    this.bgm.destroy();
    this.sfx.destroy();
  }
}
