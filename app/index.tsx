import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";

const slogans = [
  "🔥 Suivez l’activité de la ville...",
  "📍 Ne ratez aucun événement...",
  "🚨 Visualisez en temps réel...",
  "🎉 Explorez les zones les plus actives !",
];

export default function Index() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [sloganIndex, setSloganIndex] = useState(0);

  useEffect(() => {
    // Lancement animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Changement automatique du slogan
    const sloganTimer = setInterval(() => {
      setSloganIndex((prev) => (prev + 1) % slogans.length);
    }, 4000);

    // Redirection après 3 sec
    const navigationTimer = setTimeout(() => {
      router.push("/map");
    }, 3000);

    return () => {
      clearInterval(sloganTimer);
      clearTimeout(navigationTimer);
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      {/*Particules d'ambiance */}
      {[...Array(20)].map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              top: Math.random() * Dimensions.get("window").height,
              left: Math.random() * Dimensions.get("window").width,
              opacity: Math.random(),
              transform: [{ scale: Math.random() * 1.5 + 0.5 }],
            },
          ]}
        />
      ))}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Ionicons name="map" size={80} color="tomato" style={styles.icon} />
        </Animated.View>

        <Text style={styles.title}>Bienvenue sur EventMap</Text>
        <Text style={styles.subtitle}>{slogans[sloganIndex]}</Text>

        <View style={styles.progressBar}>
          <Animated.View
            style={[styles.progressFill, { width: progressWidth }]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fffaf9",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  icon: {
    marginBottom: 30,
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
    color: "tomato",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#444",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },
  progressBar: {
    height: 4,
    width: "80%",
    backgroundColor: "#ffece8",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "tomato",
  },
  particle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ff6347",
  },
});
