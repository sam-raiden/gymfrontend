import { useEffect, useState } from 'react';
import { IconDownload, IconX } from './icons.jsx';

const DISMISSED_KEY = 'retainr_install_dismissed';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

export default function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1',
  );

  useEffect(() => {
    if (isStandalone()) return;

    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredEvent(e);
    };
    const onInstalled = () => {
      setDeferredEvent(null);
      localStorage.setItem(DISMISSED_KEY, '1');
      setDismissed(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (dismissed || !deferredEvent) return null;

  const handleInstall = async () => {
    deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="install-banner">
      <div className="install-banner-text">
        <strong>Install Retainr</strong> on your phone for quick access
      </div>
      <div className="install-banner-actions">
        <button type="button" className="install-banner-btn" onClick={handleInstall}>
          <IconDownload size={15} />
          Install
        </button>
        <button
          type="button"
          className="install-banner-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <IconX size={15} />
        </button>
      </div>
    </div>
  );
}
