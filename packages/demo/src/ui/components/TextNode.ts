import { BaseNode, type BaseNodeProps } from 'tiny-stage'

export interface TextNodeData {
  text?: string;
}

export interface TextNodeProps extends BaseNodeProps<TextNodeData> { }

export class TextNode extends BaseNode<HTMLElement, TextNodeData> {
  constructor(props: TextNodeProps) {
    const data: TextNodeData = {
      text: 'Text',
      ...props.data,
    };

    super({
      ...props,
      data,
      type: 'text',
      tween: {
        width: 300,
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        color: '#fff',
        textContent: data.text,
        ...props.tween
      }
    });
  }
}