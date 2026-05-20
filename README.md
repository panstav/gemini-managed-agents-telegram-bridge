# Gemini Managed Agents Telegram Bridge

This project bridges a Telegram bot with the Google Gemini Managed Agents API. It allows you to chat with autonomous agents that can run code, manage files, and browse the web directly from Telegram.

## Features

- **Multi-turn conversations**: Maintains context between messages.
- **Environment persistence**: Persists files and sandbox state across messages.
- **Thread/Topic support**: Each Telegram Topic (thread) maintains its own independent Gemini session.
- **Managed Agent management**: Create and switch between custom managed agents via Telegram commands.
- **Stateless & Scalable**: Uses Google Cloud Firestore for session mapping, making it perfect for Cloud Run.

## Commands

- `/start` - Show welcome message and command list.
- `/create_agent <id> <instructions>` - Create a new managed agent with specific instructions.
- `/set_agent <id>` - Set the agent to use for the current chat/topic.
- `/reset` - Reset the conversation context (history and environment) for the current chat/topic.
- `/status` - Show current agent and session status.

## Setup

### Prerequisites

1.  **Google Cloud Project**: A GCP project with Firestore and Gemini API enabled.
2.  **Service Account**: A service account with `roles/datastore.user` (for Firestore) and appropriate Gemini API permissions.
3.  **Telegram Bot**: Create a bot via [@BotFather](https://t.me/botfather) and get the token.
4.  **Gemini API Key**: Get an API key from [Google AI Studio](https://aistudio.google.com/).

### Local Development

1.  Clone this repository.
2.  Install dependencies: `npm install`.
3.  Copy `.env.example` to `.env` and fill in your tokens.
4.  Run the bot: `npm run dev`.

### Deployment to Cloud Run

This project is designed to be deployed to Google Cloud Run.

1.  Ensure you have the [gcloud CLI](https://cloud.google.com/sdk/gcloud) installed and authenticated.
2.  Deploy using the following command:

```bash
gcloud run deploy gemini-telegram-bridge \
  --source . \
  --env-vars-file .env \
  --allow-unauthenticated
```

*Note: For production, it's recommended to use Secret Manager for tokens instead of environment variables.*

## How it works

The bridge uses the `@google/genai` SDK to interact with Managed Agents. It maps Telegram `chat_id` and `message_thread_id` to Gemini `interaction_id` and `environment_id`. This mapping is stored in Firestore, ensuring that even if the Cloud Run instance restarts, the conversation context is preserved.
