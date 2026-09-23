import { registerPlugin } from '@capacitor/core';

interface DeviceRpaPlugin {
  getStatus(): Promise<{ available: boolean }>;
  openAccessibilitySettings(): Promise<void>;
  executeAction(options: {
    action: 'tap' | 'type' | 'scroll-forward' | 'scroll-backward';
    text?: string;
    viewId?: string;
  }): Promise<{ executed: boolean }>;
}

export const deviceRpa = registerPlugin<DeviceRpaPlugin>('DeviceRpa');
