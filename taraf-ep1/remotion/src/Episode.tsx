import React from 'react';
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {T} from './lib';
import {Iris} from './ui';
import {BathScene, EndScene, RoomScene, TitleScene} from './scenes';

const Wipe: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <Iris t={frame / fps} cuts={[T.off.room, T.off.bath, T.off.end]} />;
};

export const Episode: React.FC = () => {
  const {fps} = useVideoConfig();
  const at = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence name="Title" durationInFrames={at(T.off.room)}>
        <TitleScene />
      </Sequence>
      <Sequence name="Room" from={at(T.off.room)} durationInFrames={at(T.off.bath) - at(T.off.room)}>
        <RoomScene />
      </Sequence>
      <Sequence name="Bathroom" from={at(T.off.bath)} durationInFrames={at(T.off.end) - at(T.off.bath)}>
        <BathScene />
      </Sequence>
      <Sequence name="End card" from={at(T.off.end)}>
        <EndScene />
      </Sequence>
      <Wipe />
      <Audio src={staticFile('audio.wav')} />
    </AbsoluteFill>
  );
};
