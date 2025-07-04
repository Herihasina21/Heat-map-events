import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Text, View } from "react-native";
import HeatMapView from "../components/HeatMapView";
import { db } from "../config/firebase";
import socket from "../services/socket";

interface EventPoint {
  latitude: number;
  longitude: number;
  weight: number;
  title?: string;
  timestamp?: Date;
  isNew?: boolean; //nouveau event
}

const MAX_EVENTS = 20;

export default function MapScreen() {
  const [points, setPoints] = useState<EventPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEventCount, setNewEventCount] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Charger les points initiaux depuis Firebase
  const loadInitialPoints = async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(collection(db, "events"));
      const data: EventPoint[] = snapshot.docs
        .map((doc) => {
          const d = doc.data();
          return {
            latitude: d.lat,
            longitude: d.lng,
            weight: d.intensity || 1,
            title: d.title || "Événement",
            timestamp: d.timestamp?.toDate?.() ?? new Date(0),
            isNew: false,
          };
        })
        .sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime())
        .slice(-MAX_EVENTS);
      setPoints(data);
    } catch (err) {
      console.error("Erreur lors du chargement des points Firebase :", err);
      setError("Impossible de charger les événements.");
    } finally {
      setLoading(false);
    }
  };

  // Animation pour les nouveaux événements
  const showNewEventNotification = () => {
    setNewEventCount(prev => prev + 1);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 2000);
    });
  };

  useEffect(() => {
    loadInitialPoints();

    // Handler pour les nouveaux événements via WebSocket
    const handleNewEvent = (data: { lat: number; lng: number; intensity: number; title?: string }) => {
      showNewEventNotification();
      
      const newPoint = {
        latitude: data.lat,
        longitude: data.lng,
        weight: data.intensity,
        title: data.title || "Événement",
        timestamp: new Date(),
        isNew: true,
      };

      setPoints((prev) => {
        const updated = [...prev, newPoint].slice(-MAX_EVENTS);
        return updated;
      });

      // Retirer le flag isNew après 2 secondes
      setTimeout(() => {
        setPoints(current => current.map(p => 
          p === newPoint ? {...p, isNew: false} : p
        ));
      }, 2000);
    };

    socket.on("new-event", handleNewEvent);

    return () => {
      socket.off("new-event", handleNewEvent);
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Chargement des événements...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <HeatMapView points={points} />
      
      {/* Notification des nouveaux événements */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 50,
          alignSelf: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: 10,
          borderRadius: 20,
          flexDirection: 'row',
          alignItems: 'center',
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0]
            })
          }]
        }}
      >
        <Ionicons name="notifications" size={20} color="#4CAF50" style={{ marginRight: 5 }} />
        <Text style={{ color: 'white' }}>
          {newEventCount} nouveau{newEventCount > 1 ? 'x' : ''} événement{newEventCount > 1 ? 's' : ''}
        </Text>
      </Animated.View>
    </View>
  );
}