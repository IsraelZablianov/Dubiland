import type { CSSProperties, ReactNode, SVGProps } from 'react';

export type FamilyScene = 'soccer' | 'highfive' | 'celebrate';

interface FamilyIllustrationProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  scene?: FamilyScene;
  size?: number | string;
}

function SoccerScene() {
  return (
    <g>
      {/* Sky gradient background */}
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#87CEEB" />
          <stop offset="100%" stopColor="#E0F4FF" />
        </linearGradient>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7BC67E" />
          <stop offset="100%" stopColor="#5AAE5D" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFE566" />
          <stop offset="100%" stopColor="#FFD700" />
        </radialGradient>
      </defs>

      <rect width="400" height="300" rx="20" fill="url(#sky)" />
      {/* Sun */}
      <circle cx="340" cy="55" r="32" fill="url(#sun)" opacity="0.9">
        <animate attributeName="r" values="32;34;32" dur="3s" repeatCount="indefinite" />
      </circle>
      {/* Sun rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1={340 + 38 * Math.cos((angle * Math.PI) / 180)}
          y1={55 + 38 * Math.sin((angle * Math.PI) / 180)}
          x2={340 + 48 * Math.cos((angle * Math.PI) / 180)}
          y2={55 + 48 * Math.sin((angle * Math.PI) / 180)}
          stroke="#FFD700"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        >
          <animate attributeName="opacity" values="0.6;0.3;0.6" dur="2s" repeatCount="indefinite" />
        </line>
      ))}

      {/* Clouds */}
      <g opacity="0.7">
        <ellipse cx="80" cy="45" rx="30" ry="14" fill="white" />
        <ellipse cx="100" cy="40" rx="24" ry="12" fill="white" />
        <ellipse cx="65" cy="42" rx="20" ry="10" fill="white" />
      </g>
      <g opacity="0.5">
        <ellipse cx="230" cy="65" rx="22" ry="10" fill="white" />
        <ellipse cx="248" cy="60" rx="18" ry="9" fill="white" />
      </g>

      {/* Ground / grass */}
      <rect x="0" y="200" width="400" height="100" rx="0" fill="url(#grass)" />
      <path d="M0 200 Q50 195 100 200 Q150 205 200 200 Q250 195 300 200 Q350 205 400 200 V300 H0 Z" fill="url(#grass)" />

      {/* Grass blades */}
      {[30, 70, 120, 160, 220, 260, 310, 350].map((x) => (
        <g key={x}>
          <path d={`M${x} 210 Q${x - 3} 200 ${x - 1} 195`} stroke="#4A9E4D" strokeWidth="1.5" fill="none" />
          <path d={`M${x + 6} 212 Q${x + 8} 202 ${x + 5} 197`} stroke="#4A9E4D" strokeWidth="1.5" fill="none" />
        </g>
      ))}

      {/* === Older boy (Yehonatan, 6) - LEFT side, taller === */}
      <g transform="translate(110, 120)">
        {/* Shadow */}
        <ellipse cx="0" cy="92" rx="22" ry="5" fill="rgba(0,0,0,0.1)" />

        {/* Body / shirt (blue) */}
        <rect x="-16" y="30" width="32" height="38" rx="8" fill="#4A90D9" />
        <rect x="-16" y="30" width="32" height="12" rx="8" fill="#5BA0E9" />
        {/* Shirt number */}
        <text x="0" y="55" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="sans-serif">6</text>

        {/* Shorts */}
        <rect x="-14" y="64" width="12" height="16" rx="4" fill="#2C3E50" />
        <rect x="2" y="64" width="12" height="16" rx="4" fill="#2C3E50" />

        {/* Left leg + shoe */}
        <rect x="-10" y="78" width="6" height="10" rx="2" fill="#F5CBA7" />
        <rect x="-12" y="86" width="10" height="5" rx="2.5" fill="#E74C3C" />

        {/* Right leg (kicking) + shoe */}
        <g>
          <rect x="4" y="76" width="6" height="12" rx="2" fill="#F5CBA7" transform="rotate(-25, 7, 76)" />
          <rect x="2" y="84" width="10" height="5" rx="2.5" fill="#E74C3C" transform="rotate(-25, 7, 84)">
            <animateTransform attributeName="transform" type="rotate" values="-25 7 84;-15 7 84;-25 7 84" dur="1.5s" repeatCount="indefinite" />
          </rect>
          <animateTransform attributeName="transform" type="rotate" values="0 7 76;-8 7 76;0 7 76" dur="1.5s" repeatCount="indefinite" />
        </g>

        {/* Arms */}
        <rect x="-22" y="32" width="8" height="22" rx="4" fill="#F5CBA7" transform="rotate(15, -18, 32)" />
        <rect x="14" y="32" width="8" height="22" rx="4" fill="#F5CBA7" transform="rotate(-20, 18, 32)" />

        {/* Head */}
        <circle cx="0" cy="18" r="18" fill="#FDDCB5" />
        {/* Hair (dark brown) */}
        <ellipse cx="0" cy="6" rx="17" ry="10" fill="#5D4037" />
        <path d="M-15 10 Q-17 5 -14 2 Q-5 -4 5 -3 Q15 -2 17 5 Q18 10 15 12" fill="#5D4037" />
        {/* Eyes */}
        <circle cx="-6" cy="18" r="2.5" fill="#4A3728" />
        <circle cx="6" cy="18" r="2.5" fill="#4A3728" />
        <circle cx="-5" cy="17" r="1" fill="white" />
        <circle cx="7" cy="17" r="1" fill="white" />
        {/* Happy smile */}
        <path d="M-5 24 Q0 29 5 24" stroke="#C47B3B" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* Rosy cheeks */}
        <circle cx="-10" cy="22" r="3" fill="#FFB5B5" opacity="0.4" />
        <circle cx="10" cy="22" r="3" fill="#FFB5B5" opacity="0.4" />
      </g>

      {/* === Younger boy (Shai, 4, with glasses) - RIGHT side, shorter === */}
      <g transform="translate(250, 138)">
        {/* Shadow */}
        <ellipse cx="0" cy="78" rx="18" ry="4" fill="rgba(0,0,0,0.1)" />

        {/* Body / shirt (orange) */}
        <rect x="-14" y="26" width="28" height="32" rx="7" fill="#FF8C42" />
        <rect x="-14" y="26" width="28" height="10" rx="7" fill="#FFA05C" />
        {/* Shirt number */}
        <text x="0" y="48" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="sans-serif">4</text>

        {/* Shorts */}
        <rect x="-12" y="54" width="10" height="14" rx="4" fill="#2C3E50" />
        <rect x="2" y="54" width="10" height="14" rx="4" fill="#2C3E50" />

        {/* Legs + shoes */}
        <rect x="-8" y="66" width="5" height="9" rx="2" fill="#F5CBA7" />
        <rect x="-10" y="73" width="9" height="4.5" rx="2" fill="#3498DB" />
        <rect x="3" y="66" width="5" height="9" rx="2" fill="#F5CBA7" />
        <rect x="1" y="73" width="9" height="4.5" rx="2" fill="#3498DB" />

        {/* Arms (reaching up, excited!) */}
        <rect x="-20" y="26" width="7" height="20" rx="3.5" fill="#F5CBA7" transform="rotate(30, -16, 26)" />
        <rect x="13" y="26" width="7" height="20" rx="3.5" fill="#F5CBA7" transform="rotate(-35, 16, 26)">
          <animateTransform attributeName="transform" type="rotate" values="-35 16 26;-25 16 26;-35 16 26" dur="2s" repeatCount="indefinite" />
        </rect>

        {/* Head */}
        <circle cx="0" cy="14" r="16" fill="#FDDCB5" />
        {/* Hair (lighter brown / honey) */}
        <ellipse cx="0" cy="4" rx="15" ry="9" fill="#8B6914" />
        <path d="M-13 8 Q-15 3 -12 0 Q-4 -4 4 -3 Q13 -2 15 4 Q16 8 13 10" fill="#8B6914" />

        {/* === GLASSES === */}
        <rect x="-12" y="10" width="10" height="9" rx="4" fill="none" stroke="#4A4A4A" strokeWidth="1.8" />
        <rect x="2" y="10" width="10" height="9" rx="4" fill="none" stroke="#4A4A4A" strokeWidth="1.8" />
        <line x1="-2" y1="14" x2="2" y2="14" stroke="#4A4A4A" strokeWidth="1.5" />
        <line x1="-12" y1="14" x2="-15" y2="12" stroke="#4A4A4A" strokeWidth="1.5" />
        <line x1="12" y1="14" x2="15" y2="12" stroke="#4A4A4A" strokeWidth="1.5" />
        {/* Lens shine */}
        <ellipse cx="-8" cy="12" rx="2" ry="1.5" fill="rgba(255,255,255,0.3)" />
        <ellipse cx="6" cy="12" rx="2" ry="1.5" fill="rgba(255,255,255,0.3)" />

        {/* Eyes (behind glasses) */}
        <circle cx="-7" cy="15" r="2" fill="#4A3728" />
        <circle cx="7" cy="15" r="2" fill="#4A3728" />
        <circle cx="-6" cy="14" r="0.8" fill="white" />
        <circle cx="8" cy="14" r="0.8" fill="white" />

        {/* Big happy smile */}
        <path d="M-5 21 Q0 27 5 21" stroke="#C47B3B" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* Rosy cheeks */}
        <circle cx="-9" cy="19" r="2.5" fill="#FFB5B5" opacity="0.45" />
        <circle cx="9" cy="19" r="2.5" fill="#FFB5B5" opacity="0.45" />
      </g>

      {/* === Soccer ball between them === */}
      <g transform="translate(185, 218)">
        <circle cx="0" cy="0" r="11" fill="white" stroke="#333" strokeWidth="1" />
        {/* Pentagon pattern */}
        <polygon points="0,-5 4.8,-1.5 3,4.5 -3,4.5 -4.8,-1.5" fill="#333" />
        <polygon points="-5,-8 -1,-5 -5,-2" fill="#333" opacity="0.6" transform="scale(0.6) translate(0,-2)" />
        <polygon points="5,-8 1,-5 5,-2" fill="#333" opacity="0.6" transform="scale(0.6) translate(0,-2)" />
        <animate attributeName="transform" type="translate" values="185 218;188 217;185 218" dur="1.5s" repeatCount="indefinite" />
      </g>

      {/* Motion lines near the ball */}
      <g opacity="0.3">
        <line x1="170" y1="215" x2="165" y2="213" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="172" y1="220" x2="166" y2="220" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="171" y1="225" x2="166" y2="227" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Small flowers in the grass */}
      {[
        [40, 230],
        [330, 240],
        [180, 250],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x}, ${y})`}>
          <circle cx="0" cy="0" r="3" fill={['#FFD166', '#FF6B6B', '#C77DFF'][i]} />
          <circle cx="0" cy="0" r="1.2" fill="#FFE566" />
        </g>
      ))}
    </g>
  );
}

function HighFiveScene() {
  return (
    <g>
      <defs>
        <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFB347" />
          <stop offset="60%" stopColor="#FFCC80" />
          <stop offset="100%" stopColor="#FFF3E0" />
        </linearGradient>
        <linearGradient id="grass2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#81C784" />
          <stop offset="100%" stopColor="#66BB6A" />
        </linearGradient>
      </defs>

      <rect width="400" height="300" rx="20" fill="url(#sky2)" />

      {/* Sunset sun */}
      <circle cx="200" cy="100" r="50" fill="#FFE082" opacity="0.5" />
      <circle cx="200" cy="100" r="35" fill="#FFD54F" opacity="0.6" />

      {/* Ground */}
      <path d="M0 210 Q100 200 200 210 Q300 220 400 210 V300 H0 Z" fill="url(#grass2)" />

      {/* === Older boy - high five position === */}
      <g transform="translate(165, 128)">
        <ellipse cx="0" cy="92" rx="20" ry="4" fill="rgba(0,0,0,0.08)" />

        {/* Shirt (green) */}
        <rect x="-16" y="30" width="32" height="38" rx="8" fill="#66BB6A" />
        <text x="0" y="55" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="sans-serif">6</text>

        {/* Shorts */}
        <rect x="-14" y="64" width="12" height="16" rx="4" fill="#37474F" />
        <rect x="2" y="64" width="12" height="16" rx="4" fill="#37474F" />

        {/* Legs */}
        <rect x="-10" y="78" width="6" height="10" rx="2" fill="#F5CBA7" />
        <rect x="-12" y="86" width="10" height="5" rx="2.5" fill="white" />
        <rect x="4" y="78" width="6" height="10" rx="2" fill="#F5CBA7" />
        <rect x="2" y="86" width="10" height="5" rx="2.5" fill="white" />

        {/* Left arm (down) */}
        <rect x="-22" y="32" width="8" height="22" rx="4" fill="#F5CBA7" transform="rotate(10, -18, 32)" />

        {/* Head */}
        <circle cx="0" cy="18" r="18" fill="#FDDCB5" />
        <ellipse cx="0" cy="6" rx="17" ry="10" fill="#5D4037" />
        <path d="M-15 10 Q-17 5 -14 2 Q-5 -4 5 -3 Q15 -2 17 5 Q18 10 15 12" fill="#5D4037" />
        <circle cx="-6" cy="18" r="2.5" fill="#4A3728" />
        <circle cx="6" cy="18" r="2.5" fill="#4A3728" />
        <circle cx="-5" cy="17" r="1" fill="white" />
        <circle cx="7" cy="17" r="1" fill="white" />
        {/* Big open smile */}
        <path d="M-6 23 Q0 30 6 23" stroke="#C47B3B" strokeWidth="2" fill="#FF8A80" opacity="0.5" strokeLinecap="round" />
        <circle cx="-10" cy="22" r="3" fill="#FFB5B5" opacity="0.4" />
        <circle cx="10" cy="22" r="3" fill="#FFB5B5" opacity="0.4" />

        {/* Right arm (reaching for high five — drawn last so it renders on top) */}
        <rect x="14" y="22" width="8" height="24" rx="4" fill="#F5CBA7" transform="rotate(120, 18, 22)" />
      </g>

      {/* === Younger boy with glasses - high five position === */}
      <g transform="translate(235, 146)">
        <ellipse cx="0" cy="78" rx="16" ry="3.5" fill="rgba(0,0,0,0.08)" />

        {/* Shirt (yellow) */}
        <rect x="-14" y="26" width="28" height="32" rx="7" fill="#FFD54F" />
        <text x="0" y="48" textAnchor="middle" fill="#5D4037" fontSize="12" fontWeight="bold" fontFamily="sans-serif">4</text>

        {/* Shorts */}
        <rect x="-12" y="54" width="10" height="14" rx="4" fill="#37474F" />
        <rect x="2" y="54" width="10" height="14" rx="4" fill="#37474F" />

        {/* Legs */}
        <rect x="-8" y="66" width="5" height="9" rx="2" fill="#F5CBA7" />
        <rect x="-10" y="73" width="9" height="4.5" rx="2" fill="white" />
        <rect x="3" y="66" width="5" height="9" rx="2" fill="#F5CBA7" />
        <rect x="1" y="73" width="9" height="4.5" rx="2" fill="white" />

        {/* Right arm (down) */}
        <rect x="13" y="28" width="7" height="20" rx="3.5" fill="#F5CBA7" transform="rotate(-10, 16, 28)" />

        {/* Head */}
        <circle cx="0" cy="14" r="16" fill="#FDDCB5" />
        <ellipse cx="0" cy="4" rx="15" ry="9" fill="#8B6914" />
        <path d="M-13 8 Q-15 3 -12 0 Q-4 -4 4 -3 Q13 -2 15 4 Q16 8 13 10" fill="#8B6914" />

        {/* Glasses */}
        <rect x="-12" y="10" width="10" height="9" rx="4" fill="none" stroke="#4A4A4A" strokeWidth="1.8" />
        <rect x="2" y="10" width="10" height="9" rx="4" fill="none" stroke="#4A4A4A" strokeWidth="1.8" />
        <line x1="-2" y1="14" x2="2" y2="14" stroke="#4A4A4A" strokeWidth="1.5" />
        <line x1="-12" y1="14" x2="-15" y2="12" stroke="#4A4A4A" strokeWidth="1.5" />
        <line x1="12" y1="14" x2="15" y2="12" stroke="#4A4A4A" strokeWidth="1.5" />
        <ellipse cx="-8" cy="12" rx="2" ry="1.5" fill="rgba(255,255,255,0.3)" />
        <ellipse cx="6" cy="12" rx="2" ry="1.5" fill="rgba(255,255,255,0.3)" />

        <circle cx="-7" cy="15" r="2" fill="#4A3728" />
        <circle cx="7" cy="15" r="2" fill="#4A3728" />
        <circle cx="-6" cy="14" r="0.8" fill="white" />
        <circle cx="8" cy="14" r="0.8" fill="white" />
        <path d="M-5 21 Q0 27 5 21" stroke="#C47B3B" strokeWidth="2" fill="#FF8A80" opacity="0.5" strokeLinecap="round" />
        <circle cx="-9" cy="19" r="2.5" fill="#FFB5B5" opacity="0.45" />
        <circle cx="9" cy="19" r="2.5" fill="#FFB5B5" opacity="0.45" />

        {/* Left arm (reaching for high five — drawn last so it renders on top) */}
        <rect x="-20" y="18" width="7" height="22" rx="3.5" fill="#F5CBA7" transform="rotate(-135, -16, 18)" />
      </g>

      {/* High five sparkle */}
      <g transform="translate(203, 143)" opacity="0.8">
        <line x1="-6" y1="0" x2="6" y2="0" stroke="#FFD700" strokeWidth="2" strokeLinecap="round">
          <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
        </line>
        <line x1="0" y1="-6" x2="0" y2="6" stroke="#FFD700" strokeWidth="2" strokeLinecap="round">
          <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
        </line>
        <line x1="-4" y1="-4" x2="4" y2="4" stroke="#FFD700" strokeWidth="2" strokeLinecap="round">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="0.8s" repeatCount="indefinite" />
        </line>
        <line x1="4" y1="-4" x2="-4" y2="4" stroke="#FFD700" strokeWidth="2" strokeLinecap="round">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="0.8s" repeatCount="indefinite" />
        </line>
      </g>

      {/* Soccer ball on ground */}
      <g transform="translate(200, 240)">
        <circle cx="0" cy="0" r="10" fill="white" stroke="#333" strokeWidth="1" />
        <polygon points="0,-4.5 4.3,-1.4 2.7,4 -2.7,4 -4.3,-1.4" fill="#333" />
      </g>
    </g>
  );
}

function CelebrateScene() {
  return (
    <g>
      <defs>
        <linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#64B5F6" />
          <stop offset="100%" stopColor="#E3F2FD" />
        </linearGradient>
        <linearGradient id="grass3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#81C784" />
          <stop offset="100%" stopColor="#4CAF50" />
        </linearGradient>
      </defs>

      <rect width="400" height="300" rx="20" fill="url(#sky3)" />

      {/* Confetti */}
      {[
        { x: 50, y: 30, color: '#FF6B6B', delay: '0s' },
        { x: 100, y: 50, color: '#FFD166', delay: '0.3s' },
        { x: 150, y: 20, color: '#4ECDC4', delay: '0.1s' },
        { x: 210, y: 40, color: '#C77DFF', delay: '0.5s' },
        { x: 260, y: 25, color: '#FF8C42', delay: '0.2s' },
        { x: 310, y: 55, color: '#6BCB77', delay: '0.4s' },
        { x: 350, y: 30, color: '#FFD166', delay: '0.6s' },
        { x: 80, y: 70, color: '#C77DFF', delay: '0.15s' },
        { x: 180, y: 60, color: '#FF6B6B', delay: '0.35s' },
        { x: 330, y: 70, color: '#4ECDC4', delay: '0.45s' },
      ].map(({ x, y, color, delay }, i) => (
        <rect key={i} x={x} y={y} width="6" height="10" rx="1" fill={color} transform={`rotate(${i * 37}, ${x + 3}, ${y + 5})`}>
          <animate attributeName="y" values={`${y};${y + 180}`} dur="3s" begin={delay} repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0" dur="3s" begin={delay} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="rotate" values={`${i * 37} ${x + 3} ${y + 5};${i * 37 + 360} ${x + 3} ${y + 5}`} dur="3s" begin={delay} repeatCount="indefinite" />
        </rect>
      ))}

      {/* Ground */}
      <path d="M0 215 Q100 205 200 215 Q300 225 400 215 V300 H0 Z" fill="url(#grass3)" />

      {/* Goal posts (background) */}
      <rect x="140" y="130" width="6" height="80" rx="3" fill="white" opacity="0.7" />
      <rect x="254" y="130" width="6" height="80" rx="3" fill="white" opacity="0.7" />
      <rect x="140" y="128" width="120" height="6" rx="3" fill="white" opacity="0.7" />
      {/* Net */}
      <rect x="146" y="134" width="108" height="72" rx="2" fill="none" stroke="white" strokeWidth="0.8" strokeDasharray="8 4" opacity="0.4" />

      {/* === Older boy jumping and cheering === */}
      <g transform="translate(170, 115)">
        <ellipse cx="0" cy="100" rx="20" ry="4" fill="rgba(0,0,0,0.08)" />

        {/* Shirt (red) */}
        <rect x="-16" y="30" width="32" height="38" rx="8" fill="#EF5350" />
        <text x="0" y="55" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="sans-serif">6</text>

        {/* Shorts */}
        <rect x="-14" y="64" width="12" height="16" rx="4" fill="white" />
        <rect x="2" y="64" width="12" height="16" rx="4" fill="white" />

        {/* Legs (jumping - spread) */}
        <rect x="-12" y="78" width="6" height="10" rx="2" fill="#F5CBA7" transform="rotate(10, -9, 78)" />
        <rect x="-14" y="86" width="10" height="5" rx="2.5" fill="#333" transform="rotate(10, -9, 86)" />
        <rect x="6" y="78" width="6" height="10" rx="2" fill="#F5CBA7" transform="rotate(-10, 9, 78)" />
        <rect x="4" y="86" width="10" height="5" rx="2.5" fill="#333" transform="rotate(-10, 9, 86)" />

        {/* Head */}
        <circle cx="0" cy="18" r="18" fill="#FDDCB5" />
        <ellipse cx="0" cy="6" rx="17" ry="10" fill="#5D4037" />
        <path d="M-15 10 Q-17 5 -14 2 Q-5 -4 5 -3 Q15 -2 17 5 Q18 10 15 12" fill="#5D4037" />
        <circle cx="-6" cy="16" r="2.5" fill="#4A3728" />
        <circle cx="6" cy="16" r="2.5" fill="#4A3728" />
        <circle cx="-5" cy="15" r="1" fill="white" />
        <circle cx="7" cy="15" r="1" fill="white" />
        {/* Open mouth - yelling with joy */}
        <ellipse cx="0" cy="26" rx="5" ry="4" fill="#C47B3B" />
        <ellipse cx="0" cy="25" rx="4" ry="2" fill="#FF8A80" opacity="0.6" />
        <circle cx="-10" cy="22" r="3" fill="#FFB5B5" opacity="0.4" />
        <circle cx="10" cy="22" r="3" fill="#FFB5B5" opacity="0.4" />

        {/* Arms up celebrating — drawn after head so they render on top */}
        <rect x="-24" y="18" width="8" height="24" rx="4" fill="#F5CBA7" transform="rotate(-120, -20, 18)" />
        <rect x="16" y="18" width="8" height="24" rx="4" fill="#F5CBA7" transform="rotate(120, 20, 18)" />

        {/* Bouncing animation */}
        <animateTransform attributeName="transform" type="translate" values="170 115;170 108;170 115" dur="0.6s" repeatCount="indefinite" />
      </g>

      {/* === Younger boy with glasses celebrating === */}
      <g transform="translate(240, 138)">
        <ellipse cx="0" cy="82" rx="16" ry="3.5" fill="rgba(0,0,0,0.08)" />

        {/* Shirt (red matching) */}
        <rect x="-14" y="26" width="28" height="32" rx="7" fill="#EF5350" />
        <text x="0" y="48" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="sans-serif">4</text>

        {/* Shorts */}
        <rect x="-12" y="54" width="10" height="14" rx="4" fill="white" />
        <rect x="2" y="54" width="10" height="14" rx="4" fill="white" />

        {/* Legs */}
        <rect x="-8" y="66" width="5" height="9" rx="2" fill="#F5CBA7" transform="rotate(8, -5, 66)" />
        <rect x="-10" y="73" width="9" height="4.5" rx="2" fill="#333" transform="rotate(8, -5, 73)" />
        <rect x="3" y="66" width="5" height="9" rx="2" fill="#F5CBA7" transform="rotate(-8, 5, 66)" />
        <rect x="1" y="73" width="9" height="4.5" rx="2" fill="#333" transform="rotate(-8, 5, 73)" />

        {/* Head */}
        <circle cx="0" cy="14" r="16" fill="#FDDCB5" />
        <ellipse cx="0" cy="4" rx="15" ry="9" fill="#8B6914" />
        <path d="M-13 8 Q-15 3 -12 0 Q-4 -4 4 -3 Q13 -2 15 4 Q16 8 13 10" fill="#8B6914" />

        {/* Glasses */}
        <rect x="-12" y="10" width="10" height="9" rx="4" fill="none" stroke="#4A4A4A" strokeWidth="1.8" />
        <rect x="2" y="10" width="10" height="9" rx="4" fill="none" stroke="#4A4A4A" strokeWidth="1.8" />
        <line x1="-2" y1="14" x2="2" y2="14" stroke="#4A4A4A" strokeWidth="1.5" />
        <line x1="-12" y1="14" x2="-15" y2="12" stroke="#4A4A4A" strokeWidth="1.5" />
        <line x1="12" y1="14" x2="15" y2="12" stroke="#4A4A4A" strokeWidth="1.5" />
        <ellipse cx="-8" cy="12" rx="2" ry="1.5" fill="rgba(255,255,255,0.3)" />
        <ellipse cx="6" cy="12" rx="2" ry="1.5" fill="rgba(255,255,255,0.3)" />

        <circle cx="-7" cy="15" r="2" fill="#4A3728" />
        <circle cx="7" cy="15" r="2" fill="#4A3728" />
        <circle cx="-6" cy="14" r="0.8" fill="white" />
        <circle cx="8" cy="14" r="0.8" fill="white" />
        <ellipse cx="0" cy="23" rx="4.5" ry="3.5" fill="#C47B3B" />
        <ellipse cx="0" cy="22" rx="3.5" ry="1.8" fill="#FF8A80" opacity="0.6" />
        <circle cx="-9" cy="19" r="2.5" fill="#FFB5B5" opacity="0.45" />
        <circle cx="9" cy="19" r="2.5" fill="#FFB5B5" opacity="0.45" />

        {/* Arms up! — drawn after head so they render on top */}
        <rect x="-20" y="14" width="7" height="22" rx="3.5" fill="#F5CBA7" transform="rotate(-120, -16, 14)" />
        <rect x="13" y="14" width="7" height="22" rx="3.5" fill="#F5CBA7" transform="rotate(120, 16, 14)" />

        <animateTransform attributeName="transform" type="translate" values="240 138;240 130;240 138" dur="0.6s" begin="0.15s" repeatCount="indefinite" />
      </g>

      {/* Soccer ball in the goal! */}
      <g transform="translate(200, 185)">
        <circle cx="0" cy="0" r="11" fill="white" stroke="#333" strokeWidth="1" />
        <polygon points="0,-5 4.8,-1.5 3,4.5 -3,4.5 -4.8,-1.5" fill="#333" />
      </g>

      {/* Stars around the boys */}
      {[
        [130, 90],
        [280, 100],
        [200, 80],
      ].map(([x, y], i) => (
        <text key={i} x={x} y={y} fontSize="18" fill="#FFD700" textAnchor="middle" opacity="0.8">
          ⭐
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
        </text>
      ))}
    </g>
  );
}

const SCENE_MAP: Record<FamilyScene, () => ReactNode> = {
  soccer: SoccerScene,
  highfive: HighFiveScene,
  celebrate: CelebrateScene,
};

export function FamilyIllustration({
  scene = 'soccer',
  size,
  style,
  ...props
}: FamilyIllustrationProps) {
  const SceneComponent = SCENE_MAP[scene];
  const sizeVal = size ?? '100%';
  const dimension = typeof sizeVal === 'number' ? `${sizeVal}px` : sizeVal;

  const mergedStyle: CSSProperties = {
    width: dimension,
    maxWidth: '100%',
    height: 'auto',
    ...style,
  };

  return (
    <svg
      viewBox="0 0 400 300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="יהונתן ושי משחקים כדורגל"
      style={mergedStyle}
      {...props}
    >
      <SceneComponent />
    </svg>
  );
}
