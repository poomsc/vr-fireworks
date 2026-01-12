'use client';

import dynamic from 'next/dynamic';

const VRFireworksScene = dynamic(() => import('@/components/VRFireworksScene'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom, #0a0a1a, #1a0a2e)',
      color: 'white',
      fontSize: '24px',
    }}>
      Loading VR Fireworks...
    </div>
  ),
});

export default function Home() {
  return <VRFireworksScene />;
}
