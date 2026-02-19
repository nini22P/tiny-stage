import { BaseNode, Stage } from "tiny-stage";
import { SettingsOverlay } from "../ui/overlays/SettingsOverlay";
import { ConfirmOverlay } from '../ui/overlays/ConfirmOverlay';

export class UIManager {
  private static _instance: UIManager;

  public settings: SettingsOverlay;
  public confirm: ConfirmOverlay;

  private stage: Stage;
  private container: BaseNode;

  constructor(stage: Stage, container: BaseNode) {
    this.stage = stage;
    this.container = container;

    this.settings = new SettingsOverlay({ id: 'settings-overlay', stage: this.stage });
    this.confirm = new ConfirmOverlay({ id: 'confirm-overlay', stage: this.stage });

    this.container
      .addNode(this.settings)
      .addNode(this.confirm);

    UIManager._instance = this;
  }

  public static get instance() { return this._instance; }

  public static show(name: 'settings' | 'confirm') {
    this._instance[name].show();
  }

  public static hide(name: 'settings' | 'confirm') {
    this._instance[name].hide();
  }

  public static async confirm(text: string): Promise<boolean> {
    return await this._instance.confirm.ask(text);
  }
}