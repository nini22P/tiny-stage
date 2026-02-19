import { SplashScene } from './scene/SplashScene';
import { SceneManager } from './manager/SceneManager';
import './style.css'
import { Stage, BaseNode } from 'tiny-stage'
import { UIManager } from './manager/UIManager';
import CONFIG from './config/Config';

const run = async () => {
  const stage = new Stage({
    container: document.getElementById('app')!,
    id: 'root',
    tween: { backgroundColor: '#000' },
    data: CONFIG
  });

  const sceneContainer = new BaseNode({
    id: 'scene-container',
    tween: { width: stage.data.width, height: stage.data.height }
  });
  stage.addNode(sceneContainer);

  new SceneManager(stage, sceneContainer);

  const uiContainer = new BaseNode({
    id: 'ui-container',
    tween: { width: stage.data.width, height: stage.data.height, zIndex: 999, pointerEvents: 'none' }
  });
  stage.addNode(uiContainer);

  new UIManager(stage, uiContainer);

  SceneManager.instance.switch(SplashScene, { id: 'splash' });
};

run();