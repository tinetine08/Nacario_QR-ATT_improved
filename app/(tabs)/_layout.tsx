import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#60A5FA',
        tabBarInactiveTintColor: '#94A3B8',
        headerStyle: { backgroundColor: '#0B1220' },
        headerShadowVisible: false,
        headerTintColor: '#F1F5F9',
        tabBarStyle: { backgroundColor: '#101A2B', borderTopColor: '#26364D', height: 64, paddingTop: 7, paddingBottom: 7 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home-sharp' : 'home-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'qr-code' : 'qr-code-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'time' : 'time-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />
        <Tabs.Screen
            name="teacher"
            options={{
              title: 'Teacher',
              tabBarIcon: ({ color, focused }) => (
                <FontAwesome5
                  name={focused ? 'graduation-cap' : 'graduation-cap'}
                  color={color}
                  size={24}
                />
              ),
            }}
          />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );

}
