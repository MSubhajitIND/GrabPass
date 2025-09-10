// src/screens/AllScansScreen.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setToken } from "../utils/api";
import { useTheme } from "../theme/ThemeContext";

/**
 * AllScansScreen - lists registrations for an event and allows check-in toggle.
 * Expects route.params.event
 */
export default function AllScansScreen({ navigation, route }) {
  const event = route?.params?.event;
  const { colors } = useTheme();

  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!event) {
      Alert.alert("Error", "Event not provided");
      navigation.goBack();
      return;
    }
    // set header title and back button properly
    navigation.setOptions({ title: event.title || "Participants" });
    bootstrapAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  // bootstrap token from AsyncStorage and fetch registrations
  const bootstrapAndFetch = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("gp_staff_token");
      if (token) {
        setToken(token);
      } else {
        // no staff token — if server allows demo admin in dev you can set it here:
        if (process.env.NODE_ENV !== "production") {
          setToken("demo-admin-token");
        }
      }
      await fetchRegs();
    } catch (err) {
      console.warn("bootstrap error:", err);
      Alert.alert("Error", "Could not initialize. See console.");
    } finally {
      setLoading(false);
    }
  };

  // fetch registrations for event
  const fetchRegs = async () => {
    if (!event?._id) return;
    try {
      const res = await api.get("/registrations", { params: { eventId: event._id } });
      setRegs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetch regs error:", err);
      const msg = err?.response?.data?.error || err.message || "Failed to load registrations";
      Alert.alert("Failed to load", msg);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchRegs();
    } finally {
      setRefreshing(false);
    }
  }, [event]);

  // optimistic toggle checkin
  const toggleCheckin = async (reg) => {
    const newChecked = !reg.checkedIn;
    // optimistic update
    setRegs((prev) => prev.map((r) => (r._id === reg._id ? { ...r, checkedIn: newChecked } : r)));
    try {
      const res = await api.patch(`/registrations/${reg._id}/checkin`, { checkedIn: newChecked });
      // update with server response (checkedIn/checkedInAt)
      setRegs((prev) => prev.map((r) => (r._id === reg._id ? { ...r, ...res.data } : r)));
    } catch (err) {
      console.error("checkin error", err);
      // rollback
      setRegs((prev) => prev.map((r) => (r._id === reg._id ? { ...r, checkedIn: reg.checkedIn } : r)));
      Alert.alert("Update failed", err?.response?.data?.error || err.message || "Could not update check-in");
    }
  };

  const filtered = regs.filter((r) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      String(r.userName || "").toLowerCase().includes(q) ||
      String(r.email || "").toLowerCase().includes(q) ||
      String(r.studentCode || "").toLowerCase().includes(q) ||
      String(r.dept || "").toLowerCase().includes(q)
    );
  });

  function renderItem({ item }) {
    return (
      <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border || "#0000000D" }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{item.userName || "—"}</Text>
          {item.email ? <Text style={[styles.meta, { color: colors.muted }]}>{item.email}</Text> : null}
          <View style={{ flexDirection: "row", marginTop: 8 }}>
            {item.studentCode ? <Text style={[styles.small, { color: colors.muted, marginRight: 12 }]}>{item.studentCode}</Text> : null}
            {item.dept ? <Text style={[styles.small, { color: colors.muted }]}>{item.dept}</Text> : null}
          </View>
        </View>

        <View style={{ alignItems: "flex-end", justifyContent: "space-between" }}>
          <View style={[styles.badge, { backgroundColor: item.checkedIn ? "#22c55e20" : "#f3f4f6" }]}>
            <Text style={{ color: item.checkedIn ? "#065f46" : "#374151", fontWeight: "700" }}>{item.checkedIn ? "Checked" : "Not checked"}</Text>
          </View>

          <TouchableOpacity
            style={[styles.action, { backgroundColor: item.checkedIn ? "#e5e7eb" : "#2563eb" }]}
            onPress={() => toggleCheckin(item)}
          >
            <Text style={{ color: item.checkedIn ? "#111" : "#fff", fontWeight: "700" }}>{item.checkedIn ? "Undo" : "Mark present"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {event.title}
          </Text>
          <Text style={[styles.count, { color: colors.muted }]}>
            {regs.length} participant{regs.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            placeholder="Search name / email / student code..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          />
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Text style={{ color: "#2563eb", fontWeight: "700" }}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ marginTop: 24, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(i) => i._id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
            ListEmptyComponent={
              <View style={{ marginTop: 40, alignItems: "center" }}>
                <Text style={{ color: colors.muted }}>No registrations yet.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "800", maxWidth: "78%" },
  count: { fontSize: 13 },
  searchRow: { flexDirection: "row", marginBottom: 12, alignItems: "center" },
  searchInput: { flex: 1, padding: 10, borderRadius: 10, marginRight: 8, fontSize: 14, borderWidth: 1 },
  refreshBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  row: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  name: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 13, marginTop: 4 },
  small: { fontSize: 12, color: "#666" },
  badge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginBottom: 8 },
  action: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
});