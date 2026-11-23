import React from 'react';
import {TransitionSeries, linearTiming, type TransitionPresentation} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {useVideoConfig} from 'remotion';
import {SCENES} from './lib';
import {Scene1, Scene2, Scene3, Scene4, Scene5, Scene6} from './scenes';

export const TRANSITION_FRAMES = 16;
const COMPONENTS = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6];
const NAMES = ['الاعتراف', 'الدولاب', 'المرآة', 'السيارة', 'المدرجات', 'الختام'];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PRESENTATIONS: TransitionPresentation<any>[] = [fade(), wipe({direction: 'from-right'}), fade(), slide({direction: 'from-right'}), fade()];

export const totalFrames = (fps: number) =>
  SCENES.reduce((a, s) => a + Math.round(s.dur * fps), 0) - TRANSITION_FRAMES * (SCENES.length - 1);

export const LodiVideo: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <TransitionSeries>
      {SCENES.map((s, i) => {
        const C = COMPONENTS[i];
        return (
          <React.Fragment key={s.id}>
            <TransitionSeries.Sequence name={`${i + 1} — ${NAMES[i]}`} durationInFrames={Math.round(s.dur * fps)}>
              <C />
            </TransitionSeries.Sequence>
            {i < SCENES.length - 1 ? (
              <TransitionSeries.Transition presentation={PRESENTATIONS[i]} timing={linearTiming({durationInFrames: TRANSITION_FRAMES})} />
            ) : null}
          </React.Fragment>
        );
      })}
    </TransitionSeries>
  );
};
