import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prolineoms.app',
  appName: 'Proline OMS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
