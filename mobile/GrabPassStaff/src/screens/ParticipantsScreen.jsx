// src/screens/ParticipantsScreen.jsx
import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export default function ParticipantsScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Participants screen (TODO)</Text>
    </View>
  );
}