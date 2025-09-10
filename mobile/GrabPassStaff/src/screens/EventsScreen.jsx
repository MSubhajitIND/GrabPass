// src/screens/EventsScreen.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
} from "react-native";
import api from "../utils/api";
import { useTheme } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setToken } from "../utils/api";

export default function EventsScreen({ navigation }) {
  const { colors, toggle } = useTheme();
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("upcoming");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("gp_staff_token");
        if (token) setToken(token);
      } catch (err) {
        console.warn("restore token err", err);
      }
      fetchEvents();
    })();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await api.get("/events");
      setEvents(res.data || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = events.filter((ev) => {
    if (filter === "all") return true;
    const now = new Date();
    if (!ev.startAt) return filter === "upcoming";
    return filter === "upcoming"
      ? new Date(ev.startAt) >= now
      : new Date(ev.startAt) < now;
  });

  function handleSignOut() {
    AsyncStorage.removeItem("gp_staff_token");
    setToken(null);
    navigation.replace("Login");
  }

  function renderCard(item) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder || "#00000018",
            shadowColor: colors.shadow || "#000",
          },
        ]}
      >
        {item.bannerUrl ? (
          <Image source={{ uri: item.bannerUrl }} style={styles.banner} />
        ) : (
          <View style={[styles.banner, styles.bannerPlaceholder, { backgroundColor: colors.placeholder }]}>
            <Text style={{ color: colors.muted }}>No image</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.cardDesc, { color: colors.muted }]} numberOfLines={2}>
            {item.description || "No description"}
          </Text>

          <View style={styles.rowBetween}>
            <Text style={{ color: colors.muted }}>
              Seats: {item.registeredCount || 0}/{item.maxSeats || "∞"}
            </Text>
            <Text style={{ color: colors.muted }}>
              {item.startAt ? new Date(item.startAt).toLocaleString() : ""}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Scanner", { event: item })}
              style={[styles.scanBtn, { backgroundColor: colors.accent }]}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("AllScans", { event: item })}
              style={[styles.listBtn, { borderColor: colors.border || "#ddd", backgroundColor: colors.listBtnBg }]}
            >
              <Text style={{ color: colors.text }}>All Participants</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Android top padding to avoid status bar overlap (useful when status bar is translucent)
  const androidPaddingTop = Platform.OS === "android" ? RNStatusBar.currentHeight || 0 : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, paddingTop: androidPaddingTop }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Events</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggle} style={styles.iconButton}>
              <Text style={{ fontSize: 18 }}>{colors.isDark ? "🌙" : "☀️"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSignOut} style={{ marginLeft: 12 }}>
              <Text style={{ color: colors.muted }}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterRow}>
          {["upcoming", "past", "all"].map((f) => {
            const active = filter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterBtn,
                  {
                    backgroundColor: active ? colors.accent : "transparent",
                    borderColor: active ? colors.accent : colors.muted + "33",
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? "#fff" : colors.muted,
                    fontWeight: active ? "600" : "500",
                    textTransform: "capitalize",
                  }}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 6 }}
          showsVerticalScrollIndicator={false}
          data={filtered}
          keyExtractor={(i) => i._id}
          renderItem={({ item }) => renderCard(item)}
          refreshing={loading}
          onRefresh={fetchEvents}
          ListEmptyComponent={
            !loading ? (
              <View style={{ padding: 24 }}>
                <Text style={{ color: colors.muted, textAlign: "center" }}>No events found.</Text>
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 12 },
  headerRow: {
    marginTop: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 2,
    paddingBottom: 6,
  },
  title: { fontSize: 36, fontWeight: "900" },
  headerActions: { flexDirection: "row", alignItems: "center" },
  iconButton: {
    padding: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 12,
    paddingTop: 6,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },

  card: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  banner: { width: "100%", height: 160, backgroundColor: "#ddd" },
  bannerPlaceholder: { alignItems: "center", justifyContent: "center" },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 20, fontWeight: "800", marginBottom: 6 },
  cardDesc: { fontSize: 14 },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },

  actionsRow: { flexDirection: "row", marginTop: 12, alignItems: "center" },
  scanBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, marginRight: 10 },
  listBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
});