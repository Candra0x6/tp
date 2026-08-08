import { useEffect, RefObject } from 'react';

export function useOverflowWarning(ref: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const el = ref.current;
    if (!el) return;

    const check = () => {
      const over = el.scrollHeight - el.clientHeight;
      if (over > 0) {
        console.warn(
          `[viewport] Screen height overruns by ${over}px and is being clipped. ` +
            `The 480x320 box is fixed; something above the footer has to give.`
        );
      }
    };

    const frame = requestAnimationFrame(check);
    void document.fonts?.ready?.then(check);
    return () => cancelAnimationFrame(frame);
  });
}
