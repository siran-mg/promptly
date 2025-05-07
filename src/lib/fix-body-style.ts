/**
 * Utility to fix the body style issue with pointer-events: none
 * This is a direct fix for the issue where the body element gets pointer-events: none
 * after closing a dialog, preventing any interaction with the page.
 */

/**
 * Removes the pointer-events: none style from the body element
 * and ensures the body is interactive
 */
export function fixBodyStyle() {
  if (typeof document !== 'undefined') {
    // Remove the pointer-events: none style from the body
    document.body.style.removeProperty('pointer-events');
    
    // Ensure the body has pointer-events: auto
    document.body.style.pointerEvents = 'auto';
    
    // Also check for any inline style attribute with pointer-events: none
    if (document.body.getAttribute('style')?.includes('pointer-events: none')) {
      // Remove the entire style attribute and set it again without pointer-events: none
      const style = document.body.getAttribute('style') || '';
      const newStyle = style.replace(/pointer-events:\s*none;?/g, '');
      document.body.setAttribute('style', newStyle);
    }
  }
}

/**
 * Sets up a MutationObserver to watch for changes to the body style
 * and fix it if pointer-events: none is added
 */
export function setupBodyStyleObserver() {
  if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
    // Create a MutationObserver to watch for changes to the body style
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'style' &&
            document.body.style.pointerEvents === 'none') {
          // Fix the body style
          fixBodyStyle();
        }
      });
    });
    
    // Start observing the body for style changes
    observer.observe(document.body, { 
      attributes: true,
      attributeFilter: ['style']
    });
    
    // Also set up a click event listener on the document
    document.addEventListener('click', () => {
      // Check if the body has pointer-events: none after a short delay
      setTimeout(() => {
        if (document.body.style.pointerEvents === 'none' ||
            document.body.getAttribute('style')?.includes('pointer-events: none')) {
          fixBodyStyle();
        }
      }, 100);
    });
    
    // Return the observer so it can be disconnected if needed
    return observer;
  }
  
  return null;
}
