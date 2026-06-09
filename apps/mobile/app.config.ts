import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'PeixeAqui',
  slug: 'peixeaqui',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0E1A',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.peixeaqui.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Para mostrar pontos de pesca próximos e condições locais.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'Para alertas de condições ideais nos seus pontos favoritos.',
      NSPhotoLibraryUsageDescription: 'Para adicionar fotos nos pontos de pesca.',
      NSCameraUsageDescription: 'Para fotografar o seu peixe ou o ponto de pesca.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0A0E1A',
    },
    package: 'com.peixeaqui.app',
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'CAMERA',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'Para alertas de condições ideais nos seus pontos favoritos.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#0AABB5',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: 'REPLACE_WITH_EAS_PROJECT_ID',
    },
  },
}

export default config
