import gsap from 'gsap';
import { Logger } from '../utils/Logger';
import { EventEmitter } from '../utils/EventEmitter';

export interface BaseNodeProps {
  type?: string;
  id: string;
  tween: Partial<gsap.TweenVars>;
}

export class BaseNode extends EventEmitter {
  public container: HTMLElement;
  public id: string;

  private animationCount = 0;
  private isDestroyed = false;

  constructor({ type = 'base', id, tween }: BaseNodeProps) {
    super();
    this.id = id;
    this.container = document.createElement('div');
    this.container.id = `${type}:${id}`;
    this.container.style.position = 'absolute';
    this.container.style.transition = 'none';
    this.container.style.transformOrigin = 'center center';

    Logger.debug(`Node created: ${type}:${id}`);

    if (tween) {
      this.set(tween);
    }
  }

  public set(tween: Partial<gsap.TweenVars>): this {
    if (this.isDestroyed) {
      Logger.warn(`Attempting to set destroyed node: ${this.id}`);
      return this;
    }

    const {
      duration,
      zIndex,
      overflow,
      ...props
    } = tween;

    this.emit('beforeUpdate', tween);

    if (zIndex !== undefined) {
      this.container.style.zIndex = String(zIndex);
    }
    if (overflow !== undefined) {
      this.container.style.overflow = String(overflow);
    }

    gsap.set(this.container, props);
    this.emit('afterUpdate', tween);
    Logger.debug(`Node set: ${this.id}`, tween);

    return this;
  }

  public to(tween: Partial<gsap.TweenVars>): this {
    if (this.isDestroyed) {
      Logger.warn(`Attempting to animate destroyed node: ${this.id}`);
      return this;
    }

    const {
      id,
      type,
      duration,
      zIndex,
      overflow,
      ...props
    } = tween;

    this.emit('beforeUpdate', tween);
    this.enableWillChange();

    if (zIndex !== undefined) {
      this.container.style.zIndex = String(zIndex);
    }
    if (overflow !== undefined) {
      this.container.style.overflow = String(overflow);
    }

    gsap.to(this.container, {
      ...props,
      duration: duration,
      overwrite: 'auto',
      onStart: () => {
        this.emit('animationStart', tween);
      },
      onUpdate: () => {
        this.emit('animationUpdate', tween);
      },
      onComplete: () => {
        this.disableWillChange();
        this.emit('animationComplete', tween);
      },
      onInterrupt: () => {
        this.disableWillChange();
        this.emit('animationInterrupt', tween);
      }
    });

    this.emit('afterUpdate', tween);
    Logger.debug(`Node animated: ${this.id}`, tween);

    return this;
  }

  public addNode(node: BaseNode): this {
    this.container.appendChild(node.container);
    Logger.debug(`Node added: ${node.id} to ${this.id}`);
    return this;
  }

  public removeNode(node: BaseNode): this {
    if (node.container.parentElement === this.container) {
      this.container.removeChild(node.container);
      Logger.debug(`Node removed: ${node.id} from ${this.id}`);
    }
    return this;
  }

  private enableWillChange(): void {
    if (this.animationCount === 0) {
      this.container.style.willChange = 'transform, opacity';
    }
    this.animationCount++;
  }

  private disableWillChange(): void {
    this.animationCount--;
    if (this.animationCount <= 0) {
      this.animationCount = 0;
      this.container.style.willChange = 'auto';
    }
  }

  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.emit('beforeDestroy');

    gsap.killTweensOf(this.container);

    this.container.remove();

    this.clear();

    this.isDestroyed = true;
    Logger.debug(`Node destroyed: ${this.id}`);
  }

  public getIsDestroyed(): boolean {
    return this.isDestroyed;
  }
}