// scripts/analytics.ts
declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

type GAEvent = {
  name: string;
  params?: Record<string, string | number | boolean>;
};

export function trackEvent(event: GAEvent) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', event.name, event.params);
  }
}

export const Events = {
  buttonPressed: () => trackEvent({ name: 'button_pressed' }),
  resultShown: (result: string) => trackEvent({ name: 'result_shown', params: { result } }),
  questionEntered: () => trackEvent({ name: 'question_entered' }),
  resultShared: () => trackEvent({ name: 'result_shared' }),
  embedCodeCopied: () => trackEvent({ name: 'embed_code_copied' }),
  categoryQuestionClicked: (category: string, question: string) =>
    trackEvent({ name: 'category_question_clicked', params: { category, question } }),
};
