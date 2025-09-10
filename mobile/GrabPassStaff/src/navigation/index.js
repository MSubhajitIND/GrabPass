// mobile/src/navigation/index.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// import screens (adjust paths if your files are in different folders)
import LoginScreen from "../screens/LoginScreen";
import EventsScreen from "../screens/EventsScreen";
import ScannerScreen from "../screens/ScannerScreen";
import ResultScreen from "../screens/ResultScreen";
import AllScansScreen from "../screens/AllScansScreen";
import ParticipantsScreen from "../screens/ParticipantsScreen";

const Stack = createNativeStackNavigator();

export default function RootStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      {/* main staff flow */}
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="Scanner" component={ScannerScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="AllScans" component={AllScansScreen} />
      <Stack.Screen name="Participants" component={ParticipantsScreen} />
    </Stack.Navigator>
  );
}