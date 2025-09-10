// mobile/src/screens/LoginScreen.jsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setToken } from "../utils/api";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/staff/login", { email, password });
      const { token, role } = res.data;

      if (role !== "staff" && role !== "admin") {
        throw new Error("Not authorized as staff");
      }

      // save token locally and set default header
      await AsyncStorage.setItem("gp_staff_token", token);
      setToken(token);

      // Navigate to Events screen (registered name "Events" in RootStack)
      // use replace so back button doesn't go back to login
      navigation.replace("Events");
    } catch (err) {
      console.error("login error", err);
      Alert.alert("Login failed", err?.response?.data?.error || err?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GrabPass — Staff</Text>

      <TextInput
        style={styles.input}
        placeholder="Staff email"
        placeholderTextColor="#97a0b3"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#97a0b3"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={[styles.button, loading && { opacity: 0.8 }]} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 28,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#111827",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});