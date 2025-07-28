import { supabase } from "@/lib/superbase";
import { Audio } from "expo-av"; // ✅ Sound player
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import TopBar from "../screens/components/TopBar";

type Announcement = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  created_by: string;
  profiles: {
    name: string;
  };
};

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");

  const soundRef = useRef<Audio.Sound | null>(null); // 🎧 Sound reference

  useEffect(() => {
    const fetchUserAndAnnouncements = async () => {
      const session = await supabase.auth.getSession();
      const user = session.data?.session?.user;
      if (!user) return;

      setCurrentUserId(user.id);

      const profileRes = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      if (profileRes.data?.name) {
        setCurrentUserName(profileRes.data.name);
      }

      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, message, created_at, created_by, profiles(name)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setAnnouncements(data);
      }

      setLoading(false);
    };

    fetchUserAndAnnouncements();

    // ✅ Realtime listener for new announcements
    const channel = supabase
      .channel("realtime:announcements")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "announcements",
        },
        async (payload) => {
          const newItem = payload.new;
          const profile = await supabase
            .from("profiles")
            .select("name")
            .eq("id", newItem.created_by)
            .single();

         const newAnnouncement: Announcement = {
  id: payload.new.id,
  title: payload.new.title,
  message: payload.new.message,
  created_at: payload.new.created_at,
  created_by: payload.new.created_by,
  profiles: {
    name: profile.data?.name || "Unknown",
  },
};

          setAnnouncements((prev) => [newAnnouncement, ...prev]);

          // ✅ Play sound
      const { sound } = await Audio.Sound.createAsync(
  require('@/assets/sounds/notify.wav') // ✅ <-- this is the correct path and name
);

          soundRef.current = sound;
          await sound.playAsync();

          // ✅ Vibration (optional)
          Vibration.vibrate(300);

          Alert.alert("📢 New Announcement", newAnnouncement.title);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      soundRef.current?.unloadAsync(); // Cleanup sound
    };
  }, []);

  const canDelete = (announcement: Announcement) => {
    return (
      currentUserId === announcement.created_by ||
      currentUserName.toLowerCase() === "emem"
    );
  };

  const handleDelete = (announcement: Announcement) => {
    Alert.alert(
      "Delete Announcement",
      `Are you sure you want to delete "${announcement.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("announcements")
              .delete()
              .eq("id", announcement.id);

            if (!error) {
              setAnnouncements((prev) =>
                prev.filter((item) => item.id !== announcement.id)
              );
            } else {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TopBar forceShowBackButton />
      <Text style={styles.title}>Team Announcements</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#E38A33" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              disabled={!canDelete(item)}
              onPress={() => canDelete(item) && handleDelete(item)}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.createdBy}>
                Created by: {item.profiles?.name || "Unknown"}
              </Text>
              <Text style={styles.cardDate}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    marginTop: 16,
  },
  card: {
    backgroundColor: "#FFF4E9",
    borderLeftWidth: 5,
    borderLeftColor: "#E38A33",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
  },
  message: {
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
  },
  createdBy: {
    fontSize: 13,
    fontStyle: "italic",
    color: "#666",
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
  },
});
