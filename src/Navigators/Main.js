import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { ConnectionMenu, ExampleContainer, DataHistory } from '@/Containers'

const Stack = createStackNavigator()

// @refresh reset
const MainNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={ExampleContainer}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="Connection Menu" component={ConnectionMenu} />
      <Stack.Screen name="Data History" component={DataHistory} />
    </Stack.Navigator>
  )
}

export default MainNavigator
