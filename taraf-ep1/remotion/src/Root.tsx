import React from 'react';
import {Composition} from 'remotion';
import {Episode} from './Episode';
import {T} from './lib';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TarafEp1" component={Episode} durationInFrames={Math.round(T.total * 30)} fps={30} width={1080} height={1920} />
  </>
);
