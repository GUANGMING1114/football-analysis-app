import { Link, Stack } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#07111f' },
          headerTintColor: '#f8fafc',
          contentStyle: { backgroundColor: '#07111f' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: '足球分析模型',
            headerRight: () => (
              <Link href="/history" asChild>
                <Pressable style={{ marginRight: 16 }}>
                  <Text style={{ color: '#7dd3fc', fontWeight: '800' }}>历史</Text>
                </Pressable>
              </Link>
            ),
          }}
        />
        <Stack.Screen name="match/[id]" options={{ title: '比赛分析' }} />
        <Stack.Screen name="history/index" options={{ title: '历史预测' }} />
        <Stack.Screen name="history/stats" options={{ title: '复盘统计' }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
