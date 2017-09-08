import path from 'path';
import fs from 'fs';

import {
  Stage,
  UpstreamHandler,
  DownstreamHandler
} from './core/stage';

import { OverflowStrategy } from './core/buffer';

import Stream from './core/stream';

import Source, { SourceStage } from './core/source';
import Flow from './core/flow';
import Sink, { SinkStage, BasicSinkStage } from './core/sink';
import FanOut, { FanOutStage } from './core/fan-out';
import FanIn, { FanInStage } from './core/fan-in';

function importFolder(folder) {
  fs.readdirSync(path.join(__dirname, folder)).forEach(file => require(`${folder}/${file}`));
}

importFolder('./sources');
importFolder('./flows');
importFolder('./sinks');
importFolder('./fan-in');
importFolder('./fan-out');

export {
  Stream,
  Source,
  Flow,
  Sink,
  FanIn,
  FanOut,
  Stage,
  SourceStage,
  SinkStage,
  BasicSinkStage,
  FanInStage,
  FanOutStage,
  UpstreamHandler,
  DownstreamHandler,
  OverflowStrategy
}
