const HERO_INPUT_ID = 'recommendation-hero-input';

export function focusRecommendationHeroInput(scrollBehavior: ScrollBehavior = 'smooth') {
  const heroInput = document.getElementById(HERO_INPUT_ID);
  if (heroInput && typeof heroInput.scrollIntoView === 'function') {
    heroInput.scrollIntoView({ behavior: scrollBehavior, block: 'center' });
  }

  window.setTimeout(() => {
    if (heroInput instanceof HTMLTextAreaElement) {
      heroInput.focus();
    }
  }, 180);
}

export { HERO_INPUT_ID };
