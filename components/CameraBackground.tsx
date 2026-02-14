'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface CameraBackgroundProps {
  onTextureReady?: (texture: THREE.VideoTexture) => void;
}

export default function CameraBackground({ onTextureReady }: CameraBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const textureRef = useRef<THREE.VideoTexture | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setupCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera API not supported on this device');
        }

        // iPhone-compatible constraints
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: 'environment', // Use back camera on mobile
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Critical for iPhone: set attributes before play
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('webkit-playsinline', 'true');
          videoRef.current.muted = true;
          videoRef.current.autoplay = true;

          // Wait for video to be ready
          await new Promise<void>((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play().then(() => {
                  resolve();
                }).catch((err) => {
                  console.error('Error playing video:', err);
                  resolve();
                });
              };
            }
          });

          // Create Three.js texture from video
          const texture = new THREE.VideoTexture(videoRef.current);
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.format = THREE.RGBAFormat;
          texture.colorSpace = THREE.SRGBColorSpace;

          textureRef.current = texture;

          if (onTextureReady) {
            onTextureReady(texture);
          }

          setIsLoading(false);
        }
      } catch (err: unknown) {
        console.error('Camera error:', err);

        let errorMessage = 'Unable to access camera';

        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            errorMessage = 'Camera access denied. Please allow camera access in your browser settings.';
          } else if (err.name === 'NotFoundError') {
            errorMessage = 'No camera found on this device.';
          } else if (err.name === 'NotReadableError') {
            errorMessage = 'Camera is already in use by another application.';
          } else if (err.name === 'SecurityError') {
            errorMessage = 'Camera access requires HTTPS or localhost.';
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        setIsLoading(false);
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (textureRef.current) {
        textureRef.current.dispose();
      }
    };
  }, [onTextureReady]);

  return (
    <>
      <video
        ref={videoRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -1,
        }}
        playsInline
        webkit-playsinline="true"
        muted
        autoPlay
      />

      {isLoading && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '18px',
          textAlign: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '20px',
          borderRadius: '10px',
          zIndex: 1000,
        }}>
          Requesting camera access...
        </div>
      )}

      {error && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '16px',
          textAlign: 'center',
          backgroundColor: 'rgba(255, 0, 0, 0.8)',
          padding: '20px',
          borderRadius: '10px',
          maxWidth: '80%',
          zIndex: 1000,
        }}>
          <strong>Camera Error:</strong><br />
          {error}
        </div>
      )}
    </>
  );
}
