import { registerForPushNotificationsAsync } from '@/lib/notifications';
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import { supabase } from "../lib/superbase";
import AccountCard from "./screens/components/Accountcard";
import LoginRegisterModal from "./screens/components/LoginRegisterModal";

export default function AccountScreen() {
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

  const getAvatarUrl = (filename: string | null) => {
    return filename
      ? `https://gshttimhddsafhkhhicy.supabase.co/storage/v1/object/public/${filename}`
      : "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  };

  // 🔄 Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, email");

      if (!error) setUsers(data || []);
      else console.error("❌ Profile fetch error:", error.message);
    };

    fetchUsers();
  }, []);

  // 🔔 Setup push token
  useEffect(() => {
    const setupPush = async () => {
      const token = await registerForPushNotificationsAsync();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && token) {
        await supabase
          .from("profiles")
          .update({ expo_token: token })
          .eq("id", user.id);
      }
    };

    setupPush();
  }, []);

  const handleUserPress = (user: any) => {
    setSelectedUser(user);
    setIsRegistering(false);
    setShowModal(true);
  };

  const handleAddAccount = () => {
    setSelectedUser(null);
    setIsRegistering(true);
    setShowModal(true);
  };

  const handleSubmit = async ({ email, password, username }: any) => {
    try {
      let user = null;
      let error = null;

      if (isRegistering) {
        const signUpResponse = await supabase.auth.signUp({ email, password });
        user = signUpResponse.data?.user || null;
        error = signUpResponse.error;

        if (error) {
          alert("Registration failed: " + error.message);
          return;
        }

        if (user) {
          await supabase.from("profiles").insert({
            id: user.id,
            name: username,
            email,
            avatar_url: "",
          });
        }
      } else {
        const signInResponse = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        user = signInResponse.data?.user || null;
        error = signInResponse.error;

        if (error) {
          alert("Login failed: " + error.message);
          return;
        }
      }

      const matched = users.find((u) => u.email === email);
      const name = matched?.name || username;
      const image = getAvatarUrl(matched?.avatar_url || "");

      if (name.toLowerCase() === "emem") {
        router.push({ pathname: "/teamLeadHome", params: { name, image } });
      } else {
        router.push({ pathname: "/main", params: { name, image } });
      }

      setShowModal(false);
      ToastAndroid.showWithGravity(
        "Login Successful 🎉",
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM
      );
    } catch (e: any) {
      console.error(e);
      alert("Unexpected error: " + e.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.title}>
        <MaskedView
          maskElement={
            <Text style={[styles.titleText, { backgroundColor: "transparent" }]}>
              Who&apos;s Solving?
            </Text>
          }
        >
          <LinearGradient
            colors={["#fff", "#E38A33"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.titleText, { opacity: 0 }]}>Who&apos;s Solving?</Text>
          </LinearGradient>
        </MaskedView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {users.map((user, index) => (
          <AccountCard
            key={index}
            name={user.name || "Unnamed"}
            imageUri={getAvatarUrl(user.avatar_url)}
            onPress={() => handleUserPress(user)}
          />
        ))}

        <AccountCard
          name="Add Account"
          imageUri="https://cdn-icons-png.flaticon.com/512/1828/1828817.png"
          onPress={handleAddAccount}
        />
      </ScrollView>

      <LoginRegisterModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        username={selectedUser?.name || ""}
        email={selectedUser?.email || ""}
        isRegistering={isRegistering}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2A2827",
  },
  title: {
    alignItems: "center",
    marginTop: 100,
  },
  titleText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  scrollContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 15,
    paddingBottom: 100,
    minHeight: "100%",
  },
});
