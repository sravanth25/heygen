import React from "react";
import {
  AbsoluteFill,
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

// Artwork is authored at 900x1600; the composition renders at 1080x1920.
const SRC_W = 900;
const SRC_H = 1600;

type LayerName = keyof typeof layers;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Light sources in poster coordinates.
const SUN = { x: 722, y: 1195 };
const DIYAS = [
  { x: 18, y: 1300, r: 38 },
  { x: 58, y: 1370, r: 46 },
  { x: 102, y: 1462, r: 56 },
];
const DURGA_HALO = { x: 238, y: 680 };

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
      <Img
        src={staticFile(`layers/${name}.png`)}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
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
  const p = interpolate(frame, [start, start + duration], [-40, 140], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  if (frame < start || frame > start + duration) return null;
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

const Embers: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(55).fill(0).map((_, i) => {
        const speed = 0.6 + random(`s${i}`) * 1.6;
        const size = 2 + random(`z${i}`) * 5;
        const x0 = random(`x${i}`) * SRC_W;
        const travel = SRC_H * 0.9;
        const offset = random(`o${i}`) * durationInFrames;
        const t = ((frame + offset) * speed) % travel;
        const y = SRC_H + 20 - t;
        const x = x0 + Math.sin((frame + offset) / (18 + i % 7 * 4)) * 22;
        const life = t / travel;
        const twinkle = 0.55 + 0.45 * Math.sin(frame / 4 + i);
        const opacity = interpolate(life, [0, 0.1, 0.7, 1], [0, 1, 0.7, 0]) * twinkle;
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

export const DussehraPoster: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, durationInFrames } = useVideoConfig();
  const scale = width / SRC_W;

  // Slow push-in on the whole scene.
  const camZoom = interpolate(frame, [0, durationInFrames], [1.14, 1.0], {
    easing: Easing.out(Easing.cubic),
  });
  const camY = interpolate(frame, [0, durationInFrames], [30, 0], {
    easing: Easing.out(Easing.cubic),
  });
  const fadeIn = interpolate(frame, [0, 24], [0, 1], clamp);
  const float = (phase: number, amp = 4) => Math.sin(frame / 22 + phase) * amp;

  // Logo: drops in, de-blurs.
  const logoIn = spring({ frame: frame - 18, fps, config: { damping: 14 } });
  // Durga's eyes: scale in, then a divine glow pulse.
  const faceIn = spring({ frame: frame - 48, fps, config: { damping: 12, mass: 0.9 } });
  const eyeFlash = interpolate(frame, [92, 104, 130], [0, 1, 0], clamp);
  // Title: left-to-right wipe with a gentle overshoot.
  const titleWipe = interpolate(frame, [86, 124], [0, 100], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const titlePop = spring({ frame: frame - 86, fps, config: { damping: 10 } });
  // Quote: revealed top to bottom, line by line feel.
  const quoteWipe = interpolate(frame, [128, 176], [0, 100], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });

  const sunPulse = 0.75 + 0.25 * Math.sin(frame / 10);
  const raysRotate = frame * 0.12;

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a0700", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: SRC_W,
          height: SRC_H,
          transformOrigin: "0 0",
          transform: `scale(${scale})`,
          opacity: fadeIn,
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
              transform: `rotate(${raysRotate}deg)`,
              mixBlendMode: "screen",
              opacity: 0.55 * fadeIn,
            }}
          />
          <Glow x={SUN.x} y={SUN.y} r={190} color="rgba(255,240,180,0.9)" opacity={sunPulse} />

          {/* Divine aura behind Durga's crown */}
          <Glow
            x={DURGA_HALO.x}
            y={DURGA_HALO.y}
            r={150}
            color="rgba(255,220,120,0.75)"
            opacity={0.45 + 0.25 * Math.sin(frame / 14)}
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

        {/* Graphic layers float slightly against the camera for parallax. */}
        <Layer
          name="logo"
          style={{
            opacity: logoIn,
            filter: `blur(${(1 - logoIn) * 8}px)`,
            transform: `translateY(${(1 - logoIn) * -60 + float(0, 3)}px) scale(${0.9 + logoIn * 0.1})`,
          }}
        >
          <Shine name="logo" start={52} />
          <Shine name="logo" start={220} />
        </Layer>

        <Layer
          name="face"
          style={{
            opacity: faceIn,
            transform: `translateY(${float(1.4, 5)}px) scale(${0.7 + faceIn * 0.3})`,
            filter: `drop-shadow(0 0 ${eyeFlash * 26}px rgba(255,200,80,${eyeFlash}))`,
          }}
        >
          <Shine name="face" start={100} duration={34} />
        </Layer>

        <Layer
          name="title"
          style={{
            clipPath: `inset(0 ${100 - titleWipe}% 0 0)`,
            transform: `translateY(${float(2.6, 3)}px) scale(${0.92 + titlePop * 0.08})`,
          }}
        >
          <Shine name="title" start={150} duration={30} />
          <Shine name="title" start={250} duration={30} />
        </Layer>

        <Layer
          name="quote"
          style={{
            clipPath: `inset(0 0 ${100 - quoteWipe}% 0)`,
            opacity: interpolate(quoteWipe, [0, 30], [0, 1], clamp),
            transform: `translateY(${(1 - quoteWipe / 100) * 14 + float(3.8, 2)}px)`,
          }}
        />

        <Embers />

        {/* Warm vignette */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at 50% 55%, transparent 55%, rgba(60,15,0,0.45) 100%)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
