export default function createUv(): UniversalVariable;

interface UniversalVariable {
  emit: (type: string, event: Object) => void;
  on: Subscribe;
  once: Subscribe;
  events: Object[];
  listeners: Listener[];
  logLevel: (level: number) => void;
}

type Callback = (context: Object, event: Object) => void;

type Subscribe = (
  type: string | RegExp,
  callback: Callback,
  context?: Object
) => Subscription;

interface Subscription {
  replay: () => Subscription;
  dispose: () => Subscription;
}

interface Listener {
  type: string;
  callback: Callback;
  disposed: boolean;
  context: Object;
}
