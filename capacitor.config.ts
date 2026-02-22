import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hakan.apartmanapp',
  appName: 'ApartmanApp',
  webDir: 'out',
  server: {
    url: '192.168.16.218:3000:3000',
    cleartext: true
  }
};

export default config;
