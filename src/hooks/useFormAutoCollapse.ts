import * as React from 'react';

/**
 * A helper that watches window scroll/resize events and automatically
 * collapses the add/edit form when the user scrolls down.  It contains
 * logic to ignore spurious scrolls caused by mobile keyboards opening
 * or by inputs being focused.
 *
 * @param formOpen current visibility state of the form
 * @param setFormOpen setter to toggle the form
 * @param menuAnchor menu anchor element (used to make hook update when menu status changes)
 */
export function useFormAutoCollapse(
  formOpen: boolean,
  setFormOpen: React.Dispatch<React.SetStateAction<boolean>>,
  menuAnchor: HTMLElement | null
) {
  const prevScroll = React.useRef<number>(0);
  const ignoreScrollUntil = React.useRef<number>(0);
  const prevHeight = React.useRef<number>(typeof window !== 'undefined' ? window.innerHeight : 0);
  const formOpenRef = React.useRef(formOpen);

  React.useEffect(() => {
    formOpenRef.current = formOpen;
    if (typeof window !== 'undefined') {
      prevScroll.current = window.scrollY;
      prevHeight.current = window.innerHeight;
    }
  }, [formOpen]);

  React.useEffect(() => {
    const SCROLL_LOCK_MS = 420;
    prevScroll.current = window.scrollY;

    const onScroll = () => {
      const now = Date.now();
      if (now < ignoreScrollUntil.current) return;
      const cur = window.scrollY;
      const prev = prevScroll.current || 0;
      const delta = cur - prev;

      // if an input is focused, keyboard likely open - don't collapse
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        prevScroll.current = cur;
        return;
      }

      // ignore genuine height reductions (keyboard)
      const h = window.innerHeight;
      if (prevHeight.current - h > 100) {
        prevHeight.current = h;
        prevScroll.current = cur;
        return;
      }
      prevHeight.current = h;

      const collapseThreshold = 48;
      if (delta > collapseThreshold && formOpenRef.current) {
        setFormOpen(false);
        ignoreScrollUntil.current = now + SCROLL_LOCK_MS;
      }
      prevScroll.current = cur;
    };

    const onResize = () => {
      prevHeight.current = window.innerHeight;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [menuAnchor, setFormOpen]);
}
