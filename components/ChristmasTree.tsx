import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Instances, Instance, Float, Text, Image as DreiImage } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { AppState } from '../types';

// Constants for aesthetics
const PARTICLE_COUNT = 450;
const GOLD_COLOR = new THREE.Color("#FFD700");
const RED_COLOR = new THREE.Color("#C41E3A");
const GREEN_COLOR = new THREE.Color("#0B3D2E");
const GLOW_COLOR = new THREE.Color("#FFFDD0");

const TreeParticles: React.FC = () => {
  const { mode, gesture, photos, focusedPhotoId, setFocusedPhotoId } = useStore();
  const groupRef = useRef<THREE.Group>(null);
  
  // Generate random particles (Ornaments/Leaves)
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const type = Math.random() > 0.8 ? 'sphere' : (Math.random() > 0.5 ? 'box' : 'cone');
      
      // Tree Cone Shape
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() * 7) - 3.5; // -3.5 to 3.5
      // Radius decreases as Y increases
      const maxR = 3.5 - (y + 3.5) * 0.45;
      const r = Math.sqrt(Math.random()) * maxR; // Uniform distribution in disk
      
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      
      // Scatter Position
      const sx = (Math.random() - 0.5) * 15;
      const sy = (Math.random() - 0.5) * 10;
      const sz = (Math.random() - 0.5) * 10;

      // Color selection
      let color = GREEN_COLOR;
      if (Math.random() > 0.6) color = GOLD_COLOR;
      if (Math.random() > 0.85) color = RED_COLOR;

      temp.push({
        id: i,
        type,
        color,
        posAssembled: new THREE.Vector3(x, y, z),
        posScattered: new THREE.Vector3(sx, sy, sz),
        scale: Math.random() * 0.15 + 0.05,
        rotationSpeed: Math.random() * 0.02
      });
    }
    return temp;
  }, []);

  // Frame Loop: Animation & Transitions
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth Rotate based on hand input or auto-rotate
    const targetRotY = mode === AppState.SCATTERED 
        ? useStore.getState().cameraRotationTarget * 0.5 
        : state.clock.elapsedTime * 0.1;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y, 
        targetRotY, 
        delta * 2
    );
  });

  return (
    <group ref={groupRef}>
      {/* 1. The main Particles (Instanced would be better for perf, but using primitives for simplicity of different geometries/colors here) 
          Actually, let's group by Geometry for Instances to show best practice */}
      
      <ParticleGroup particles={particles.filter(p => p.type === 'sphere')} geometry={<sphereGeometry args={[1, 16, 16]} />} mode={mode} />
      <ParticleGroup particles={particles.filter(p => p.type === 'box')} geometry={<boxGeometry args={[1, 1, 1]} />} mode={mode} />
      <ParticleGroup particles={particles.filter(p => p.type === 'cone')} geometry={<coneGeometry args={[1, 2, 4]} />} mode={mode} />

      {/* 2. Photo Cloud */}
      {photos.map((photo) => (
        <PhotoFrame 
          key={photo.id} 
          photo={photo} 
          mode={mode} 
          isFocused={focusedPhotoId === photo.id}
        />
      ))}
      
      {/* 3. Star at the top */}
      <mesh position={[0, 4, 0]}>
         <octahedronGeometry args={[0.5, 0]} />
         <meshStandardMaterial color="#FFD700" emissive="#FFA500" emissiveIntensity={2} />
      </mesh>
    </group>
  );
};

// Helper component for instanced particles to handle transitions
const ParticleGroup: React.FC<{ particles: any[], geometry: React.ReactNode, mode: AppState }> = ({ particles, geometry, mode }) => {
    return (
        <Instances range={particles.length}>
            {geometry}
            <meshStandardMaterial roughness={0.4} metalness={0.6} />
            {particles.map((p, i) => (
                <ParticleInstance key={i} data={p} mode={mode} />
            ))}
        </Instances>
    )
}

const ParticleInstance: React.FC<{ data: any, mode: AppState }> = ({ data, mode }) => {
    const ref = useRef<any>(null);
    const { posAssembled, posScattered, color, scale, rotationSpeed } = data;

    useFrame((state, delta) => {
        if (!ref.current) return;
        
        // Target Position
        const target = mode === AppState.ASSEMBLED ? posAssembled : posScattered;
        
        // Lerp Position
        ref.current.position.lerp(target, delta * (mode === AppState.ASSEMBLED ? 3 : 1.5));
        
        // Rotate
        ref.current.rotation.x += rotationSpeed;
        ref.current.rotation.y += rotationSpeed;

        // Scale Transition (slight pulse when scattered)
        const targetScale = mode === AppState.ASSEMBLED ? scale : scale * 1.5;
        ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 2);

        // Color update (Standard material color needs to be set on instance)
        ref.current.color.set(color);
    });

    return <Instance ref={ref} />;
}


const PhotoFrame: React.FC<{ photo: any, mode: AppState, isFocused: boolean }> = ({ photo, mode, isFocused }) => {
    const ref = useRef<THREE.Mesh>(null);
    const { gesture, setFocusedPhotoId, setMode } = useStore();
    const vec = new THREE.Vector3();

    useFrame((state, delta) => {
        if (!ref.current) return;
        
        let targetPos = mode === AppState.ASSEMBLED 
            ? new THREE.Vector3(...photo.position) 
            : new THREE.Vector3(...photo.scatterPosition);

        let targetScale = 0.8;
        let targetRot = new THREE.Euler(...photo.rotation);

        if (isFocused && mode === AppState.FOCUS) {
            // Bring to center front of camera
            // In a real app, calculate relative to camera. For now, fixed offset z
            targetPos = new THREE.Vector3(0, 0, 4); 
            targetScale = 3.5;
            targetRot = new THREE.Euler(0, 0, 0);
            
            // Look at camera
            ref.current.lookAt(state.camera.position);
        } else {
            // Floating effect
            targetPos.y += Math.sin(state.clock.elapsedTime + photo.id) * 0.05;
        }

        // Apply
        ref.current.position.lerp(targetPos, delta * 3);
        
        if (!isFocused) {
            // Only quaternion lerp if not looking at camera manually
            // Simplified: just lerp rotation values for this demo
             ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, targetRot.x, delta * 2);
             ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, targetRot.y, delta * 2);
             ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, targetRot.z, delta * 2);
        }
        
        ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), delta * 3);

        // Interaction Logic: Grabbing
        if (mode === AppState.SCATTERED && gesture.isPinching) {
            // Basic distance check to hand "cursor" in 3D is complex without raycasting.
            // Simplified: If this is the closest photo to the center of screen (where user looks), select it.
            // Or just a random one for demo if simplified.
            
            // Implementing Raycaster-like logic with Hand X/Y
            // Map Hand (-1 to 1) to Screen Space
            // If distance < threshold
            
            ref.current.updateMatrixWorld();
            vec.setFromMatrixPosition(ref.current.matrixWorld);
            vec.project(state.camera); // Project to NDC (-1 to 1)

            const dist = Math.hypot(vec.x - gesture.handPosition.x, vec.y - gesture.handPosition.y);
            
            if (dist < 0.2) { // Threshold for "touching"
                setFocusedPhotoId(photo.id);
                setMode(AppState.FOCUS);
            }
        }
    });

    return (
        <mesh ref={ref}>
            <planeGeometry args={[1, 1]} />
            <DreiImage url={photo.url} transparent side={THREE.DoubleSide} />
            <meshBasicMaterial transparent opacity={0} /> {/* Invisible container, Drei Image handles visuals */}
            
            {/* Gold Frame Border */}
            <mesh position={[0, 0, -0.01]}>
                <boxGeometry args={[1.1, 1.1, 0.05]} />
                <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
            </mesh>
        </mesh>
    );
};

export default TreeParticles;