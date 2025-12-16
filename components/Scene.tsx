import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { Environment, OrbitControls, Sparkles, Stars } from '@react-three/drei';
import TreeParticles from './ChristmasTree';
import { useStore } from '../store';
import { AppState } from '../types';

const Scene: React.FC = () => {
  const { mode } = useStore();

  return (
    <div className="w-full h-screen bg-slate-900">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: false, toneMapping: 3 }} // ACESFilmic
      >
        <color attach="background" args={['#050810']} />
        
        <Suspense fallback={null}>
          <group position={[0, -1, 0]}>
            <TreeParticles />
          </group>
          
          {/* Ambient environment */}
          <Environment preset="night" />
          
          {/* Cinematic Lighting */}
          <ambientLight intensity={0.2} color="#0B3D2E" />
          <spotLight 
            position={[10, 10, 10]} 
            angle={0.5} 
            penumbra={1} 
            intensity={2} 
            color="#FFD700" 
            castShadow 
          />
          <pointLight position={[-5, -5, -5]} intensity={1} color="#C41E3A" />
          <pointLight position={[0, 0, 5]} intensity={0.5} color="#fff" />

          {/* Background FX */}
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.5} color="#D4AF37" />

          {/* Post Processing for Glow/Bloom */}
          <EffectComposer disableNormalPass>
            <Bloom 
                luminanceThreshold={0.5} 
                mipmapBlur 
                intensity={1.5} 
                radius={0.6}
            />
            <Noise opacity={0.05} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>

        <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 3}
            autoRotate={mode === AppState.ASSEMBLED}
            autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export default Scene;
