import React from "react";
import { Composition } from "remotion";
import { DussehraPoster } from "./DussehraPoster";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="DussehraPoster"
    component={DussehraPoster}
    durationInFrames={300}
    fps={30}
    width={1080}
    height={1920}
  />
);
