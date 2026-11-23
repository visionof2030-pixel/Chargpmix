import React from 'react';
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {TL, clamp01} from './tl';
import {CaveScene, ChaseScene, HomeScene, JassarScene, PathScene, TitleScene, YardScene} from './scenes';

const COMPONENTS: Record<string, React.FC> = {
  title: TitleScene,
  yard: YardScene,
  path: PathScene,
  cave: CaveScene,
  chase: ChaseScene,
  jassar: JassarScene,
  home: HomeScene,
};
const NAMES: Record<string, string> = {title: 'العنوان', yard: '١ الحوش', path: '٢ طريق الجبل', cave: '٣ العرين', chase: '٤ المطاردة', jassar: '٥ جسار', home: '٦ الرجوع'};

/** quick dip to black around each cut (skipped into the gunshot scene: that cut is a hard flash) */
const Dips: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  let a = 0;
  for (const s of TL.scenes.slice(1)) {
    if (s.name === 'jassar') continue;
    const d = Math.abs(t - s.start);
    a = Math.max(a, 1 - clamp01(d / 0.22));
  }
  return a > 0 ? <AbsoluteFill style={{background: '#000', opacity: a}} /> : null;
};

export const Episode: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {TL.scenes.map((s) => {
        const C = COMPONENTS[s.name];
        const from = Math.round(s.start * fps);
        const dur = Math.round((s.start + s.dur) * fps) - from;
        return (
          <Sequence key={s.name} name={NAMES[s.name]} from={from} durationInFrames={dur}>
            <C />
          </Sequence>
        );
      })}
      <Dips />
      <Audio src={staticFile('audio.wav')} />
    </AbsoluteFill>
  );
};
