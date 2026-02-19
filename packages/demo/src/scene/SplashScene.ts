import { MainMenuScene } from './MainMenuScene';
import { SceneNode, type SceneNodeProps } from './SceneNode';
import { SceneManager } from '../manager/SceneManager';
import { TextNode } from '../ui/components/TextNode';

export class SplashScene extends SceneNode {
  constructor(props: SceneNodeProps) {
    super(props);

    this.set({ backgroundColor: '#f2f2f2' });

    const tip = new TextNode({
      id: 'tip',
      data: { text: 'Press Any Key To Start' },
      tween: {
        x: this.stage.data.width / 2,
        y: this.stage.data.height - 100,
        width: 400,
        xPercent: -50,
        fontSize: '32px',
        color: '#333',
        opacity: 0
      },
    });
    this.addNode(tip);

    tip.to({
      opacity: 0.5,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }

  async onStart() {
    await this.waitClick(
      this.stage,
      () => {
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
        silentAudio.play();
        silentAudio.remove();
        return false;
      }
    );

    SceneManager.instance.switch(MainMenuScene, { id: 'main-menu' });
  }

  async onEnd() { }
}