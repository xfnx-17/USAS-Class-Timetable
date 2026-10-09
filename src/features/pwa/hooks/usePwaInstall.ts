import { useSyncExternalStore } from 'react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type InstallState = { available: boolean; installed: boolean };

const INITIAL_STATE: InstallState = { available: false, installed: false };
let state = INITIAL_STATE;
let promptEvent: InstallPromptEvent | null = null;
let listening = false;
const subscribers = new Set<() => void>();

function publish(next: InstallState) {
  state = next;
  subscribers.forEach((subscriber) => subscriber());
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && Boolean(navigator.standalone));
}

function startListening() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  publish({ ...state, installed: isStandalone() });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    promptEvent = event as InstallPromptEvent;
    publish({ ...state, available: true });
  });

  window.addEventListener('appinstalled', () => {
    promptEvent = null;
    publish({ available: false, installed: true });
  });
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  startListening();
  return () => subscribers.delete(callback);
}

function getSnapshot() {
  return state;
}

export function usePwaInstall() {
  const installState = useSyncExternalStore(subscribe, getSnapshot, () => INITIAL_STATE);

  const promptInstall = async () => {
    if (!promptEvent) return 'unavailable' as const;
    const currentPrompt = promptEvent;
    try {
      await currentPrompt.prompt();
      const { outcome } = await currentPrompt.userChoice;
      promptEvent = null;
      publish({ ...state, available: false, installed: outcome === 'accepted' });
      return outcome;
    } catch {
      promptEvent = null;
      publish({ ...state, available: false });
      return 'unavailable' as const;
    }
  };

  return { ...installState, promptInstall };
}
