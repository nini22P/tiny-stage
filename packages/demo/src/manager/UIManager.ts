import { type Node2D, type SceneTree } from "tiny-stage";
import { SettingsOverlay } from "../ui/overlays/SettingsOverlay";
import { ConfirmOverlay } from '../ui/overlays/ConfirmOverlay';

export class UIManager {
  private static _instance: UIManager;

  public settings: SettingsOverlay;
  public confirm: ConfirmOverlay;

  private _sceneTree: SceneTree;
  private _container: Node2D;

  constructor(sceneTree: SceneTree, container: Node2D) {
    this._sceneTree = sceneTree;
    this._container = container;

    this.settings = new SettingsOverlay({
      id: 'settings-overlay',
      sceneTree: this._sceneTree,
    });
    this.confirm = new ConfirmOverlay({
      id: 'confirm-overlay',
      sceneTree: this._sceneTree,
    });

    this._container.addNode(this.settings);
    this._container.addNode(this.confirm);

    UIManager._instance = this;
  }

  public static get instance() { return this._instance; }

  public static show(name: 'settings' | 'confirm') {
    (this._instance as any)[name].show();
  }

  public static hide(name: 'settings' | 'confirm') {
    (this._instance as any)[name].hide();
  }

  public static async confirm(text: string): Promise<boolean> {
    return await this._instance.confirm.ask(text);
  }
}
