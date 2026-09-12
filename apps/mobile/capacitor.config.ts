import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.manifestcrm.mobile',
  appName: 'Manifestation & Execution CRM',
  webDir: 'www',
  backgroundColor: '#F7FAF8',
  android: {
    backgroundColor: '#F7FAF8',
  },
  server: {
    // During local development against a live web server instead of the bundled build, uncomment:
    // url: 'http://10.0.2.2:5173',
    // cleartext: true,
    androidScheme: 'https',
  },
};

export default config;
