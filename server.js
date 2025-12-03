// server.js (CommonJS compatible)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { google } = require("googleapis");

const app = express();
app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: "sereni-family-secret",
    resave: false,
    saveUninitialized: true,
  })
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

app.get("/auth/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
  res.redirect(url);
});

app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    res.json({
      success: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Google login error");
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Backend running on port " + PORT);
});
