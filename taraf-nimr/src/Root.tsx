import React from 'react';
import {Still} from 'remotion';
import {Sheet} from './Sheet';
import {YardPreview} from './YardPreview';

export const RemotionRoot: React.FC = () => (
  <>
    <Still id="Characters" component={Sheet} width={2400} height={1600} />
    <Still id="YardPreview" component={YardPreview} width={1920} height={1080} />
  </>
);
