import { OverlayNode, type OverlayNodeProps } from '../components/OverlayNode';
import { ButtonNode } from '../components/ButtonNode';
import { BaseNode } from 'tiny-stage';
import { TextNode } from '../components/TextNode';

export class ConfirmOverlay extends OverlayNode {
  private message: TextNode;
  private resolvePromise: ((value: boolean) => void) | null = null;

  constructor(props: OverlayNodeProps) {
    super(props);

    const panel = new BaseNode({
      id: 'confirm-panel',
      tween: {
        x: this.stage.data.width / 2,
        y: this.stage.data.height / 2,
        xPercent: -50,
        yPercent: -50,
        width: this.stage.data.width / 2,
        height: this.stage.data.width / 2 * 0.5,
        backgroundColor: '#2D3748',
        border: '2px solid #fff',
      }
    });
    this.addNode(panel);

    this.message = new TextNode({
      id: 'confirm-msg',
      data: { text: '确认文字内容' },
      tween: {
        color: '#fff',
        fontSize: 32,
        textAlign: 'center',
        y: 128,
        width: '100%',
        height: 72,
      }
    });
    panel.addNode(this.message);

    const cancelBtn = new ButtonNode({
      id: 'confirm-cancel',
      data: { text: '取消' },
      tween: { width: 180, height: 64, left: 256, bottom: 40 },
      onClick: () => this.handleResult(false)
    });
    const okBtn = new ButtonNode({
      id: 'confirm-ok',
      data: { text: '确定' },
      tween: { width: 180, height: 64, right: 256, bottom: 40 },
      onClick: () => this.handleResult(true)
    });

    panel.addNode(cancelBtn).addNode(okBtn);
  }

  public ask(text: string): Promise<boolean> {
    this.message.element.textContent = text;
    this.show();

    return new Promise((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  private handleResult(result: boolean) {
    if (this.resolvePromise) {
      this.resolvePromise(result);
      this.resolvePromise = null;
    }
    this.hide();
  }
}