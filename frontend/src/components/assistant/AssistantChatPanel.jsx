import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAssistantContext } from '../../context/AssistantContext';
import { chatWithAssistant } from '../../api/aiService';
import ReactMarkdown from 'react-markdown';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-gray-100 rounded-lg rounded-tl-none">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

export default function AssistantChatPanel({ isOpen, onClose }) {
  const { context, hasContext } = useAssistantContext();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your Course Assistant. Ask me anything about this course, and I\'ll help you understand the material better.'
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const mutation = useMutation({
    mutationFn: ({ messages }) => chatWithAssistant({
      courseId: context.courseId,
      lessonId: context.lessonId,
      messages
    }),
    onMutate: (variables) => {
      setMessages(prev => [...prev, { role: 'user', content: variables.messages[variables.messages.length - 1].content }]);
      setMessages(prev => [...prev, { role: 'assistant', content: '', isTyping: true }]);
    },
    onSuccess: (reply) => {
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isTyping);
        return [...filtered, { role: 'assistant', content: reply }];
      });
    },
    onError: (error) => {
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isTyping);
        return [...filtered, { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again or rephrase your question.' 
        }];
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || !hasContext || mutation.isPending) return;

    const userMessage = input.trim();
    setInput('');

    const conversationHistory = messages
      .filter(m => !m.isTyping)
      .map(m => ({ role: m.role, content: m.content }));

    mutation.mutate({
      messages: [...conversationHistory, { role: 'user', content: userMessage }]
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:w-full sm:max-w-md bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">Course Assistant</h3>
            {context.courseTitle && (
              <p className="text-xs text-primary-200 truncate max-w-[180px] sm:max-w-[200px]">{context.courseTitle}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-primary-700 rounded transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasContext && (
          <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Please navigate to a course page to enable the assistant.
            </p>
          </div>
        )}
        
        {hasContext && messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-900 rounded-bl-none'
              }`}
            >
              {message.isTyping ? (
                <TypingIndicator />
              ) : message.role === 'assistant' ? (
                <div className="prose prose-sm prose-p:my-0 prose-ul:my-1 prose-ol:my-1 prose-code:text-primary-700 prose-pre:bg-gray-800 prose-pre:text-white">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={hasContext ? "Ask a question..." : "Select a course first"}
            disabled={!hasContext || mutation.isPending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
          />
          <button
            type="submit"
            disabled={!hasContext || !input.trim() || mutation.isPending}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isPending ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
