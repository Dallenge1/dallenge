
// components/ThemeScript.tsx
'use client';

import React from 'react';

export const ThemeScript = () => {
  const script = `
    (function() {
      try {
        document.documentElement.classList.add('dark');
      } catch (e) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
};
