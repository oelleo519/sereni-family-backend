"variant":"standard",
"id":"48319"
}
const express = require("express");
const { google } = require("googleapis");
const cors = require("cors");

const app = express();
app.use(cors());

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "[https://sereni-family-backend.onrender.com/auth/google/callback](https://sereni-family-backend.onrender.com/auth/google/callback)";

// 1️⃣ Route pour lancer la connexion Google
app.get("/auth/google", (req, res) => {
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const url = oauth2Client.generateAuthUrl({
access_type: "offline",
scope: ["[https://www.googleapis.com/auth/gmail.readonly](https://www.googleapis.com/auth/gmail.readonly)"],
});

return res.redirect(url);
});

// 2️⃣ Route callback (Google te renvoie ici)
app.get("/auth/google/callback", async (req, res) => {
const code = req.query.code;

try {
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const { tokens } = await oauth2Client.getToken(code);

```
return res.send("Connexion réussie ✔️ Vous pouvez fermer cette fenêtre.");
```

} catch (error) {
return res.status(500).send("Erreur OAuth : " + error.message);
}
});

// 3️⃣ Page d’accueil (évite le “Cannot GET /”)
app.get("/", (req, res) => {
res.send("Backend opérationnel ✔️");
});

app.listen(10000, () => {
console.log("Serveur actif sur port 10000");
});
