import api, { unwrapSuccess } from './client';

export async function chatWithAssistant({ courseId, lessonId, messages }) {
  const payload = {
    courseId,
    lessonId: lessonId || null,
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  };

  const response = await api.post('/ai/chat', payload);
  const result = unwrapSuccess(response);
  
  if (result.success) {
    return result.data.reply;
  }
  
  throw new Error(result.message || 'Failed to get response from assistant');
}
