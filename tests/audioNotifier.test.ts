import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  playClassChime,
  playPrayerChime,
  updateAppBadge,
  sendPushNotification,
} from '../src/shared/lib/audioNotifier';

describe('audioNotifier', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('playClassChime', () => {
    it('does not throw when AudioContext is unavailable', () => {
      const originalWindow = globalThis.window;
      delete (globalThis as { window?: Window }).window;
      expect(() => playClassChime()).not.toThrow();
      globalThis.window = originalWindow;
    });

    it('creates oscillators when AudioContext exists', () => {
      const start = vi.fn();
      const stop = vi.fn();
      const connect = vi.fn();
      const createOscillator = vi.fn(function () {
        return {
          type: '',
          frequency: { setValueAtTime: vi.fn() },
          connect,
          start,
          stop,
        };
      });
      const createGain = vi.fn(function () {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect,
        };
      });
      const AudioContextMock = vi.fn(function () {
        return {
          currentTime: 0,
          destination: {},
          createOscillator,
          createGain,
        };
      });

      const originalWindow = globalThis.window;
      Object.defineProperty(globalThis, 'window', {
        value: { AudioContext: AudioContextMock },
        writable: true,
        configurable: true,
      });

      playClassChime();

      expect(AudioContextMock).toHaveBeenCalled();
      expect(createOscillator).toHaveBeenCalledTimes(3);
      expect(createGain).toHaveBeenCalledTimes(3);
      expect(start).toHaveBeenCalledTimes(3);
      expect(stop).toHaveBeenCalledTimes(3);

      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('playPrayerChime', () => {
    it('does not throw when AudioContext is unavailable', () => {
      const originalWindow = globalThis.window;
      delete (globalThis as { window?: Window }).window;
      expect(() => playPrayerChime()).not.toThrow();
      globalThis.window = originalWindow;
    });
  });

  describe('updateAppBadge', () => {
    it('calls setAppBadge when available', async () => {
      const setAppBadge = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(globalThis, 'navigator', {
        value: { setAppBadge },
        writable: true,
        configurable: true,
      });

      updateAppBadge(5);
      await new Promise(r => setTimeout(r, 10));
      expect(setAppBadge).toHaveBeenCalledWith(5);
    });

    it('calls clearAppBadge when count is 0', async () => {
      const clearAppBadgeFn = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(globalThis, 'navigator', {
        value: { setAppBadge: vi.fn(), clearAppBadge: clearAppBadgeFn },
        writable: true,
        configurable: true,
      });

      updateAppBadge(0);
      await new Promise(r => setTimeout(r, 10));
      expect(clearAppBadgeFn).toHaveBeenCalled();
    });

    it('does not throw when badge API is unavailable', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });
      expect(() => updateAppBadge(3)).not.toThrow();
    });
  });

  describe('sendPushNotification', () => {
    it('does not throw when Notification is unavailable', () => {
      Object.defineProperty(globalThis, 'window', {
        value: {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });
      expect(() => sendPushNotification('Title', 'Body')).not.toThrow();
    });

    it('creates a notification when permission is granted', () => {
      const NotificationMock = vi.fn();
      const notification = Object.assign(NotificationMock, { permission: 'granted' });
      Object.defineProperty(globalThis, 'window', {
        value: { Notification: notification },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, 'Notification', {
        value: notification,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      sendPushNotification('Test', 'Body');
      expect(NotificationMock).toHaveBeenCalledWith('Test', expect.objectContaining({ body: 'Body' }));
    });
  });
});
