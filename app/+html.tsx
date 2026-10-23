import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Gita Jyoti · Bhagavad Gita</title>
        <meta
          name="description"
          content="Read the Bhagavad Gita daily in English, Telugu, Hindi and Tamil. Offline, free, no account."
        />
        <meta name="theme-color" content="#0B0A09" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Phone-width app on every screen size; must run before the bundle. */}
        <script dangerouslySetInnerHTML={{ __html: phoneViewportShim }} />
        <style dangerouslySetInnerHTML={{ __html: phoneFrame }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

/** Widest phone we lay out for (iPhone Pro Max). */
const PHONE_MAX_WIDTH = 430;

/**
 * The app sizes many things from Dimensions.get("window") at import time, and
 * react-native-web reads that from window.visualViewport. Report at most a
 * phone's width so desktop browsers get the same layout as a phone.
 */
const phoneViewportShim = `
(function () {
  var MAX = ${PHONE_MAX_WIDTH};
  var real = window.visualViewport;
  if (!real) return;
  var phone = {
    get width() { return Math.min(real.width, MAX); },
    get height() { return real.height; },
    get scale() { return real.scale; },
    get offsetLeft() { return real.offsetLeft; },
    get offsetTop() { return real.offsetTop; },
    get pageLeft() { return real.pageLeft; },
    get pageTop() { return real.pageTop; },
    addEventListener: real.addEventListener.bind(real),
    removeEventListener: real.removeEventListener.bind(real)
  };
  try { Object.defineProperty(window, 'visualViewport', { value: phone, configurable: true }); } catch (e) {}
})();
`;

/**
 * Centre the app in a phone-width column. `contain: layout` on body makes it the
 * containing block for position:fixed children, so modals and toasts stay
 * inside the column too. The page outside the column is the dark backdrop.
 */
const phoneFrame = `
html {
  background-color: #0B0A09;
}
body {
  max-width: ${PHONE_MAX_WIDTH}px;
  margin: 0 auto !important;
  contain: layout;
  background-color: #FFF8E7;
  box-shadow: 0 0 0 1px rgba(184, 134, 11, 0.25), 0 24px 80px rgba(0, 0, 0, 0.5);
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #0B0A09;
  }
}
@media (min-width: ${PHONE_MAX_WIDTH + 1}px) {
  html {
    background: radial-gradient(ellipse at top, #2A2112 0%, #0B0A09 60%);
  }
}`;
