// Poki HTML5 SDK v2 adapter.
// Docs: https://sdk.poki.com/html5
// The SDK script tag is injected into <head> by vite.config.ts for the "poki" target.
import { createLocalStorage } from '../storage';
import type { AdKind, AdOutcome, Platform } from './types';

interface PokiSDKApi {
  init(): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  commercialBreak(onStart?: () => void): Promise<void>;
  rewardedBreak(options: { size?: 'small' | 'medium' | 'large'; onStart?: () => void }): Promise<boolean>;
}

declare global {
  interface Window {
    PokiSDK?: PokiSDKApi;
  }
}

// An ad that never starts within this time counts as unfilled, so the game never waits forever.
const AD_START_TIMEOUT_MS = 15_000;

export class PokiPlatform implements Platform {
  readonly id = 'poki';
  readonly adsSupported = true;
  // Poki has no cloud save; progress stays in the browser.
  readonly storage = createLocalStorage();

  /** Throws when the SDK script is missing (ad blocker, offline). */
  static async create(): Promise<PokiPlatform> {
    const sdk = window.PokiSDK;
    if (!sdk) throw new Error('Poki SDK script not loaded');
    // Poki asks to start the game even when init fails (for example with an ad blocker).
    try {
      await Promise.race([sdk.init(), new Promise((_, reject) => setTimeout(() => reject(new Error('init timed out')), 8000))]);
    } catch (err) {
      console.warn('[poki] init failed, continuing:', err);
    }
    preventPageJumps();
    return new PokiPlatform(sdk);
  }

  private constructor(private sdk: PokiSDKApi) {}

  private safe(name: string, fn: () => void) {
    try {
      fn();
    } catch (err) {
      console.warn(`[poki] ${name} failed:`, err);
    }
  }

  loadingStart() {
    // Poki v2 has no loading-start call; loading is measured from page load.
  }
  loadingStop() {
    this.safe('gameLoadingFinished', () => this.sdk.gameLoadingFinished());
  }
  gameplayStart() {
    this.safe('gameplayStart', () => this.sdk.gameplayStart());
  }
  gameplayStop() {
    this.safe('gameplayStop', () => this.sdk.gameplayStop());
  }
  happyTime() {
    // No happy-time call in Poki SDK v2.
  }

  showAd(kind: AdKind, onStarted: () => void): Promise<AdOutcome> {
    return new Promise((resolve) => {
      let started = false;
      let done = false;
      const finish = (outcome: AdOutcome) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(outcome);
      };
      const start = () => {
        if (started || done) return;
        started = true;
        clearTimeout(timer);
        onStarted();
      };
      // Rewarded ads always start or fail quickly; a commercial break may resolve without showing anything.
      const timer = setTimeout(() => finish('unfilled'), AD_START_TIMEOUT_MS);
      try {
        if (kind === 'rewarded') {
          this.sdk
            .rewardedBreak({ size: 'medium', onStart: start })
            .then((success) => finish(success ? 'finished' : 'unfilled'))
            .catch(() => finish('other'));
        } else {
          this.sdk
            .commercialBreak(start)
            // Poki decides whether an ad really shows. No start means no ad, which is normal.
            .then(() => finish(started ? 'finished' : 'unfilled'))
            .catch(() => finish('other'));
        }
      } catch (err) {
        console.warn('[poki] ad request failed:', err);
        finish('other');
      }
    });
  }

  locale() {
    return navigator.language ?? null;
  }

  isMobile() {
    return window.matchMedia('(pointer: coarse)').matches;
  }

  onMuteChange(fn: (muted: boolean) => void) {
    // Poki has no forced mute.
    fn(false);
  }
}

/** Poki requirement: arrow keys, space and the mouse wheel must not scroll the portal page. */
function preventPageJumps() {
  window.addEventListener('keydown', (ev) => {
    if (['ArrowDown', 'ArrowUp', ' '].includes(ev.key)) ev.preventDefault();
  });
  window.addEventListener('wheel', (ev) => ev.preventDefault(), { passive: false });
}
