import React from 'react';
import {Still} from 'remotion';
import {Sheet} from './Sheet';

export const RemotionRoot: React.FC = () => (
  <>
    <Still id="Characters" component={Sheet} width={2400} height={1600} />
  </>
);
