import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import layers from "./layers.json";
import { T } from "./timeline";

// Artwork is authored at 900x1600; the composition renders at 1080x1920.
const SRC_W = 900;
const SRC_H = 1600;

type LayerName = keyof typeof layers;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Points of interest in poster coordinates.
const SUN = { x: 722, y: 1195 };
const DIYAS = [
  { x: 18, y: 1300, r: 38 },
  { x: 58, y: 1370, r: 46 },
  { x: 102, y: 1462, r: 56 },
];
const DURGA_HALO = { x: 268, y: 690 };
const DURGA_FEET = { x: 300, y: 1440 };
const BOW = { x: 705, y: 1377 };
const RAVANA = { x: 815, y: 1372 };
const FACE_CENTER = {
  x: layers.face.x + layers.face.w / 2,
  y: layers.face.y + layers.face.h / 2,
};

// Jewellery glints: [x, y, size, first frame, repeat period].
const SPARKLES: [number, number, number, number, number][] = [
  [270, 672, 34, 88, 95], // crown
  [262, 838, 30, 118, 110], // Durga necklace
  [237, 772, 18, 150, 120], // earring
  [180, 1232, 36, 102, 90], // lion necklace pendant
  [104, 1196, 22, 132, 105], // lion necklace emeralds
  [262, 1196, 22, 160, 100],
  [458, 342, 26, 84, 120], // logo diamonds
  [858, 342, 26, 92, 120],
  [762, 612, 20, 140, 115], // nose ring
  [692, 822, 24, 128, 125], // title ornament
  [700, 975, 24, 176, 125], // quote ornament
  [480, 760, 28, 170, 130], // mace head
];

const LayerImg: React.FC<{ name: LayerName }> = ({ name }) => (
  <Img
    src={staticFile(`layers/${name}.png`)}
    style={{ width: "100%", height: "100%", display: "block" }}
  />
);

const Layer: React.FC<{
  name: LayerName;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ name, style, children }) => {
  const l = layers[name];
  return (
    <div
      style={{
        position: "absolute",
        left: l.x,
        top: l.y,
        width: l.w,
        height: l.h,
        ...style,
      }}
    >
      <LayerImg name={name} />
      {children}
    </div>
  );
};

// A gold glint that travels across the opaque pixels of a layer.
const Shine: React.FC<{ name: LayerName; start: number; duration?: number }> = ({
  name,
  start,
  duration = 28,
}) => {
  const frame = useCurrentFrame();
  if (frame < start || frame > start + duration) return null;
  const p = interpolate(frame, [start, start + duration], [-40, 140], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const mask = `url(${staticFile(`layers/${name}.png`)})`;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
        background: `linear-gradient(110deg, transparent ${p - 18}%, rgba(255,236,170,0.95) ${p}%, transparent ${p + 18}%)`,
        mixBlendMode: "screen",
      }}
    />
  );
};

// Flags ripple: the layer is sliced into thin columns, each shifted vertically
// by a travelling sine. Poles are vertical, so they stay straight.
const WavingFlags: React.FC = () => {
  const frame = useCurrentFrame();
  const l = layers.flags;
  const STRIP = 3;
  const src = staticFile("layers/flags.png");
  return (
    <div style={{ position: "absolute", left: l.x, top: l.y, width: l.w, height: l.h }}>
      {new Array(Math.ceil(l.w / STRIP)).fill(0).map((_, i) => {
        const x = i * STRIP;
        const dy = 2.6 * Math.sin(x / 24 - frame / 4.2) + 1.2 * Math.sin(x / 9 - frame / 2.6);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: 0,
              width: STRIP,
              height: l.h,
              overflow: "hidden",
              transform: `translateY(${dy}px)`,
            }}
          >
            <Img src={src} style={{ position: "absolute", left: -x, top: 0, width: l.w, height: l.h }} />
          </div>
        );
      })}
    </div>
  );
};

const Embers: React.FC<{ count?: number; intensity?: number }> = ({ count = 70, intensity = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const speed = 0.7 + random(`s${i}`) * 1.8;
        const size = 2 + random(`z${i}`) * 5;
        const x0 = random(`x${i}`) * SRC_W;
        const travel = SRC_H * 0.95;
        const offset = random(`o${i}`) * 900;
        const t = ((frame + offset) * speed) % travel;
        const y = SRC_H + 20 - t;
        const x = x0 + Math.sin((frame + offset) / (18 + (i % 7) * 4)) * 24;
        const life = t / travel;
        const twinkle = 0.55 + 0.45 * Math.sin(frame / 4 + i);
        const opacity = interpolate(life, [0, 0.1, 0.7, 1], [0, 1, 0.7, 0]) * twinkle * intensity;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: i % 3 === 0 ? "#fff3c4" : "#ffb340",
              boxShadow: `0 0 ${size * 3}px ${size}px rgba(255,170,40,0.55)`,
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Glow: React.FC<{
  x: number;
  y: number;
  r: number;
  color: string;
  opacity: number;
}> = ({ x, y, r, color, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      mixBlendMode: "screen",
      opacity,
    }}
  />
);

// Four-point star glint.
const Star: React.FC<{ x: number; y: number; size: number; amount: number; rotate?: number }> = ({
  x,
  y,
  size,
  amount,
  rotate = 0,
}) => {
  if (amount <= 0.01) return null;
  const s = size * (0.4 + 0.6 * amount);
  const ray = (deg: number, len: number) => (
    <div
      style={{
        position: "absolute",
        left: -len / 2,
        top: -1.25,
        width: len,
        height: 2.5,
        borderRadius: 2,
        background: "linear-gradient(90deg, transparent, #fffbe8 50%, transparent)",
        transform: `rotate(${deg}deg)`,
      }}
    />
  );
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
        opacity: amount,
        transform: `rotate(${rotate}deg)`,
        mixBlendMode: "screen",
        filter: "drop-shadow(0 0 4px rgba(255,220,140,0.9))",
      }}
    >
      {ray(0, s * 2)}
      {ray(90, s * 2)}
      {ray(45, s * 0.9)}
      {ray(-45, s * 0.9)}
      <div
        style={{
          position: "absolute",
          left: -s * 0.25,
          top: -s * 0.25,
          width: s * 0.5,
          height: s * 0.5,
          borderRadius: "50%",
          background: "radial-gradient(circle, #fff 0%, rgba(255,230,160,0.6) 40%, transparent 70%)",
        }}
      />
    </div>
  );
};

const Sparkles: React.FC<{ boost: number }> = ({ boost }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {SPARKLES.map(([x, y, size, first, period], i) => {
        const local = frame - first;
        if (local < 0) return null;
        const cycle = local % period;
        const amount =
          Math.max(interpolate(cycle, [0, 6, 16], [0, 1, 0], clamp), boost * (0.5 + 0.5 * Math.sin(frame / 3 + i)));
        return <Star key={i} x={x} y={y} size={size} amount={amount} rotate={frame * 1.5} />;
      })}
    </>
  );
};

// Rama's arrow: a burning streak from the bow to Ravana, then a burst of light.
const ArrowStrike: React.FC = () => {
  const frame = useCurrentFrame();
  const fly = interpolate(frame, [T.arrowRelease, T.impact], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.quad),
  });
  const charge = interpolate(frame, [T.arrowRelease - 22, T.arrowRelease, T.arrowRelease + 4], [0, 1, 0], clamp);
  const burst = frame - T.impact;
  const tip = {
    x: BOW.x + (RAVANA.x - BOW.x) * fly,
    y: BOW.y + (RAVANA.y - BOW.y) * fly - Math.sin(fly * Math.PI) * 6,
  };
  const trailLen = 90 * Math.min(1, fly * 2);
  return (
    <>
      {/* Bow charges with light before the release */}
      <Glow x={BOW.x - 10} y={BOW.y} r={46} color="rgba(255,240,190,1)" opacity={charge} />

      {frame >= T.arrowRelease && frame <= T.impact && (
        <div
          style={{
            position: "absolute",
            left: tip.x - trailLen,
            top: tip.y - 2,
            width: trailLen,
            height: 4,
            borderRadius: 2,
            background: "linear-gradient(90deg, transparent, #ffcf6a 60%, #ffffff)",
            boxShadow: "0 0 14px 4px rgba(255,190,80,0.9)",
          }}
        />
      )}

      {burst >= 0 && burst < 60 && (
        <>
          <Glow
            x={RAVANA.x}
            y={RAVANA.y}
            r={interpolate(burst, [0, 8, 60], [60, 300, 360], clamp)}
            color="rgba(255,150,40,0.9)"
            opacity={interpolate(burst, [0, 6, 60], [1, 1, 0], clamp)}
          />
          <Glow
            x={RAVANA.x}
            y={RAVANA.y}
            r={interpolate(burst, [0, 6, 40], [40, 150, 170], clamp)}
            color="rgba(255,250,220,1)"
            opacity={interpolate(burst, [0, 3, 40], [1, 1, 0], clamp)}
          />
          {/* Shockwave */}
          <div
            style={{
              position: "absolute",
              left: RAVANA.x,
              top: RAVANA.y,
              width: 0,
              height: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                width: burst * 14,
                height: burst * 14,
                left: -burst * 7,
                top: -burst * 7,
                borderRadius: "50%",
                border: `${interpolate(burst, [0, 30], [6, 1], clamp)}px solid rgba(255,225,150,0.9)`,
                boxShadow: "0 0 20px rgba(255,200,100,0.8)",
                opacity: interpolate(burst, [0, 30], [1, 0], clamp),
              }}
            />
          </div>
          {/* Sparks */}
          {new Array(44).fill(0).map((_, i) => {
            const a = random(`a${i}`) * Math.PI * 2;
            const v = 3 + random(`v${i}`) * 7;
            const px = RAVANA.x + Math.cos(a) * v * burst;
            const py = RAVANA.y + Math.sin(a) * v * burst + 0.05 * burst * burst;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: px,
                  top: py,
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "#fff1c0",
                  boxShadow: "0 0 8px 3px rgba(255,170,50,0.9)",
                  opacity: interpolate(burst, [0, 40], [1, 0], clamp),
                }}
              />
            );
          })}
        </>
      )}
    </>
  );
};

export const DussehraPoster: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const scale = width / SRC_W;

  // --- Intro: Durga's eyes open in the dark, then move into place as the scene bursts open.
  const eyesOpen = interpolate(frame, [T.eyesOpen, T.eyesOpen + 26], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const eyesMove = interpolate(frame, [T.reveal - 6, T.reveal + 20], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const reveal = interpolate(frame, [T.reveal - 3, T.reveal + 28], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const flash = interpolate(frame, [T.reveal - 4, T.reveal, T.reveal + 18], [0, 0.85, 0], clamp);
  const introGlow = interpolate(frame, [0, 20, T.reveal + 10], [0, 1, 0], clamp);
  const bindiGlow = interpolate(frame, [26, 40, T.reveal + 10], [0, 1, 0], clamp);

  // --- Camera: slow pull-back; Durga is closer, so she settles faster (parallax).
  const camZoom = interpolate(frame, [T.reveal, T.total], [1.16, 1.0], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const camY = interpolate(frame, [T.reveal, T.total], [36, 0], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const fgDepth =
    interpolate(frame, [T.reveal, T.total], [1.035, 1.0], { ...clamp, easing: Easing.out(Easing.cubic) }) +
    0.004 * Math.sin(frame / 20);
  const shake = frame >= T.impact && frame < T.impact + 12 ? (12 - (frame - T.impact)) / 12 : 0;
  const shakeX = shake * 5 * Math.sin(frame * 2.7);
  const shakeY = shake * 4 * Math.cos(frame * 3.1);
  const float = (phase: number, amp = 4) => Math.sin(frame / 22 + phase) * amp;

  // --- Text & graphics.
  const logoIn = spring({ frame: frame - T.logo, fps, config: { damping: 14 } });
  const titleWipe = interpolate(frame, [T.title, T.title + 36], [0, 100], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const titlePop = spring({ frame: frame - T.title, fps, config: { damping: 10 } });
  const quoteWipe = interpolate(frame, [T.quote, T.quote + 46], [0, 100], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });

  // --- Light.
  const sunPulse = 0.75 + 0.25 * Math.sin(frame / 10);
  const victory = interpolate(frame, [T.impact, T.impact + 40], [0, 1], clamp); // golden grade after the strike
  const finale = interpolate(frame, [T.finale, T.finale + 40], [-30, 130], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const finaleBoost = interpolate(frame, [T.finale + 10, T.finale + 30, T.total - 10], [0, 0.8, 0.4], clamp);
  const fadeOut = interpolate(frame, [T.total - 12, T.total], [1, 0.85], clamp);

  // Face: centred and larger during the intro, then flies to its place in the poster.
  const faceIntroScale = 1.55;
  const faceDx = (SRC_W / 2 - FACE_CENTER.x) * (1 - eyesMove);
  const faceDy = (SRC_H * 0.46 - FACE_CENTER.y) * (1 - eyesMove);
  const faceScale = faceIntroScale + (1 - faceIntroScale) * eyesMove;

  return (
    <AbsoluteFill style={{ backgroundColor: "#120400", overflow: "hidden" }}>
      <Audio src={staticFile("soundtrack.wav")} />
      <div
        style={{
          position: "absolute",
          width: SRC_W,
          height: SRC_H,
          transformOrigin: "0 0",
          transform: `scale(${scale})`,
          opacity: fadeOut,
        }}
      >
        {/* Intro darkness: a warm glow gathers where the eyes will appear. */}
        <Glow x={SRC_W / 2} y={SRC_H * 0.46} r={520} color="rgba(255,120,30,0.55)" opacity={introGlow} />

        {/* The scene, revealed by an expanding circle of light from Durga's eyes. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `circle(${reveal * 1900}px at ${FACE_CENTER.x}px ${FACE_CENTER.y}px)`,
            transform: `translate(${shakeX}px, ${shakeY}px)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformOrigin: "40% 60%",
              transform: `translateY(${camY}px) scale(${camZoom})`,
            }}
          >
            <Img
              src={staticFile("layers/background.jpg")}
              style={{ position: "absolute", inset: 0, width: SRC_W, height: SRC_H }}
            />
            <WavingFlags />

            {/* Rotating sun rays */}
            <div
              style={{
                position: "absolute",
                left: SUN.x - 900,
                top: SUN.y - 900,
                width: 1800,
                height: 1800,
                background:
                  "repeating-conic-gradient(from 0deg, rgba(255,230,150,0.22) 0deg 4deg, transparent 4deg 14deg)",
                WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 55%)",
                maskImage: "radial-gradient(circle, black 0%, transparent 55%)",
                transform: `rotate(${frame * 0.12}deg)`,
                mixBlendMode: "screen",
                opacity: 0.5 + 0.3 * victory,
              }}
            />
            <Glow x={SUN.x} y={SUN.y} r={190 + 40 * victory} color="rgba(255,240,180,0.9)" opacity={sunPulse} />

            <ArrowStrike />

            {/* Divine aura, now genuinely behind Durga */}
            <Glow
              x={DURGA_HALO.x}
              y={DURGA_HALO.y}
              r={190}
              color="rgba(255,225,130,0.85)"
              opacity={0.55 + 0.25 * Math.sin(frame / 14) + 0.2 * victory}
            />
            <div
              style={{
                position: "absolute",
                left: DURGA_HALO.x - 150,
                top: DURGA_HALO.y - 150,
                width: 300,
                height: 300,
                borderRadius: "50%",
                background:
                  "repeating-conic-gradient(from 0deg, rgba(255,240,190,0.35) 0deg 3deg, transparent 3deg 12deg)",
                WebkitMaskImage: "radial-gradient(circle, black 20%, transparent 70%)",
                maskImage: "radial-gradient(circle, black 20%, transparent 70%)",
                transform: `rotate(${-frame * 0.3}deg)`,
                mixBlendMode: "screen",
                opacity: 0.6,
              }}
            />

            {/* Durga and the lion: closer to camera, gentle breathing from the feet up. */}
            <Layer
              name="durga"
              style={{
                transformOrigin: `${DURGA_FEET.x - layers.durga.x}px ${DURGA_FEET.y - layers.durga.y}px`,
                transform: `scale(${fgDepth})`,
              }}
            />

            {/* Diya flames flicker */}
            {DIYAS.map((d, i) => {
              const flicker =
                0.65 +
                0.2 * Math.sin(frame / 2.3 + i * 2) +
                0.15 * (random(`f${i}-${Math.floor(frame / 3)}`) - 0.5);
              return (
                <Glow
                  key={i}
                  x={d.x}
                  y={d.y}
                  r={d.r * (0.9 + flicker * 0.3)}
                  color="rgba(255,190,70,0.95)"
                  opacity={flicker}
                />
              );
            })}
          </div>

          {/* Graphic layers sit in screen space and float slightly against the camera. */}
          <Layer
            name="logo"
            style={{
              opacity: logoIn,
              filter: `blur(${(1 - logoIn) * 8}px)`,
              transform: `translateY(${(1 - logoIn) * -60 + float(0, 3)}px) scale(${0.9 + logoIn * 0.1})`,
            }}
          >
            <Shine name="logo" start={T.logo + 22} />
            <Shine name="logo" start={T.finale + 8} duration={34} />
          </Layer>

          <Layer
            name="title"
            style={{
              clipPath: `inset(-10% ${100 - titleWipe}% -10% 0)`,
              transform: `translateY(${float(2.6, 3)}px) scale(${0.92 + titlePop * 0.08})`,
              filter: `drop-shadow(0 0 ${6 + 6 * victory}px rgba(255,235,180,${0.35 + 0.3 * victory}))`,
            }}
          >
            <Shine name="title" start={T.title + 40} duration={30} />
            <Shine name="title" start={T.finale + 18} duration={34} />
          </Layer>

          <Layer
            name="quote"
            style={{
              clipPath: `inset(0 0 ${100 - quoteWipe}% 0)`,
              opacity: interpolate(quoteWipe, [0, 30], [0, 1], clamp),
              transform: `translateY(${(1 - quoteWipe / 100) * 14 + float(3.8, 2)}px)`,
            }}
          />

          {/* Golden victory grade after the arrow strikes */}
          <AbsoluteFill
            style={{
              background: "radial-gradient(ellipse at 70% 75%, rgba(255,190,90,0.35), transparent 70%)",
              mixBlendMode: "soft-light",
              opacity: victory,
            }}
          />

          <Sparkles boost={finaleBoost} />
        </div>

        {/* Durga's eyes: they open first, in the dark, and lead the reveal. */}
        <Layer
          name="face"
          style={{
            transform: `translate(${faceDx + float(1.4, 5) * eyesMove}px, ${faceDy}px) scale(${faceScale})`,
            clipPath: `inset(${50 * (1 - eyesOpen)}% -20% ${50 * (1 - eyesOpen)}% -20%)`,
            filter: `drop-shadow(0 0 ${10 + bindiGlow * 30}px rgba(255,170,60,${0.4 + bindiGlow * 0.6}))`,
          }}
        >
          <Shine name="face" start={T.reveal - 14} duration={30} />
          <Shine name="face" start={T.impact + 4} duration={30} />
        </Layer>

        <Embers intensity={0.5 + 0.5 * reveal + 0.4 * victory} />

        {/* Finale: a broad sweep of light across the whole poster */}
        <AbsoluteFill
          style={{
            background: `linear-gradient(115deg, transparent ${finale - 20}%, rgba(255,235,180,0.45) ${finale}%, transparent ${finale + 20}%)`,
            mixBlendMode: "screen",
          }}
        />

        {/* Warm vignette */}
        <AbsoluteFill
          style={{
            background: "radial-gradient(ellipse at 50% 55%, transparent 55%, rgba(60,15,0,0.45) 100%)",
          }}
        />

        {/* Reveal flash */}
        <AbsoluteFill style={{ background: "#fff2cf", opacity: flash, mixBlendMode: "screen" }} />
      </div>
    </AbsoluteFill>
  );
};
