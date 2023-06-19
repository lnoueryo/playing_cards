// AxiosResponse型をインポートします
import { WebsocketConnector } from './websocket';
import { rules, validate } from './rules';
import { AxiosResponse } from 'axios';
import * as THREE from 'three';

// Promise<any>を返す非同期関数を表す型を定義します
type AsyncFunction = () => Promise<any>;
export const handleAsync = async(handler: AsyncFunction): Promise<any | AxiosResponse<any> | undefined> => {
  try {
    return await handler();
  } catch (error: any) {
    return error.response
  }
}

export const createTable = () => {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load('/static/images/wood.jpg', function(texture: any) {
      // const tableGeometry = new THREE.CylinderGeometry(75, 75, 0.01, 100);
      const tableGeometry = new THREE.BoxGeometry(100, 100, 70);
      const tableMaterial = new THREE.MeshPhongMaterial({map: texture}); // テクスチャ付きのマテリアル
      const table = new THREE.Mesh(tableGeometry, tableMaterial);
      resolve(table);
    }, undefined, function (error: any) {
      console.error('An error happened:', error);
      reject(error);
    });
  });
}

// レンダリング
export const renderAnimate = (table: any) => {
  const scene = new THREE.Scene();
  const width = Math.max(window.innerWidth, 1300);
  const height = Math.max(window.innerHeight, 665);
  // カメラの作成
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 100, 0);  // カメラの位置を修正
  camera.lookAt(0, 0, 0);  // カメラの注視点を修正

  // レンダラーの作成
  const renderer = new THREE.WebGLRenderer();
  console.log(window.innerWidth)
  renderer.setSize(window.innerWidth, window.innerHeight);
  const app = document.getElementById('app')
  app.appendChild(renderer.domElement);
  renderer.domElement.style.position = 'absolute'
  renderer.domElement.style.zIndex = '0'

  // ライトの作成
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  // テーブルの追加
  scene.add(table);

  // レンダリング
  const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
  window.addEventListener('resize', () => {
    const width = Math.max(window.innerWidth, 1300);
    const height = Math.max(window.innerHeight, 665);
  console.log(width)
    // アスペクト比を更新
    camera.aspect = width / height;
    // カメラの投影行列を更新
    camera.updateProjectionMatrix();
    // レンダラーのサイズを更新
    renderer.setSize(width, height);
  }, false);
}

export { WebsocketConnector, rules, validate }