import React from 'react';
import {Composition, Still} from 'remotion';
import {Episode} from './Episode';
import {RigTest} from './jassar/RigTest';
import {JassarShort, J} from './jassar/Short';
import {TL} from './tl';
import {Sheet} from './Sheet';
import {YardPreview} from './YardPreview';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BasaEpisode" component={Episode} durationInFrames={Math.round(TL.total * 30)} fps={30} width={1080} height={1920} />
    <Still id="Characters" component={Sheet} width={2400} height={1600} />
    <Still id="YardPreview" component={YardPreview} width={1920} height={1080} />
    <Composition id="JassarShort" component={JassarShort} durationInFrames={Math.round(J.total * 30)} fps={30} width={1080} height={1920} />
    <Still id="RigTest" component={RigTest} width={2400} height={1400} />
  </>
);
