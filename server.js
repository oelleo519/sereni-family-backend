import express from "express";
import cors from "cors";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// 1️⃣ Route pour démarrer la connexion Gmail
app.get("/auth/google", (req, res) => {
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/userinfo.email"
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes
  });

  res.redirect(url);
});

// 2️⃣ Callback après connexion Google
app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    res.send("Connexion Gmail réussie ! 🎉");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la connexion à Gmail");
  }
});

// 3️⃣ Lancer le serveur Render
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Backend SereniFamily lancé sur le port ${port}`);
});
