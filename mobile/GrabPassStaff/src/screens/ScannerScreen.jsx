// src/screens/ScannerScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../utils/api";
import { useTheme } from "../theme/ThemeContext";

/**
 * ScannerScreen (NO camera, NO upload)
 * - Manual paste of token or ticket URL
 * - "View participants" (AllScans) button
 * - Sends { token, eventId, autoCheckin: true } to POST /api/scan-verify
 *
 * route.params.event  -> optional event object (used for eventId)
 * Navigates to "Result" with { result } (same shape used elsewhere)
 */
export default function ScannerScreen({ navigation, route }) {
  const { event } = route.params || {};
  const { colors } = useTheme();

  const [manualToken, setManualToken] = useState("");
  const [busy, setBusy] = useState(false);

  function extractToken(raw) {
    if (!raw) return null;
    try {
      const u = new URL(raw);
      return u.searchParams.get("token") || raw;
    } catch {
      return raw;
    }
  }

  async function verifyToken(token) {
    if (!token) {
      Alert.alert("No token", "Please paste a ticket token or URL.");
      return;
    }
    setBusy(true);
    try {
      const body = { token, autoCheckin: true };
      if (event && event._id) body.eventId = event._id;
      const res = await api.post("/scan-verify", body);
      const data = res.data || {};
      // forward server response to Result screen
      navigation.replace("Result", { result: data, event });
    } catch (err) {
      console.error("verifyToken error", err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || err.message || "Verification failed";
      navigation.replace("Result", { result: { ok: false, status: "error", message: msg } });
    } finally {
      setBusy(false);
    }
  }

  const onVerifyPress = () => {
    const t = extractToken(manualToken.trim());
    verifyToken(t);
  };

  const openParticipants = () => {
    navigation.navigate("AllScans", { event });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Warning header (no camera available) */}
        <View style={[styles.warningBox, { backgroundColor: colors.card, borderColor: colors.muted + "33" }]}>
          <Text style={[styles.warningIcon, { color: "#f59e0b" }]}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.warningTitle, { color: colors.text }]}>No camera available</Text>
            <Text style={[styles.warningMsg, { color: colors.muted }]}>
              This Emulator does not include a native camera scanner. Use the manual token input below or check participants.
            </Text>
          </View>
        </View>

        {/* Event title */}
        <Text style={[styles.eventTitle, { color: colors.text }]}>{event?.title || "Verify ticket"}</Text>

        <Text style={[styles.label, { color: colors.muted }]}>Paste ticket token or full ticket URL</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.muted + "22" }]}
          value={manualToken}
          onChangeText={setManualToken}
          placeholder="token or https://.../ticket?token=..."
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.row}>
          <TouchableOpacity onPress={onVerifyPress} style={[styles.verifyBtn, { backgroundColor: "#10b981" }]} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyText}>Verify token</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={openParticipants} style={[styles.partBtn, { borderColor: colors.muted + "22" }]}>
            <Text style={[styles.partText, { color: colors.text }]}>View participants</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 18 }}>
          <Text style={{ color: colors.muted }}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16, flex: 1 },
  warningBox: { flexDirection: "row", padding: 12, borderRadius: 10, marginBottom: 14, borderWidth: 1 },
  warningIcon: { fontSize: 28, marginRight: 10, lineHeight: 32 },
  warningTitle: { fontWeight: "800", fontSize: 16 },
  warningMsg: { marginTop: 2, fontSize: 13 },

  eventTitle: { fontSize: 22, fontWeight: "800", marginTop: 6 },
  label: { marginTop: 14, marginBottom: 6, fontSize: 13 },

  input: { height: 48, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1 },
  row: { flexDirection: "row", marginTop: 12, alignItems: "center" },
  verifyBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 8 },
  verifyText: { color: "#fff", fontWeight: "800" },
  partBtn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  partText: { fontWeight: "700" },
});