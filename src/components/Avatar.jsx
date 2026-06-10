import { useEffect, useState } from 'react';
import { initials } from '../utils/memberUtils.js';

/**
 * Circular avatar. Renders the member's photo if one is set, falling back
 * to coloured initials. Any image load error silently reverts to initials
 * so a broken/missing source never leaves a blank circle.
 *
 * `photoUrl` accepts either an absolute URL or a `data:image/…` URI —
 * since the demo build stores photos as in-memory data URLs, no resolution
 * step is needed.
 */
export default function Avatar({ name, photoUrl, className = '', alt }) {
  const [errored, setErrored] = useState(false);

  // Reset error state when the source changes (e.g. user picks a new photo).
  useEffect(() => {
    setErrored(false);
  }, [photoUrl]);

  const showImage = photoUrl && !errored;

  return (
    <div
      className={`avatar ${showImage ? 'has-photo' : ''} ${className}`.trim()}
      aria-label={alt || name || 'Member'}
    >
      {showImage ? (
        <img
          src={photoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setErrored(true)}
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}
