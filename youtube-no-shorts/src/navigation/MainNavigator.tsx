import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import SubscriptionsScreen from '../screens/SubscriptionsScreen';
import {MainTabParamList} from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon = ({icon, focused}: {icon: string; focused: boolean}) => (
  <Text style={{fontSize: 22, opacity: focused ? 1 : 0.45}}>{icon}</Text>
);

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: '#0f0f0f'},
        headerTintColor: '#fff',
        headerTitleStyle: {fontWeight: '700'},
        tabBarStyle: {backgroundColor: '#0f0f0f', borderTopColor: '#1a1a1a'},
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#555',
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({focused}) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Search',
          tabBarIcon: ({focused}) => <TabIcon icon="🔍" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Subscriptions"
        component={SubscriptionsScreen}
        options={{
          title: 'Subscriptions',
          tabBarIcon: ({focused}) => <TabIcon icon="📺" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
