import { createContext, useContext, useState, useCallback } from 'react';

const AssistantContext = createContext(null);

export function AssistantProvider({ children }) {
  const [context, setContext] = useState({
    courseId: null,
    lessonId: null,
    courseTitle: null
  });

  const setAssistantContext = useCallback((newContext) => {
    setContext(prev => ({
      ...prev,
      ...newContext
    }));
  }, []);

  const clearAssistantContext = useCallback(() => {
    setContext({
      courseId: null,
      lessonId: null,
      courseTitle: null
    });
  }, []);

  const value = {
    context,
    setAssistantContext,
    clearAssistantContext,
    hasContext: !!context.courseId
  };

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistantContext() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistantContext must be used within AssistantProvider');
  }
  return context;
}

export default AssistantContext;
