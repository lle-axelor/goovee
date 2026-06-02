'use client';

import {useEffect} from 'react';

type Props = {
  id: string;
  html: string;
};

/**
 * Parses a snippet of HTML (provided by an AOS admin via the analytics catalogue)
 * and injects each `<script>` it contains into <head> as a real script element,
 * created via document.createElement so the browser executes it normally.
 *
 * Avoids the nested-<script> trap that Next.js <Script dangerouslySetInnerHTML>
 * falls into when the inner content is HTML rather than raw JS.
 */
export default function AnalyticsScriptInjector({id, html}: Props) {
  useEffect(() => {
    const markerId = `__analytics-injected-${id}`;
    if (document.getElementById(markerId)) return;

    const tpl = document.createElement('template');
    tpl.innerHTML = html;

    const oldScripts = tpl.content.querySelectorAll('script');
    oldScripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      for (const attr of Array.from(oldScript.attributes)) {
        newScript.setAttribute(attr.name, attr.value);
      }
      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }
      document.head.appendChild(newScript);
    });

    const marker = document.createElement('meta');
    marker.id = markerId;
    marker.setAttribute('name', `analytics-marker-${id}`);
    document.head.appendChild(marker);
  }, [id, html]);

  return null;
}
