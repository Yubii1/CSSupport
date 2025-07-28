import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (credentials: {
    email: string;
    password: string;
    username: string;
  }) => void;
  username: string;
  email: string;
  isRegistering: boolean;
}

export default function LoginRegisterModal({
  visible,
  onClose,
  onSubmit,
  username,
  email,
  isRegistering,
}: Props) {
  const [password, setPassword] = useState("");

  const handleAction = () => {
    if (!password) {
      alert("Password cannot be empty.");
      return;
    }

    onSubmit({ email, password, username });
    setPassword(""); // Reset after submit
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {isRegistering ? "Register as" : "Welcome back"},{" "}
            <Text style={{ color: "#E38A33" }}>{username}</Text>!
          </Text>

          <TextInput
            placeholder="Enter password"
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
          />

          <View style={styles.buttons}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleAction}>
              <Text style={styles.login}>
                {isRegistering ? "Register" : "Login"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#0008",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
  },
  title: {
    fontSize: 18,
    marginBottom: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancel: {
    color: "#999",
    fontWeight: "600",
  },
  login: {
    color: "#E38A33",
    fontWeight: "bold",
  },
});
