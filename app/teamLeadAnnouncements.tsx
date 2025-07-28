import { supabase } from "@/lib/superbase";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import TopBar from "./screens/components/TopBar";

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
  }, []);

  const canDelete = (announcement: Announcement) => {
    return (
      currentUserId === announcement.created_by ||
      currentUserName === "Emem"
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
      <TopBar forceShowBackButton={true} />
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
