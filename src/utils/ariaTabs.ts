import React from 'react';

/**
 * Shared keyboard navigation handler for ARIA tablists.
 * ArrowLeft/Right moves focus and activates the adjacent tab.
 * Home/End jumps to first/last tab.
 */
export function handleTablistKeydown(
  e: React.KeyboardEvent,
  tabs: string[],
  activeTab: string,
  onTabChange: (tab: string) => void
) {
  const idx = tabs.indexOf(activeTab);
  let nextIdx = idx;

  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault();
      nextIdx = (idx + 1) % tabs.length;
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      nextIdx = (idx - 1 + tabs.length) % tabs.length;
      break;
    case 'Home':
      e.preventDefault();
      nextIdx = 0;
      break;
    case 'End':
      e.preventDefault();
      nextIdx = tabs.length - 1;
      break;
    default:
      return;
  }

  onTabChange(tabs[nextIdx]);

  // Move focus to the newly activated tab button
  const tablist = (e.currentTarget as HTMLElement).querySelectorAll('[role="tab"]');
  const nextTab = tablist[nextIdx] as HTMLElement | undefined;
  nextTab?.focus();
}
