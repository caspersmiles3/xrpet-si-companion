import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xrpet.companion',
  appName: 'XRPet SI Companion',
  webDir: 'public',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  }
};

export default config;
