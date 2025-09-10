// App.js
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootStack from "./src/navigation";
import { ThemeProvider } from "./src/theme/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setToken } from "./src/utils/api";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    // Run once at app startup to restore saved staff token (if any).
    async function bootstrap() {
      try {
        const token = await AsyncStorage.getItem("gp_staff_token");
        if (token) {
          setToken(token); // apply to your axios instance
        }
      } catch (err) {
        console.warn("bootstrap error", err);
      } finally {
        setBootstrapped(true);
      }
    }
    bootstrap();
  }, []);

  if (!bootstrapped) {
    // Show a simple loading screen until bootstrap completes
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootStack />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}