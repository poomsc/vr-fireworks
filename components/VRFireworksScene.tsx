'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Fireworks from './Fireworks';
import CameraBackground from './CameraBackground';
import { Suspense } from 'react';

function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.1} />

      {/* Fireworks */}
      <Suspense fallback={null}>
        <Fireworks />
      </Suspense>

      {/* Controls for desktop - allows rotation */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={5}
        maxDistance={50}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  );
}

export default function VRFireworksScene() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
      {/* Camera feed as background */}
      <CameraBackground />

      {/* 3D Canvas for fireworks */}
      <Canvas
        camera={{
          position: [0, 0, 15],
          fov: 75,
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
      >
        <Scene />
      </Canvas>

      {/* Instructions overlay */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontSize: '14px',
          textAlign: 'center',
          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
          pointerEvents: 'none',
          zIndex: 100,
        }}
      >
        🎆 VR Fireworks Experience 🎆
        <br />
        <span style={{ fontSize: '12px', opacity: 0.8 }}>
          Tap to allow camera • Drag to rotate view
        </span>
      </div>
    </div>
  );
}
