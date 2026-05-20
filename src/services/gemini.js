import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const DEFAULT_BASE_AGENT = 'antigravity-preview-05-2026';

/**
 * Creates a new managed agent
 * @param {string} id - Unique identifier for the agent
 * @param {string} instructions - System instructions for the agent
 */
export async function createManagedAgent(id, instructions) {
  const agent = await client.agents.create({
    id: id,
    base_agent: DEFAULT_BASE_AGENT,
    system_instruction: instructions,
    base_environment: {
      type: 'remote',
    },
  });
  return agent;
}

/**
 * Sends a message to a managed agent or the default antigravity agent
 * @param {Object} options
 * @param {string} options.input - The user message
 * @param {string} [options.agentId] - ID of the managed agent (optional)
 * @param {string} [options.previousInteractionId] - To continue conversation context
 * @param {string} [options.environmentId] - To continue environment state (files, etc)
 */
export async function interactWithAgent({ input, agentId, previousInteractionId, environmentId }) {
  const config = {
    agent: agentId || DEFAULT_BASE_AGENT,
    input: input,
    environment: environmentId || 'remote',
  };

  if (previousInteractionId) {
    config.previous_interaction_id = previousInteractionId;
  }

  // If environmentId is provided, 'environment' should be set to that ID
  // If not, 'environment' is 'remote' to create a new one.
  // The quickstart shows: environment="remote" for new, or environment=interaction.environment_id for existing.

  const interaction = await client.interactions.create(config, { timeout: 300_000 });
  return interaction;
}

/**
 * Fetches a list of available agents (this is a placeholder if SDK supports it, 
 * otherwise we rely on our Firestore tracking)
 */
export async function listAgents() {
    // Current SDK might not have a simple list method that's easy to use without pagination
    // For now we will rely on Firestore to track user-created agents.
    return [];
}
