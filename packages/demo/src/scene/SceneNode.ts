import { BaseNode, BgmNode, SfxNode, ImageNode, type Tween, Stage, type BaseNodeProps } from 'tiny-stage'

export interface SceneNodeProps<TData = any> extends BaseNodeProps<TData> {
  stage: Stage;
}

export abstract class SceneNode<TData = any> extends BaseNode<HTMLElement, TData> {
  protected camera: BaseNode
  protected bgm: BgmNode
  protected sfx: SfxNode
  protected stage: Stage

  constructor({ stage, ...props }: SceneNodeProps<TData>) {
    super({
      ...props,
      type: 'scene',
      tween: {
        width: stage.data.width,
        height: stage.data.height,
        ...props.tween
      }
    });

    this.stage = stage;

    this.camera = new BaseNode({
      id: props.id,
      type: 'camera',
      tween: { width: this.stage.data.width, height: this.stage.data.height }
    });
    this.addNode(this.camera);

    this.bgm = new BgmNode({ id: props.id });
    this.sfx = new SfxNode({ id: props.id });

    this.addNode(this.bgm)
      .addNode(this.sfx);
  }

  abstract onStart(): Promise<void>;
  abstract onEnd(): Promise<void>;

  protected async waitClick(
    target: BaseNode<any, any> | HTMLElement = this.stage,
    callback?: () => boolean | void
  ): Promise<void> {
    const element = target instanceof BaseNode ? target.element : target;
    return new Promise<void>(resolve => {
      const handler = (_event: MouseEvent | TouchEvent) => {
        if (callback?.() === true) return;
        element.removeEventListener('click', handler);
        element.removeEventListener('touchstart', handler);
        resolve();
      };
      element.addEventListener('click', handler);
      element.addEventListener('touchstart', handler, { passive: false });
    });
  }

  protected addImage(
    { id, src, target = this.camera, tween }
      : { id: string, src: string, target?: BaseNode, tween?: Tween }
  ): ImageNode {
    const node = new ImageNode({
      id,
      data: { src },
      tween: {
        x: this.stage.data.width / 2,
        y: this.stage.data.height / 2,
        xPercent: -50,
        yPercent: -50,
        ...tween,
      }
    })
    target.addNode(node)
    return node
  }

  public override destroy(): void {
    super.destroy();
    this.camera.destroy();
    this.bgm.destroy();
    this.sfx.destroy();
  }
}