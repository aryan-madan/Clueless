
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aryan.clueless',
  appName: 'Clueless',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    TabsBar: {
    }
  }
};

export default config;