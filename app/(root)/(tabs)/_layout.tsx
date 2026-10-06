import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

function ISOTabs() {
  const isAdmin = useUserStore((state) => state.isAdmin);

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>

      {/* Admin-only tab */}
      {isAdmin && (
        <NativeTabs.Trigger name="create">
          <NativeTabs.Trigger.Label>Add Property</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="plus.circle.fill" md="add_circle" />
        </NativeTabs.Trigger>
      )}

      <NativeTabs.Trigger name="saved">
        <NativeTabs.Trigger.Label>Saved</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="heart.fill" md="favorite" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf="person.fill" md="person" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
function AndroidTabs() {
  const isAdmin = useUserStore((state) => state.isAdmin);

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => (<Ionicons name="home" size={size} color={color} />) }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ color, size }) => (<Ionicons name="search" size={size} color={color} />) }} />

      {/* Admin-only tab */}
      {isAdmin && (
        <Tabs.Screen name="create" options={{ title: 'Add Property', href: isAdmin ? undefined : null, tabBarIcon: ({ color, size }) => (<Ionicons name="add-circle" size={size} color={color} />) }} />
      )}
      {/* Admin-only tab */}

      <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: ({ color, size }) => (<Ionicons name="heart" size={size} color={color} />) }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => (<Ionicons name="person" size={size} color={color} />) }} />
    </Tabs>
  );
}

export default function TabsLayout() {
  return Platform.OS === 'ios' ? <ISOTabs /> : <AndroidTabs />;
}