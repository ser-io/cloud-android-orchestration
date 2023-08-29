import {Environment} from 'src/app/interface/env-interface';
import {Runtime} from 'src/app/interface/runtime-interface';
import {Host} from 'src/app/interface/host-interface';
import {Wait} from 'src/app/interface/wait-interface';

export type Action =
  | InitAction
  | RuntimeRegisterCompleteAction
  | RuntimeUnregisterAction
  | RuntimeInitializeAction
  | RuntimeRefreshStartAction
  | RuntimeLoadAction
  | RuntimeLoadCompleteAction
  | RuntimeRegisterErrorAction
  | RuntimeRegisterStartAction
  | EnvCreateStartAction
  | EnvDeleteStartAction
  | HostCreateStartAction
  | HostCreateCompleteAction
  | HostCreateErrorAction;

export interface InitAction {
  type: 'init';
}

export interface RuntimeRegisterStartAction {
  type: 'runtime-register-start';
}

export interface RuntimeRegisterCompleteAction {
  type: 'runtime-register-complete';
  runtime: Runtime;
}

export interface RuntimeRegisterErrorAction {
  type: 'runtime-register-error';
}

export interface RuntimeUnregisterAction {
  type: 'runtime-unregister';
  alias: string;
}

export interface RuntimeInitializeAction {
  type: 'runtime-init';
}

export interface RuntimeRefreshStartAction {
  type: 'runtime-refresh-start';
}

export interface RuntimeLoadAction {
  type: 'runtime-load';
  runtime: Runtime;
}

export interface RuntimeLoadCompleteAction {
  type: 'runtime-load-complete';
}

export interface EnvCreateStartAction {
  type: 'env-create-start';
  env: Environment;
}

export interface EnvDeleteStartAction {
  type: 'env-delete-start';
  target: Environment;
}

export interface HostCreateStartAction {
  type: 'host-create-start';
  wait: Wait;
}

export interface HostCreateCompleteAction {
  type: 'host-create-complete';
  waitUrl: string;
  host: Host;
}

export interface HostCreateErrorAction {
  type: 'host-create-error';
  waitUrl?: string;
}