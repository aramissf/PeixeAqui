import { Tabs } from 'expo-router'
import { View, Text } from 'react-native'
import { colors, spacing } from '@peixeaqui/ui'

// Minimal tab bar — icons only, no text labels below
function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: focused ? `${colors.brand.teal}22` : 'transparent',
      }}
    >
      {children}
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.dark.bgSurface,
          borderTopColor: colors.dark.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.brand.teal,
        tabBarInactiveTintColor: colors.text.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused}>
              <MapIcon color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused}>
              <SearchIcon color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="weather"
        options={{
          title: 'Condições',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused}>
              <WeatherIcon color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused}>
              <ProfileIcon color={color} />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  )
}

// Inline SVG icons using react-native-svg (Phosphor style: outline, 1.5px stroke)
import Svg, { Path, Circle } from 'react-native-svg'

function MapIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M9 3v15M15 6v15" stroke={color} strokeWidth={1.5} />
    </Svg>
  )
}

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={1.5} />
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  )
}

function WeatherIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 19a4 4 0 01-.33-7.98A6 6 0 0119 13H6z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M11 5V3M6.34 6.34L4.93 4.93M4 11H2M6.34 15.66l-1.41 1.41M17 11h2"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  )
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.5} />
      <Path
        d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  )
}
