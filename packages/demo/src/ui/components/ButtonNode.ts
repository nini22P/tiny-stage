import { BaseNode, type BaseNodeProps } from 'tiny-stage'
import gsap from 'gsap'

export interface ButtonNodeData {
  text?: string;
}

export interface ButtonNodeProps extends BaseNodeProps<ButtonNodeData> {
  onClick: () => void;
}

export class ButtonNode extends BaseNode<HTMLElement, ButtonNodeData> {
  constructor(props: ButtonNodeProps) {
    const data: ButtonNodeData = {
      text: 'Button',
      ...props.data,
    };

    super({
      ...props,
      data,
      type: 'button',
      tween: {
        width: 300,
        height: 80,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        border: '2px solid #fff',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        cursor: 'pointer',
        userSelect: 'none',
        textContent: data.text,
        ...props.tween
      }
    });

    this.element.addEventListener('mouseenter', () => {
      this.to({ backgroundColor: 'rgba(0, 0, 0, 0.4)', scale: 1.05, duration: 0.2 });
    });

    this.element.addEventListener('mouseleave', () => {
      this.to({ backgroundColor: 'rgba(0, 0, 0, 0.2)', scale: 1, duration: 0.2 });
    });

    this.element.addEventListener('click', (e) => {
      e.stopPropagation();
      gsap.to(this.element, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
      props.onClick();
    });
  }
}