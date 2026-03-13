import * as React from 'react';

/**
 * Хук для вычисления высоты viewport и listHeight с учётом header, toolbar и отступов.
 * @param headerRef - ref на header
 * @param toolbarRef - ref на toolbar
 * @param margins - сумма вертикальных отступов контейнера (по умолчанию 48)
 * @param buffer - дополнительный отступ для браузерного chrome (по умолчанию 50)
 * @returns { viewportHeight, listHeight, progressTop }
 */
export function useViewportHeight(
  headerRef: React.RefObject<HTMLDivElement | null>,
  toolbarRef: React.RefObject<HTMLDivElement | null>,
  margins: number = 48,
  buffer: number = 50
) {
  const [viewportHeight, setViewportHeight] = React.useState<number>(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );
  const [listHeight, setListHeight] = React.useState<number>(0);
  const [progressTop, setProgressTop] = React.useState<number>(0);

  React.useLayoutEffect(() => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
    setViewportHeight(vh);
    const headerH = headerRef.current?.offsetHeight || 0;
    const toolbarH = toolbarRef.current?.offsetHeight || 0;
    const safe = vh - (typeof document !== 'undefined' ? document.documentElement.clientHeight : vh);
    const newListH = vh - headerH - toolbarH - margins - buffer - safe;
    setListHeight(newListH > 0 ? newListH : 0);
    setProgressTop(headerH + toolbarH + 8);
  }, []);

  return { viewportHeight, listHeight, progressTop };
}
