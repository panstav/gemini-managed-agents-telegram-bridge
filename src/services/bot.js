import { Telegraf } from 'telegraf';
import * as firestore from './firestore.js';
import * as gemini from './gemini.js';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// --- Command Handlers ---

bot.start((ctx) => {
  ctx.reply('Welcome! I am your Gemini Managed Agents bridge.\n\n' +
    'Commands:\n' +
    '/create_agent <id> <instructions> - Create a new managed agent\n' +
    '/set_agent <id> - Set the agent for this chat/topic\n' +
    '/reset - Reset the conversation context for this chat/topic\n' +
    '/status - Show current agent and session info');
});

bot.command('create_agent', async (ctx) => {
  const args = ctx.payload.split(' ');
  if (args.length < 2) {
    return ctx.reply('Usage: /create_agent <id> <instructions>');
  }

  const agentId = args[0];
  const instructions = args.slice(1).join(' ');

  try {
    await ctx.reply(`Creating agent "${agentId}"...`);
    await gemini.createManagedAgent(agentId, instructions);
    await firestore.addUserAgent(ctx.from.id, agentId);
    ctx.reply(`Agent "${agentId}" created successfully! Use /set_agent ${agentId} to start using it.`);
  } catch (error) {
    console.error('Error creating agent:', error);
    ctx.reply(`Failed to create agent: ${error.message}`);
  }
});

bot.command('set_agent', async (ctx) => {
  const agentId = ctx.payload.trim();
  if (!agentId) {
    return ctx.reply('Usage: /set_agent <id>');
  }

  const chatId = ctx.chat.id;
  const threadId = ctx.message.message_thread_id;

  try {
    await firestore.saveSession(chatId, threadId, {
      agentId: agentId,
      interactionId: null, // Reset context when changing agents
      environmentId: null
    });
    ctx.reply(`Agent set to "${agentId}" for this chat/topic.`);
  } catch (error) {
    console.error('Error setting agent:', error);
    ctx.reply(`Failed to set agent: ${error.message}`);
  }
});

bot.command('reset', async (ctx) => {
  const chatId = ctx.chat.id;
  const threadId = ctx.message.message_thread_id;

  try {
    const session = await firestore.getSession(chatId, threadId);
    await firestore.saveSession(chatId, threadId, {
      agentId: session?.agentId || null,
      interactionId: null,
      environmentId: null
    });
    ctx.reply('Conversation context has been reset.');
  } catch (error) {
    console.error('Error resetting session:', error);
    ctx.reply(`Failed to reset: ${error.message}`);
  }
});

bot.command('status', async (ctx) => {
  const chatId = ctx.chat.id;
  const threadId = ctx.message.message_thread_id;

  try {
    const session = await firestore.getSession(chatId, threadId);
    const agentId = session?.agentId || 'default (antigravity)';
    const envId = session?.environmentId || 'none';
    
    ctx.reply(`Current Status:\nAgent: ${agentId}\nEnvironment: ${envId}\nThread: ${threadId || 'default'}`);
  } catch (error) {
    console.error('Error getting status:', error);
    ctx.reply('Failed to get status.');
  }
});

// --- Message Handler ---

bot.on('text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) return;

  const chatId = ctx.chat.id;
  const threadId = ctx.message.message_thread_id;
  const userInput = ctx.message.text;

  try {
    // 1. Get or create session
    let session = await firestore.getSession(chatId, threadId);
    
    // 2. Show typing indicator
    await ctx.sendChatAction('typing');

    // 3. Interact with Gemini
    const result = await gemini.interactWithAgent({
      input: userInput,
      agentId: session?.agentId,
      previousInteractionId: session?.interactionId,
      environmentId: session?.environmentId
    });

    // 4. Update session in Firestore
    await firestore.saveSession(chatId, threadId, {
      agentId: session?.agentId || null,
      interactionId: result.id,
      environmentId: result.environment_id
    });

    // 5. Reply to user
    // Managed agents can return large responses. Telegram has a 4096 char limit.
    const output = result.output_text;
    if (output.length > 4000) {
        for (let i = 0; i < output.length; i += 4000) {
            await ctx.reply(output.substring(i, i + 4000), {
                reply_to_message_id: ctx.message.message_id
            });
        }
    } else {
        await ctx.reply(output, {
            reply_to_message_id: ctx.message.message_id
        });
    }

  } catch (error) {
    console.error('Error in message handler:', error);
    ctx.reply(`Sorry, I encountered an error: ${error.message}`);
  }
});

export default bot;
