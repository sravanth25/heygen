import React from "react";
import { Composition } from "remotion";
import { DussehraPoster } from "./DussehraPoster";
import { T } from "./timeline";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="DussehraPoster"
    component={DussehraPoster}
    durationInFrames={T.total}
    fps={30}
    width={1080}
    height={1920}
  />
);
