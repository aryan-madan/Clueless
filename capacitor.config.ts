import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clueless.app',
  appName: 'Clueless',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    TabsBar: {
      // plugin specific config if needed in future
    }
  }
};

export default config;