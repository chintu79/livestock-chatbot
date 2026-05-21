import getNvidiaClient, { NVIDIA_MODEL, SYSTEM_PROMPT } from '../config/nvidia.js';
import Session from '../models/Session.js';

/**
 * Build message history for context window (last 20 messages)
 */
const buildHistory = (messages) =>
  messages.slice(-20).map(({ role, content }) => ({ role, content }));

/**
 * Stream AI response from NVIDIA NIM
 */
export const streamChatResponse = async (sessionId, userMessage, language = 'en', res) => {
  const session = await Session.findOne({ sessionId });

  // Append user message
  session.messages.push({ role: 'user', content: userMessage, language, type: 'text' });

  const history = buildHistory(session.messages);

  // System prompt with language hint
  const systemWithLang = language !== 'en'
    ? `${SYSTEM_PROMPT}\n\nIMPORTANT: The user prefers responses in language code "${language}". Respond in that language.`
    : SYSTEM_PROMPT;

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let fullResponse = '';

  try {
    const stream = await getNvidiaClient().chat.completions.create({
      model: NVIDIA_MODEL,
      messages: [
        { role: 'system', content: systemWithLang },
        ...history,
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1024,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ delta, type: 'delta' })}\n\n`);
      }
    }

    // Save assistant response
    session.messages.push({ role: 'assistant', content: fullResponse, language });
    await session.save();

    res.write(`data: ${JSON.stringify({ type: 'done', sessionId })}\n\n`);
    res.end();
  } catch (err) {
    console.error('NVIDIA API Error:', err.message);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI service unavailable. Please try again.' })}\n\n`);
    res.end();
  }
};

/**
 * Non-streaming response (for voice TTS use)
 */
export const getChatResponse = async (sessionId, userMessage, language = 'en') => {
  const session = await Session.findOne({ sessionId });

  session.messages.push({ role: 'user', content: userMessage, language, type: 'voice' });
  const history = buildHistory(session.messages);

  const systemWithLang = language !== 'en'
    ? `${SYSTEM_PROMPT}\n\nIMPORTANT: Respond in language code "${language}". Keep responses concise for voice playback.`
    : `${SYSTEM_PROMPT}\n\nKeep responses concise and clear for voice playback.`;

  const response = await getNvidiaClient().chat.completions.create({
    model: NVIDIA_MODEL,
    messages: [{ role: 'system', content: systemWithLang }, ...history],
    temperature: 0.7,
    max_tokens: 512,
  });

  const reply = response.choices[0].message.content;
  session.messages.push({ role: 'assistant', content: reply, language, type: 'voice' });
  await session.save();

  return reply;
};
