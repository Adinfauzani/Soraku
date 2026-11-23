declare module "plyr" {
  export interface PlyrOptions {
    controls?: string[];
    settings?: string[];
    speed?: { selected?: number; options?: number[] };
    storage?: { enabled?: boolean };
    tooltips?: { controls?: boolean; seek?: boolean };
    [key: string]: unknown;
  }

  export default class Plyr {
    constructor(target: HTMLMediaElement | string, options?: PlyrOptions);
    destroy(): void;
    play(): void | Promise<void>;
    pause(): void;
    togglePlay(): void;
    currentTime: number;
    duration: number;
    paused: boolean;
    fullscreen: {
      enter(): void | Promise<void>;
      exit(): void | Promise<void>;
      toggle(): void | Promise<void>;
    };
    on(event: string, callback: (...args: unknown[]) => void): void;
  }
}