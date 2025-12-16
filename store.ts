import { create } from 'zustand';
import { AppState, PhotoData, HandGesture } from './types';
import { MathUtils } from 'three';

interface AppStore {
  mode: AppState;
  setMode: (mode: AppState) => void;
  
  photos: PhotoData[];
  addPhoto: (url: string) => void;
  removePhoto: (id: string) => void;
  focusedPhotoId: string | null;
  setFocusedPhotoId: (id: string | null) => void;

  gesture: HandGesture;
  setGesture: (gesture: HandGesture) => void;

  cameraRotationTarget: number;
  setCameraRotationTarget: (val: number) => void;
  
  isCameraReady: boolean;
  setCameraReady: (ready: boolean) => void;
}

export const useStore = create<AppStore>((set, get) => ({
  mode: AppState.ASSEMBLED,
  setMode: (mode) => set({ mode }),

  photos: [],
  addPhoto: (url) => {
    const currentPhotos = get().photos;
    // Calculate a random position in the cone for the tree state
    const theta = Math.random() * Math.PI * 2;
    const y = MathUtils.randFloat(-3, 3);
    const radiusAtY = 3.5 - (y + 3) * 0.45; // Cone shape logic
    const r = MathUtils.randFloat(radiusAtY * 0.5, radiusAtY); // Distribute inside
    
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);

    const newPhoto: PhotoData = {
      id: MathUtils.generateUUID(),
      url,
      position: [x, y, z],
      scatterPosition: [
        MathUtils.randFloat(-8, 8),
        MathUtils.randFloat(-5, 8),
        MathUtils.randFloat(-5, 5)
      ],
      rotation: [0, theta - Math.PI / 2, 0] // Face outward roughly
    };

    set({ photos: [...currentPhotos, newPhoto] });
  },
  removePhoto: (id) => set((state) => ({ photos: state.photos.filter(p => p.id !== id) })),
  
  focusedPhotoId: null,
  setFocusedPhotoId: (id) => set({ focusedPhotoId: id }),

  gesture: {
    isFist: false,
    isOpenPalm: false,
    isPinching: false,
    handPosition: { x: 0, y: 0 }
  },
  setGesture: (gesture) => set({ gesture }),

  cameraRotationTarget: 0,
  setCameraRotationTarget: (val) => set({ cameraRotationTarget: val }),

  isCameraReady: false,
  setCameraReady: (ready) => set({ isCameraReady: ready })
}));
