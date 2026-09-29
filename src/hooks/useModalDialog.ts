import { useEffect, useRef } from 'react';

/**
 * Opens a <dialog> as a modal when the component mounts, closes it on unmount, and gives
 * focus back to whatever opened it. Handle Escape with the dialog's onCancel, not onClose:
 * React's dev-mode double mount fires a late "close" event that would shut it immediately.
 */
export function useModalDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      opener?.focus();
    };
  }, []);
  return ref;
}
