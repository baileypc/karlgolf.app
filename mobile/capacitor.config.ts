import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.karlgolf.gir',
  appName: 'Karl Golf GIR',
  webDir: '../dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
