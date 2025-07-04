import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Heatmap, Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

interface HeatPoint {
  latitude: number;
  longitude: number;
  weight: number;
  title?: string;
  description?: string;
  intensity?: number;
  isNew?: boolean;
}

interface HeatMapViewProps {
  points: HeatPoint[];
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
}

export default function HeatMapView({ points, initialLocation }: HeatMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>({
    latitude: initialLocation?.latitude || -18.8792,
    longitude: initialLocation?.longitude || 47.5079,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [selectedPoint, setSelectedPoint] = useState<HeatPoint | null>(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid">("standard");

  // Animation refs pour les nouveaux points
  const scaleAnims = useRef<{[key: string]: Animated.Value}>({});

  // Initialiser les animations
  points.forEach(point => {
    const key = `${point.latitude}-${point.longitude}`;
    if (!scaleAnims.current[key]) {
      scaleAnims.current[key] = new Animated.Value(point.isNew ? 0 : 1);
    }
  });

  // Lancer les animations pour les nouveaux points
  points.forEach(point => {
    if (point.isNew) {
      const key = `${point.latitude}-${point.longitude}`;
      Animated.spring(scaleAnims.current[key], {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    }
  });

  const focusInitialLocation = () => {
    mapRef.current?.animateToRegion({
      latitude: initialLocation?.latitude || -18.8792,
      longitude: initialLocation?.longitude || 47.5079,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    });
  };

  // Calcul des points avec intensité normalisée
  const maxIntensity = Math.max(...points.map(p => p.intensity || p.weight), 1);
  const normalizedPoints = points.map(point => ({
    ...point,
    weight: (point.intensity ? point.intensity : point.weight) / maxIntensity,
  }));

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsBuildings
        mapType={mapType}
      >
        {/* Heatmap */}
        {heatmapEnabled && normalizedPoints.length > 0 && (
          <Heatmap
            points={normalizedPoints}
            radius={40}
            opacity={0.8}
            gradient={{
              colors: ["#00f", "#0ff", "#0f0", "#ff0", "#f00"],
              startPoints: [0.1, 0.25, 0.5, 0.75, 1],
              colorMapSize: 1000,
            }}
          />
        )}

        {/* Marqueurs avec animation */}
        {normalizedPoints.map((point, index) => {
          const key = `${point.latitude}-${point.longitude}`;
          const scale = scaleAnims.current[key] || new Animated.Value(1);
          
          return (
            <Marker
              key={`${key}-${index}`}
              coordinate={{
                latitude: point.latitude,
                longitude: point.longitude,
              }}
              onPress={() => setSelectedPoint(point)}
            >
              <Animated.View style={{
                transform: [{ scale }],
                opacity: scale,
              }}>
                <View style={styles.marker}>
                  <Ionicons 
                    name="location" 
                    size={24} 
                    color={point.intensity ? getIntensityColor(point.intensity) : "tomato"} 
                  />
                </View>
              </Animated.View>
            </Marker>
          );
        })}
      </MapView>

      {/* Contrôles de la carte */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={focusInitialLocation}
        >
          <Ionicons name="locate" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => setHeatmapEnabled(!heatmapEnabled)}
        >
          <Ionicons 
            name={heatmapEnabled ? "layers" : "layers-outline"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => setMapType(
            mapType === "standard" ? "satellite" : 
            mapType === "satellite" ? "hybrid" : "standard"
          )}
        >
          <Ionicons 
            name={mapType === "satellite" ? "map" : "map-outline"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </View>

      {/* Fenêtre d'information (reste inchangée) */}
      {selectedPoint && (
        <View style={styles.infoWindow}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedPoint(null)}
          >
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.infoTitle}>{selectedPoint.title || "Point d'intérêt"}</Text>
          {selectedPoint.description && (
            <Text style={styles.infoDescription}>{selectedPoint.description}</Text>
          )}
          <Text style={styles.infoCoords}>
            {selectedPoint.latitude.toFixed(4)}, {selectedPoint.longitude.toFixed(4)}
          </Text>
          {selectedPoint.intensity && (
            <View style={styles.intensityBadge}>
              <Text style={styles.intensityText}>
                Intensité: {Math.round(selectedPoint.intensity * 100)}%
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const getIntensityColor = (intensity: number) => {
  if (intensity < 0.3) return "#4CAF50"; // Vert
  if (intensity < 0.6) return "#FFC107"; // Jaune
  return "#F44336"; // Rouge
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  controls: {
    position: 'absolute',
    top: 20,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 10,
  },
  controlButton: {
    marginVertical: 5,
  },
  marker: {
    alignItems: 'center',
  },
  infoWindow: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'tomato',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  infoCoords: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  intensityBadge: {
    backgroundColor: '#f5f5f5',
    padding: 5,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  intensityText: {
    fontSize: 12,
    color: '#333',
  },
});