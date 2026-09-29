import { useRegisterSW } from 'virtual:pwa-register/react';

/** Shows a small bar when a new version has been deployed. Reloads only when you tap it. */
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // An installed app can stay open for days; look for a new version every hour
      if (registration) setInterval(() => registration.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;

  return (
    <div role="status" className="update-bar">
      <span>A new version of the app is ready.</span>
      <div className="row">
        <button type="button" className="button button-small-light" onClick={() => setNeedRefresh(false)}>
          Later
        </button>
        <button type="button" className="button button-primary" onClick={() => updateServiceWorker(true)}>
          Reload
        </button>
      </div>
    </div>
  );
}
