export function animateExpandAndNavigate(target: HTMLElement | null, to: string, navigate: (path: string) => void, duration = 280) {
  if (!target) {
    navigate(to);
    return;
  }

  const rect = target.getBoundingClientRect();
  const overlay = document.createElement('div');
  
  // Calculate the search input width: max-w-4xl container with back button + gap
  // max-w-4xl = 896px, minus padding (32px), minus back button (~40px), minus gaps (16px)
  const maxWidth = 896;
  const viewportWidth = window.innerWidth;
  const containerWidth = Math.min(maxWidth, viewportWidth - 32); // 32px for padding
  const containerLeft = (viewportWidth - containerWidth) / 2;
  
  // Account for back button (40px) + gap (16px) = 56px from container left
  const backButtonSpace = 56;
  const searchInputLeft = containerLeft + backButtonSpace;
  
  // Search input extends from searchInputLeft to before the action buttons on the right
  // The buttons take about 180px (3 buttons * ~50px each + gaps)
  const rightButtonsSpace = 180;
  const searchInputWidth = containerWidth - backButtonSpace - rightButtonsSpace;
  
  overlay.style.position = 'fixed';
  overlay.style.left = `${rect.left}px`;
  overlay.style.top = `${rect.top}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.background = 'rgba(255,255,255,0.95)';
  overlay.style.border = '2px solid rgba(59,130,246,0.4)';
  overlay.style.borderRadius = window.getComputedStyle(target).borderRadius || '12px';
  overlay.style.zIndex = '9999';
  overlay.style.transition = `all ${duration}ms cubic-bezier(.25,.8,.25,1)`;
  overlay.style.pointerEvents = 'none';

  document.body.appendChild(overlay);

  // Force paint
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  overlay.getBoundingClientRect();

  // Expand to match the search input field width
  requestAnimationFrame(() => {
    overlay.style.left = `${searchInputLeft}px`;
    overlay.style.width = `${searchInputWidth}px`;
    overlay.style.borderRadius = '12px';
  });

  const cleanup = () => {
    try {
      document.body.removeChild(overlay);
    } catch {
      // ignore
    }
  };

  const onEnd = () => {
    overlay.removeEventListener('transitionend', onEnd);
    navigate(to);
    setTimeout(cleanup, 50);
  };

  overlay.addEventListener('transitionend', onEnd);
}

export default animateExpandAndNavigate;
