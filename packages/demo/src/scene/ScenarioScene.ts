import { BaseNode, ImageNode, TypewriterNode, VideoNode, type Tween } from "tiny-stage";
import { SceneNode, type SceneNodeProps } from "./SceneNode";

export type ScriptCommand =
  | { cmd: 'bg'; src: string; fade?: number }
  | { cmd: 'image'; id: string; src: string; tween?: Tween }
  | { cmd: 'image.to'; id: string; tween: Tween; wait?: boolean }
  | { cmd: 'say'; name: string; text: string; }
  | { cmd: 'bgm'; src: string; volume?: number; loop?: boolean; fade?: number }
  | { cmd: 'video'; src: string; skip?: boolean }
  | { cmd: 'wait'; time: number }
  | { cmd: 'exec'; func: () => Promise<void> | void };

export interface ScenarioSceneData {
  script: ScriptCommand[];
}

export interface ScenarioSceneProps extends SceneNodeProps<ScenarioSceneData> { }

export class ScenarioScene extends SceneNode<ScenarioSceneData> {
  protected dialogBox: BaseNode;
  protected typewriter: TypewriterNode;
  protected nameElement: HTMLElement;
  protected nameBox: BaseNode;

  constructor(props: ScenarioSceneProps) {
    super(props);

    const dialogBox = new BaseNode({
      id: 'dialog-box',
      tween: {
        x: this.stage.data.width / 2,
        bottom: 32,
        width: this.stage.data.width * 0.7,
        height: 240,
        backgroundColor: 'rgba(228, 228, 228, 0.8)',
        opacity: 0,
        zIndex: 10,
        xPercent: -50,
      }
    })
    this.addNode(dialogBox)

    const typewriter = new TypewriterNode({
      id: 'typewriter',
      tween: { top: 20, right: 40, bottom: 20, left: 40, fontSize: 32, letterSpacing: '4px', color: '#000000' }
    })
    dialogBox.addNode(typewriter)

    const nameBox = new BaseNode({
      id: 'name-box',
      tween: { x: 40, y: -40, width: 200, height: 50, backgroundColor: 'rgba(74, 85, 104, 0.9)' }
    })
    dialogBox.addNode(nameBox)

    const nameElement = document.createElement('div')
    nameElement.style.cssText = 'position:absolute; width:100%; height:100%; color:#fff; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:bold;'
    nameBox.element.appendChild(nameElement)

    this.nameElement = nameElement;
    this.dialogBox = dialogBox;
    this.typewriter = typewriter;
    this.nameBox = nameBox;
  }

  async onStart() {
    await this.runScript();
  }

  async onEnd() { }

  private async runScript() {
    for (const cmd of this.data.script) {
      switch (cmd.cmd) {
        case 'bg':
          await this.execBg(cmd);
          break;
        case 'image':
          await this.execImage(cmd);
          break;
        case 'image.to':
          await this.execImageTo(cmd);
          break;
        case 'say':
          await this.execSay(cmd);
          break;
        case 'bgm':
          this.bgm.play({ src: cmd.src, volume: cmd.volume ?? 1, fade: cmd.fade ?? 0, loop: cmd.loop ?? true });
          break;
        case 'video':
          await this.execVideo(cmd);
          break;
        case 'wait':
          await new Promise(r => setTimeout(r, cmd.time));
          break;
        case 'exec':
          if (cmd.func) await cmd.func();
          break;
      }
    }
  }

  private async execBg(cmd: { src: string, fade?: number }) {
    let bg = this.findImage('bg');
    if (!bg) {
      bg = this.createImage('bg', cmd.src, { width: this.stage.data.width, height: this.stage.data.height, opacity: 0 });
    }
    await bg.to({ opacity: 1, duration: cmd.fade ?? 1 });
  }

  private async execImage(cmd: { id: string, src: string, tween?: Tween }) {
    let image = this.findImage(cmd.id);
    if (!image) {
      const defaultTween = {
        x: this.stage.data.width / 2,
        y: this.stage.data.height / 2,
        xPercent: -50,
        yPercent: -50,
        ...cmd.tween
      };
      this.createImage(cmd.id, cmd.src, defaultTween);
    } else {
      if (cmd.tween) await image.to(cmd.tween);
    }
  }

  private async execImageTo(cmd: { id: string, tween: Tween, wait?: boolean }) {
    const image = this.findImage(cmd.id);
    if (image) {
      const anim = image.to(cmd.tween);
      if (cmd.wait) await anim;
    }
  }

  private async execSay(cmd: { name: string, text: string, voice?: string }) {
    if (this.dialogBox.element.style.opacity === '0') {
      await this.dialogBox.to({ opacity: 1, duration: 0.3 });
    }

    this.nameElement.textContent = cmd.name;
    this.nameBox.to({ opacity: cmd.name ? 1 : 0, duration: 0.2 }); // 没名字时隐藏名字框

    // 3. 播放打字机
    this.typewriter.play(cmd.text, {
      speed: 0.05,
      // onChar: (char) => { /* 播放打字音效 */ }
    });

    await this.waitClick(this, () => {
      if (this.typewriter.isTypingActive()) {
        this.typewriter.skip();
        return true;
      }
      return false;
    });
  }

  private async execVideo(cmd: { src: string, skip?: boolean }) {
    const videoNode = new VideoNode({
      id: 'video-overlay',
      data: { src: cmd.src },
      tween: {
        width: this.stage.data.width,
        height: this.stage.data.height,
        opacity: 0,
        zIndex: 999,
        backgroundColor: '#000',
      }
    });
    this.addNode(videoNode);

    await videoNode.to({ opacity: 1, duration: 0.5 });

    const playPromise = videoNode.waitEnded();

    if (cmd.skip) {
      await Promise.race([playPromise, this.waitClick()]);
    } else {
      await playPromise;
    }

    await videoNode.to({ opacity: 0, duration: 0.5 });
    videoNode.destroy();
  }

  private createImage(id: string, src: string, tween: Tween) {
    const node = new ImageNode({ id, data: { src }, tween });
    this.camera.addNode(node);
    return node;
  }

  private findImage(id: string): BaseNode | undefined {
    return (this.camera as any)._children.find((c: any) => c.id === id);
  }
}