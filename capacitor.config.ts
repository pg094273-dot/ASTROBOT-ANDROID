import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.astronova3d.tv',
  appName: 'Astro Nova 3D',
  webDir: 'dist',
  android: {
    backgroundColor: '#060b19',
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
    // Mantener la pantalla encendida mientras se juega (gestionado desde MainActivity.java)
    // Soporte para Android TV / Google TV
    // AndroidManifest se configura manualmente en android/app/src/main/AndroidManifest.xml
  },
  server: {
    androidScheme: 'https',
    // Los archivos del juego van empaquetados localmente (sin conexión)
    // No se usa cleartext ni URLs remotas
  },
  // Plugins opcionales para Android
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#060b19',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      backgroundColor: '#060b19',
      style: 'DARK',
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
    },
  },
};

export default config;
