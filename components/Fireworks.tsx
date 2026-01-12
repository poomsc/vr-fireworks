'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
  trail: THREE.Vector3[];
}

interface Firework {
  particles: Particle[];
  exploded: boolean;
  rocket: {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    color: THREE.Color;
  } | null;
}

const COLORS = [
  [255, 50, 50],    // Red
  [50, 150, 255],   // Blue
  [255, 200, 50],   // Gold
  [50, 255, 150],   // Green
  [255, 100, 255],  // Pink
  [255, 150, 50],   // Orange
  [150, 50, 255],   // Purple
  [50, 255, 255],   // Cyan
  [255, 255, 100],  // Yellow
];

function createFirework(x: number, targetY: number): Firework {
  const colorIndex = Math.floor(Math.random() * COLORS.length);
  const color = new THREE.Color(
    COLORS[colorIndex][0] / 255,
    COLORS[colorIndex][1] / 255,
    COLORS[colorIndex][2] / 255
  );

  return {
    particles: [],
    exploded: false,
    rocket: {
      position: new THREE.Vector3(x, -5, -10),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        targetY / 60 + Math.random() * 0.1,
        0
      ),
      color: color.clone(),
    },
  };
}

function explodeFirework(position: THREE.Vector3, color: THREE.Color): Particle[] {
  const particles: Particle[] = [];
  const particleCount = 200 + Math.random() * 200;
  const explosionType = Math.random();

  for (let i = 0; i < particleCount; i++) {
    let velocity: THREE.Vector3;

    if (explosionType < 0.3) {
      // Spherical explosion
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 0.3 + Math.random() * 0.4;
      velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      );
    } else if (explosionType < 0.6) {
      // Ring explosion
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 0.4 + Math.random() * 0.3;
      velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        (Math.random() - 0.5) * 0.2,
        Math.sin(angle) * speed
      );
    } else {
      // Willow explosion (drooping)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;
      const speed = 0.2 + Math.random() * 0.4;
      velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.abs(Math.cos(phi)) * speed,
        Math.sin(phi) * Math.sin(theta) * speed
      );
    }

    const hueShift = (Math.random() - 0.5) * 0.3;
    const particleColor = color.clone();
    particleColor.offsetHSL(hueShift, 0, 0);

    particles.push({
      position: position.clone(),
      velocity,
      color: particleColor,
      life: 1.0,
      maxLife: 1.0,
      size: 0.1 + Math.random() * 0.15,
      alpha: 1.0,
      trail: [],
    });
  }

  // Add sparkle particles
  for (let i = 0; i < 50; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const speed = 0.1 + Math.random() * 0.2;

    particles.push({
      position: position.clone(),
      velocity: new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      ),
      color: new THREE.Color(1, 1, 1),
      life: 1.0,
      maxLife: 1.0,
      size: 0.15 + Math.random() * 0.1,
      alpha: 1.0,
      trail: [],
    });
  }

  return particles;
}

export default function Fireworks() {
  const fireworksRef = useRef<Firework[]>([]);
  const pointsRef = useRef<THREE.Points>(null);
  const trailPointsRef = useRef<THREE.Points>(null);
  const rocketPointsRef = useRef<THREE.Points>(null);
  const lastLaunchTime = useRef(0);

  const maxParticles = 50000;
  const maxTrailPoints = 20000;
  const maxRockets = 20;

  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);
    const alphas = new Float32Array(maxParticles);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    return geometry;
  }, []);

  const trailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxTrailPoints * 3);
    const colors = new Float32Array(maxTrailPoints * 3);
    const alphas = new Float32Array(maxTrailPoints);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    return geometry;
  }, []);

  const rocketGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxRockets * 3);
    const colors = new Float32Array(maxRockets * 3);
    const sizes = new Float32Array(maxRockets);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return geometry;
  }, []);

  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        attribute float size;
        attribute float alpha;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float intensity = 1.0 - (dist * 2.0);
          intensity = pow(intensity, 2.0);

          gl_FragColor = vec4(vColor * intensity, vAlpha * intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  const trailMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        attribute float alpha;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 3.0 * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          gl_FragColor = vec4(vColor, vAlpha * 0.3);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  const rocketMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float intensity = 1.0 - (dist * 2.0);
          gl_FragColor = vec4(vColor * (1.0 + intensity), intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // Launch new fireworks
    if (time - lastLaunchTime.current > 0.3 + Math.random() * 0.5) {
      lastLaunchTime.current = time;
      const x = (Math.random() - 0.5) * 20;
      const targetY = 5 + Math.random() * 8;
      fireworksRef.current.push(createFirework(x, targetY));
    }

    const positions = particleGeometry.attributes.position.array as Float32Array;
    const colors = particleGeometry.attributes.color.array as Float32Array;
    const sizes = particleGeometry.attributes.size.array as Float32Array;
    const alphas = particleGeometry.attributes.alpha.array as Float32Array;

    const trailPositions = trailGeometry.attributes.position.array as Float32Array;
    const trailColors = trailGeometry.attributes.color.array as Float32Array;
    const trailAlphas = trailGeometry.attributes.alpha.array as Float32Array;

    const rocketPositions = rocketGeometry.attributes.position.array as Float32Array;
    const rocketColors = rocketGeometry.attributes.color.array as Float32Array;
    const rocketSizes = rocketGeometry.attributes.size.array as Float32Array;

    let particleIndex = 0;
    let trailIndex = 0;
    let rocketIndex = 0;

    // Update fireworks
    for (let i = fireworksRef.current.length - 1; i >= 0; i--) {
      const firework = fireworksRef.current[i];

      // Update rocket
      if (firework.rocket && !firework.exploded) {
        const rocket = firework.rocket;
        rocket.velocity.y -= 0.01; // Gravity
        rocket.position.add(rocket.velocity);

        // Draw rocket
        if (rocketIndex < maxRockets) {
          rocketPositions[rocketIndex * 3] = rocket.position.x;
          rocketPositions[rocketIndex * 3 + 1] = rocket.position.y;
          rocketPositions[rocketIndex * 3 + 2] = rocket.position.z;
          rocketColors[rocketIndex * 3] = rocket.color.r;
          rocketColors[rocketIndex * 3 + 1] = rocket.color.g;
          rocketColors[rocketIndex * 3 + 2] = rocket.color.b;
          rocketSizes[rocketIndex] = 8;
          rocketIndex++;
        }

        // Check if rocket should explode
        if (rocket.velocity.y < 0 || rocket.position.y > 15) {
          firework.exploded = true;
          firework.particles = explodeFirework(rocket.position, rocket.color);
          firework.rocket = null;
        }
      }

      // Update particles
      if (firework.exploded) {
        let aliveParticles = 0;

        for (const particle of firework.particles) {
          particle.life -= delta * 0.5;

          if (particle.life > 0) {
            aliveParticles++;

            // Update trail
            particle.trail.unshift(particle.position.clone());
            if (particle.trail.length > 5) {
              particle.trail.pop();
            }

            // Physics
            particle.velocity.y -= 0.008; // Gravity
            particle.velocity.multiplyScalar(0.98); // Air resistance
            particle.position.add(particle.velocity);

            // Update alpha based on life
            particle.alpha = particle.life / particle.maxLife;

            // Draw particle
            if (particleIndex < maxParticles) {
              positions[particleIndex * 3] = particle.position.x;
              positions[particleIndex * 3 + 1] = particle.position.y;
              positions[particleIndex * 3 + 2] = particle.position.z;
              colors[particleIndex * 3] = particle.color.r;
              colors[particleIndex * 3 + 1] = particle.color.g;
              colors[particleIndex * 3 + 2] = particle.color.b;
              sizes[particleIndex] = particle.size * 50;
              alphas[particleIndex] = particle.alpha;
              particleIndex++;
            }

            // Draw trail
            for (let t = 0; t < particle.trail.length && trailIndex < maxTrailPoints; t++) {
              const trailPos = particle.trail[t];
              const trailAlpha = particle.alpha * (1 - t / particle.trail.length);

              trailPositions[trailIndex * 3] = trailPos.x;
              trailPositions[trailIndex * 3 + 1] = trailPos.y;
              trailPositions[trailIndex * 3 + 2] = trailPos.z;
              trailColors[trailIndex * 3] = particle.color.r;
              trailColors[trailIndex * 3 + 1] = particle.color.g;
              trailColors[trailIndex * 3 + 2] = particle.color.b;
              trailAlphas[trailIndex] = trailAlpha;
              trailIndex++;
            }
          }
        }

        if (aliveParticles === 0) {
          fireworksRef.current.splice(i, 1);
        }
      }
    }

    // Clear unused particles
    for (let i = particleIndex; i < maxParticles; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      alphas[i] = 0;
    }

    for (let i = trailIndex; i < maxTrailPoints; i++) {
      trailPositions[i * 3] = 0;
      trailPositions[i * 3 + 1] = 0;
      trailPositions[i * 3 + 2] = 0;
      trailAlphas[i] = 0;
    }

    for (let i = rocketIndex; i < maxRockets; i++) {
      rocketPositions[i * 3] = 0;
      rocketPositions[i * 3 + 1] = 0;
      rocketPositions[i * 3 + 2] = 0;
      rocketSizes[i] = 0;
    }

    particleGeometry.attributes.position.needsUpdate = true;
    particleGeometry.attributes.color.needsUpdate = true;
    particleGeometry.attributes.size.needsUpdate = true;
    particleGeometry.attributes.alpha.needsUpdate = true;

    trailGeometry.attributes.position.needsUpdate = true;
    trailGeometry.attributes.color.needsUpdate = true;
    trailGeometry.attributes.alpha.needsUpdate = true;

    rocketGeometry.attributes.position.needsUpdate = true;
    rocketGeometry.attributes.color.needsUpdate = true;
    rocketGeometry.attributes.size.needsUpdate = true;
  });

  return (
    <>
      <points ref={trailPointsRef} geometry={trailGeometry} material={trailMaterial} />
      <points ref={pointsRef} geometry={particleGeometry} material={particleMaterial} />
      <points ref={rocketPointsRef} geometry={rocketGeometry} material={rocketMaterial} />
    </>
  );
}
