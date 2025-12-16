import { Vector3 } from 'three';

export enum AppState {
  ASSEMBLED = 'ASSEMBLED',
  SCATTERED = 'SCATTERED',
  FOCUS = 'FOCUS',
}

export interface PhotoData {
  id: string;
  url: string;
  position: [number, number, number]; // Final tree position
  scatterPosition: [number, number, number]; // Random scatter position
  rotation: [number, number, number];
}

export interface HandGesture {
  isFist: boolean;
  isOpenPalm: boolean;
  isPinching: boolean;
  handPosition: { x: number; y: number }; // Normalized -1 to 1
}

export type ParticleType = 'sphere' | 'box' | 'cone';

export interface ParticleData {
  id: number;
  type: ParticleType;
  color: string;
  position: [number, number, number];
  scatterPosition: [number, number, number];
  scale: number;
}
