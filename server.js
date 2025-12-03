// server.js (remplacer tout le contenu par ceci)
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.set('trust proxy', 1);

// session simple en mémoire (OK pour tests, pas pour production)
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar.readonly'
];

// Route qui lance le flux OAuth (cliqué depuis ton app)
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.redirect(url);
});

// Callback que Google appelle après autorisation
app.get('/auth/google/callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing code parameter');

    const { tokens } = await oauth2Client.getToken(code);
    // stocke les tokens dans la session pour ce test
    req.session.tokens = tokens;
    // on met les credentials sur l'instance (utile plus tard)
    oauth2Client.setCredentials(tokens);

    // page de confirmation simple pour l'utilisateur
    res.send('Connexion Gmail réussie — vous pouvez fermer cette page.');
  } catch (err) {
    console.error('Callback error', err);
    res.status(500).send('Erreur lors de la connexion à Google');
  }
});

// Route de test : récupérer quelques mails (nécessite session active)
app.get('/mails', async (req, res) => {
  try {
    if (!req.session.tokens) return res.status(401).json({ error: 'Utilisateur non connecté' });

    oauth2Client.setCredentials(req.session.tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const list = await gmail.users.messages.list({ userId: 'me', maxResults: 10 });
    const out = [];

    if (list.data.messages && list.data.messages.length) {
      for (const m of list.data.messages) {
        const message = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
        const headers = message.data.payload.headers || [];
        const subject = (headers.find(h => h.name === 'Subject') || {}).value || '';
        const from = (headers.find(h => h.name === 'From') || {}).value || '';
        // extraction simple du corps (si présent)
        let body = '';
        const parts = message.data.payload.parts || [];
        if (parts.length) {
          const part = parts.find(p => p.mimeType === 'text/plain') || parts[0];
          if (part && part.body && part.body.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf8');
          }
        } else if (message.data.payload.body && message.data.payload.body.data) {
          body = Buffer.from(message.data.payload.body.data, 'base64').toString('utf8');
        }

        out.push({ id: m.id, subject, from, body: body.slice(0, 400) });
      }
    }

    res.json(out);
  } catch (err) {
    console.error('Mails error', err);
    res.status(500).send('Erreur récupération mails');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`SereniFamily backend listening on ${port}`));

