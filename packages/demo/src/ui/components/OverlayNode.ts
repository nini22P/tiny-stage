import { DomNode, SceneTree, type NodeProps } from "tiny-stage";

export interface OverlayNodeProps extends Omit<NodeProps, 'type' | 'renderer'> {
  sceneTree: SceneTree;
}

export abstract class OverlayNode extends DomNode {
  protected sceneTree: SceneTree

  constructor(props: OverlayNodeProps) {
    const { sceneTree, ...rest } = props;
    super({
      ...rest,
      type: 'overlay',
      transform: {
        width: sceneTree.data.width,
        height: sceneTree.data.height,
        opacity: 0,
        zIndex: 100,
        ...rest.transform
      },
      dom: {
        styles: {
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'none',
          ...rest.dom?.styles
        }
      }
    });

    this.sceneTree = sceneTree;
  }


  async show() {
    this.renderObject.style.display = 'block';
    await this.to({ opacity: 1, duration: 0.3 } as any);
  }

  async hide() {
    await this.to({ opacity: 0, duration: 0.3 } as any);
    this.renderObject.style.display = 'none';
  }
}
