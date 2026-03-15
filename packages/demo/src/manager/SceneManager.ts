import { type Node2D, type Stage, DomNode } from "tiny-stage";
import type { SceneNode, SceneNodeProps } from "../scene/SceneNode";

export class SceneManager {
  private static _instance: SceneManager;
  private currentScene: SceneNode | null = null;
  private stage: Stage;
  private container: Node2D;

  constructor(stage: Stage, container: Node2D) {
    this.stage = stage;
    this.container = container;
    SceneManager._instance = this;
  }

  static get instance() { return this._instance; }

  async switch<T extends SceneNode, P extends SceneNodeProps>(
    SceneClass: new (props: P) => T,
    props: Omit<P, 'stage' | 'container'>
  ) {
    const oldScene = this.currentScene;
    const newScene = new SceneClass({
      ...props,
      stage: this.stage,
      renderer: 'dom'
    } as unknown as P);

    this.container.addNode(newScene);
    this.currentScene = newScene;

    if (oldScene) {
      if (oldScene instanceof DomNode) {
        oldScene.renderObject.style.pointerEvents = 'none';
      }

      oldScene.onEnd().then(() => {
        oldScene.destroy();
      });
    }

    newScene.onStart();
  }
}
