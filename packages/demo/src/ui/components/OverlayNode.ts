import { BaseNode, Stage, type BaseNodeProps } from "tiny-stage";

export interface OverlayNodeProps extends BaseNodeProps {
  stage: Stage;
}

export class OverlayNode extends BaseNode {
  protected stage: Stage

  constructor({ stage, ...props }: OverlayNodeProps) {
    super({
      ...props,
      type: 'overlay',
      tween: {
        width: stage.data.width,
        height: stage.data.height,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'none',
        opacity: 0,
        pointerEvents: 'auto',
        ...props.tween
      }
    });
    this.stage = stage;
  }

  async show() {
    this.set({ display: 'block' });
    await this.to({ opacity: 1, duration: 0.3 });
  }

  async hide() {
    await this.to({ opacity: 0, duration: 0.3 });
    this.set({ display: 'none' });
  }
}