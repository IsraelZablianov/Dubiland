import React from 'react';
import { Composition } from 'remotion';

const Placeholder: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      background: '#FFF8E7',
      fontFamily: 'Rubik',
      direction: 'rtl',
    }}
  >
    <h1 style={{ fontSize: 80, color: '#5D3A1A' }}>🧸 דובילנד</h1>
  </div>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Placeholder"
      component={Placeholder}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
