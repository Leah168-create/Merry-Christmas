import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { useStore } from '../store';
import { AppState } from '../types';

const HandTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setGesture, setMode, mode, setCameraRotationTarget, setCameraReady } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        startWebcam();
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };

    const startWebcam = async () => {
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480, facingMode: "user" } 
        });
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predict);
        setCameraReady(true);
        setLoading(false);
      } catch (err) {
        console.error("Camera access denied:", err);
        setLoading(false);
      }
    };

    const predict = async () => {
      if (!videoRef.current || !handLandmarker) return;

      const startTimeMs = performance.now();
      if (videoRef.current.videoWidth > 0) { // Ensure video is ready
          const results = handLandmarker.detectForVideo(videoRef.current, startTimeMs);

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            
            // 1. Gesture Recognition Logic
            
            // Calculate distance between fingertips and wrist (landmark 0)
            const wrist = landmarks[0];
            const tips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky tips
            const tipsExtended = tips.every(idx => landmarks[idx].y < landmarks[idx - 2].y); // Simple check if fingers are up relative to knuckles
            
            // Calculate distance between Thumb tip (4) and Index tip (8)
            const pinchDist = Math.hypot(
                landmarks[4].x - landmarks[8].x,
                landmarks[4].y - landmarks[8].y
            );
            
            // Open Palm: Fingers extended and spread
            const isOpenPalm = tipsExtended && !isFist(landmarks);
            
            // Fist: Tips close to palm/knuckles
            const fistDetected = isFist(landmarks);

            // Pinch
            const isPinching = pinchDist < 0.05;

            // Hand Position (Normalized -1 to 1)
            // X needs to be inverted for mirroring effect
            const handX = (landmarks[9].x - 0.5) * -2; 
            const handY = (landmarks[9].y - 0.5) * -2;

            setGesture({
              isFist: fistDetected,
              isOpenPalm: isOpenPalm,
              isPinching,
              handPosition: { x: handX, y: handY }
            });

            // 2. State Mapping
            if (fistDetected) {
                setMode(AppState.ASSEMBLED);
            } else if (isOpenPalm) {
                setMode(AppState.SCATTERED);
            }

            // 3. Rotation Logic (Only in scattered mode or assembled)
            // Map hand X movement to camera rotation
            // Smoothly update target
            setCameraRotationTarget(handX * Math.PI); 

          } else {
             // No hand detected
             setGesture({ isFist: false, isOpenPalm: false, isPinching: false, handPosition: {x:0, y:0} });
          }
      }

      animationFrameId = requestAnimationFrame(predict);
    };

    // Helper: Simple Fist detection
    const isFist = (landmarks: any[]) => {
        // Check if fingertips are below PIP joints (folded down)
        const tips = [8, 12, 16, 20];
        const pips = [6, 10, 14, 18];
        let foldedCount = 0;
        for(let i=0; i<4; i++) {
            if (landmarks[tips[i]].y > landmarks[pips[i]].y) foldedCount++;
        }
        return foldedCount >= 3;
    };

    setupMediaPipe();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (handLandmarker) handLandmarker.close();
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [setGesture, setMode, setCameraRotationTarget, setCameraReady]);

  return (
    <div className="absolute top-4 right-4 z-50 w-32 h-24 bg-black/50 rounded-lg overflow-hidden border border-amber-500/30 shadow-lg backdrop-blur-sm">
      <video
        ref={videoRef}
        className="w-full h-full object-cover transform scale-x-[-1]"
        autoPlay
        playsInline
        muted
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-amber-500 font-cinzel">
          Loading AI...
        </div>
      )}
      <div className="absolute bottom-0 w-full bg-black/60 text-[8px] text-center text-white p-0.5 font-sans">
        Hand Tracker
      </div>
    </div>
  );
};

export default HandTracker;
