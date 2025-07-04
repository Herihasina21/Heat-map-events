const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//Fonction pour générer un titre en fonction de l’intensité
function generateTitle(intensity) {
  if (intensity >= 8) return "🚨 Événement majeur";
  if (intensity >= 5) return "🔥 Activité importante";
  if (intensity >= 3) return "📍 Mouvement modéré";
  return "🧍 Petit regroupement";
}

io.on("connection", (socket) => {
  console.log("Client connecté");

  setInterval(async () => {
    const intensity = Math.floor(Math.random() * 10) + 1;

    const event = {
      lat: -18.8792 + Math.random() * 0.05,
      lng: 47.5079 + Math.random() * 0.05,
      intensity,
      title: generateTitle(intensity), 
      timestamp: new Date(),
    };

    socket.emit("new-event", event);

    try {
      await db.collection("events").add(event);
      console.log("Événement ajouté :", event.title);
    } catch (error) {
      console.error("Erreur ajout Firestore :", error);
    }
  }, 5000);
});

server.listen(3000, () => {
  console.log("Serveur WebSocket lancé");
});