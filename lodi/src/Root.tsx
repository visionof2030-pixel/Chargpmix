import React from 'react';
import {Composition} from 'remotion';
import {LodiVideo, totalFrames} from './Video';

export const RemotionRoot: React.FC = () => (
  <Composition id="Lodi" component={LodiVideo} durationInFrames={totalFrames(30)} fps={30} width={1080} height={1920} />
);
