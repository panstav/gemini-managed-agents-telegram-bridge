import express from 'express';
import bot from './services/bot.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Gemini Telegram Bridge is running!');
});

/**
 * Cloud Run usually requires a web server to listen on a port.
 * We can use webhooks for Telegram in production, but for simplicity
 * and as requested "simple node.js project", we'll support both.
 */

const WEBHOOK_URL = process.env.WEBHOOK_URL; // e.g. https://your-service-xyz.a.run.app/webhook

if (WEBHOOK_URL) {
  app.post('/webhook', (req, res) => {
    bot.handleUpdate(req.body, res);
  });

  bot.telegram.setWebhook(`${WEBHOOK_URL}/webhook`)
    .then(() => console.log(`Webhook set to ${WEBHOOK_URL}/webhook`))
    .catch(err => console.error('Error setting webhook:', err));
} else {
  console.log('No WEBHOOK_URL provided, using long polling...');
  bot.launch()
    .then(() => console.log('Bot launched via long polling'))
    .catch(err => console.error('Error launching bot:', err));
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
