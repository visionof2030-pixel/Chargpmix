import React from 'react';
import {Composition, Still} from 'remotion';
import {Episode} from './Episode';
import {RigTest} from './jassar/RigTest';
import {JassarShort, J} from './jassar/Short';
import {TarafAnim, TARAF_ANIM_FRAMES} from './tarafanim/TarafAnim';
import {TarafSpin, TARAF_SPIN_FRAMES} from './tarafanim/TarafSpin';
import {AzzamHero, AZZAM_TOTAL} from './azzam/Azzam';
import {TL} from './tl';
import {Sheet} from './Sheet';
import {YardPreview} from './YardPreview';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BasaEpisode" component={Episode} durationInFrames={Math.round(TL.total * 30)} fps={30} width={1080} height={1920} />
    <Still id="Characters" component={Sheet} width={2400} height={1600} />
    <Still id="YardPreview" component={YardPreview} width={1920} height={1080} />
    <Composition id="JassarShort" component={JassarShort} durationInFrames={Math.round(J.total * 30)} fps={30} width={1080} height={1920} />
    <Composition id="TarafAnim" component={TarafAnim} durationInFrames={TARAF_ANIM_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="TarafSpin" component={TarafSpin} durationInFrames={TARAF_SPIN_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="AzzamHero" component={AzzamHero} durationInFrames={AZZAM_TOTAL * 30} fps={30} width={1080} height={1920} />
    <Still id="RigTest" component={RigTest} width={2400} height={1400} />
  </>
);
