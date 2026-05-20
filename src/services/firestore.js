import { Firestore } from '@google-cloud/firestore';

const db = new Firestore();

/**
 * Collection for storing session mappings:
 * chatId (string) -> {
 *   interactionId: string,
 *   environmentId: string,
 *   agentId: string
 * }
 * 
 * chatId will be constructed as `${chat_id}_${thread_id || 'default'}`
 */
const SESSIONS_COLLECTION = 'gemini_telegram_sessions';

/**
 * Collection for storing user-created agent IDs:
 * userId (string) -> {
 *   agentIds: string[]
 * }
 */
const AGENTS_COLLECTION = 'gemini_user_agents';

export async function getSession(chatId, threadId) {
  const docId = `${chatId}_${threadId || 'default'}`;
  const doc = await db.collection(SESSIONS_COLLECTION).doc(docId).get();
  return doc.exists ? doc.data() : null;
}

export async function saveSession(chatId, threadId, sessionData) {
  const docId = `${chatId}_${threadId || 'default'}`;
  await db.collection(SESSIONS_COLLECTION).doc(docId).set(sessionData, { merge: true });
}

export async function clearSession(chatId, threadId) {
  const docId = `${chatId}_${threadId || 'default'}`;
  await db.collection(SESSIONS_COLLECTION).doc(docId).delete();
}

export async function getUserAgents(userId) {
  const doc = await db.collection(AGENTS_COLLECTION).doc(userId.toString()).get();
  return doc.exists ? doc.data().agentIds : [];
}

export async function addUserAgent(userId, agentId) {
  const docRef = db.collection(AGENTS_COLLECTION).doc(userId.toString());
  const doc = await docRef.get();
  if (doc.exists) {
    const agentIds = doc.data().agentIds || [];
    if (!agentIds.includes(agentId)) {
      agentIds.push(agentId);
      await docRef.update({ agentIds });
    }
  } else {
    await docRef.set({ agentIds: [agentId] });
  }
}
