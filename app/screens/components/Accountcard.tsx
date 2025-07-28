// app/components/Accountcard.tsx

import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity } from "react-native";

interface Props {
  name: string;
  imageUri: string;
  onPress: () => void;
}

const fallbackImage = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const AccountCard: React.FC<Props> = ({ name, imageUri, onPress }) => {
  const [imgSrc, setImgSrc] = useState(imageUri || fallbackImage);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: imgSrc }}
        style={[styles.image, !isLoaded && styles.placeholder]}
        onError={() => {
          setImgSrc(fallbackImage);
          console.warn(`⚠️ Failed to load image: ${imageUri}`);
        }}
        onLoad={() => setIsLoaded(true)}
      />
      <Text style={styles.name}>{name || "Unnamed"}</Text>
    </TouchableOpacity>
  );
};

export default AccountCard;

const styles = StyleSheet.create({
  card: {
    width: 100,
    height: 140,
    borderRadius: 12,
    margin: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: "#ccc",
  },
  placeholder: {
    backgroundColor: "#555",
  },
  name: {
    marginTop: 8,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});
