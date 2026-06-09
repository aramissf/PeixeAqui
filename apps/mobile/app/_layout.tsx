import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { StatusBar } from 'expo-status-bar'
import { colors } from '@peixeaqui/ui'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30,  // 30 min
      gcTime: 1000 * 60 * 60 * 24, // 24h
      retry: 2,
    },
  },
})

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'peixeaqui-query-cache',
})

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        <StatusBar style="light" backgroundColor={colors.dark.bgPrimary} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.dark.bgPrimary },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="tabs" />
          <Stack.Screen name="spot/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
        </Stack>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  )
}
