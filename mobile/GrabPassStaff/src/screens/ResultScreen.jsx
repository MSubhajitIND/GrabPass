// src/screens/ResultScreen.jsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import api from "../utils/api";

export default function ResultScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { result } = route.params || {};
  const reg = result?.registration;

  if (!result) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.text }}>No result</Text></View>;
  }

  if (!result.ok) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.danger }}>Invalid ticket</Text>
        <Text style={{ marginTop: 12, color: colors.muted }}>{result.message || "Not found"}</Text>
        <TouchableOpacity onPress={() => navigation.popToTop()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.accent }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (result.status === "used") {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#f59e0b" }}>Already checked-in</Text>
        <Text style={{ marginTop: 12, fontWeight: "700", fontSize: 18, color: colors.text }}>{reg?.userName}</Text>
        <Text style={{ color: colors.muted }}>{reg?.dept} • {reg?.studentCode}</Text>
        <TouchableOpacity onPress={() => navigation.popToTop()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.accent }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // valid & not used
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Text style={{ fontSize: 22, fontWeight: "900", color: colors.success }}>Entry permitted</Text>
      <Text style={{ marginTop: 12, fontSize: 18, fontWeight: "700", color: colors.text }}>{reg?.userName}</Text>
      <Text style={{ marginTop: 6, color: colors.muted }}>{reg?.dept} • {reg?.studentCode}</Text>

      <TouchableOpacity
        onPress={async () => {
          try {
            await api.patch(`/registrations/${reg._id}/checkin`, { checkedIn: true });
            navigation.popToTop();
          } catch (err) {
            alert(err?.response?.data?.error || err?.message || "error");
          }
        }}
        style={{ marginTop: 20, backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>Mark checked-in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }
});