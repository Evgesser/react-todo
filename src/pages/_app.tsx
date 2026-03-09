import "@/styles/globals.css";
import * as React from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { CacheProvider, EmotionCache } from "@emotion/react";
import { ThemeProvider, CssBaseline, PaletteMode } from "@mui/material";
import { getTheme } from "@/theme";
import createEmotionCache from "@/createEmotionCache";
import { IntlProvider } from 'react-intl';
import { translations } from '@/locales';
import { flattenMessages } from '@/contexts/LanguageContext';
import useAppStore from '@/stores/useAppStore';

// context to toggle color mode
export const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache, pageProps } = props;
  const [mode, setMode] = React.useState<PaletteMode>('light');

  React.useEffect(() => {
    const stored = localStorage.getItem('color-mode');
    if (stored === 'dark' || stored === 'light') {
      setMode(stored);
    }
    // hydrate auth from localStorage into Zustand store
    try {
      useAppStore.getState().hydrateAuth();
    } catch {
      // noop
    }
    // hydrate language into Zustand store
    try {
      useAppStore.getState().hydrateLanguage();
    } catch {
      // noop
    }
  }, []);

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prev) => {
          const next = prev === 'light' ? 'dark' : 'light';
          localStorage.setItem('color-mode', next);
          return next;
        });
      },
    }),
    []
  );

  const currentLanguage = useAppStore((s) => s.language);
  const isRTL = currentLanguage === 'he';
  const theme = React.useMemo(() => getTheme(mode, isRTL ? 'rtl' : 'ltr'), [mode, isRTL]);

  React.useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', mode);
      document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    } catch {
      // noop on SSR or if document unavailable
    }
  }, [mode, isRTL]);

  return (
    <CacheProvider value={emotionCache || clientSideEmotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      {/* IntlProvider wired at the top level using Zustand language */}
      <IntlProvider
        locale={
          (currentLanguage === 'ru' ? 'ru' : currentLanguage === 'he' ? 'he' : 'en')
        }
        messages={flattenMessages(translations[currentLanguage])}
        defaultLocale="en"
      >
        <ColorModeContext.Provider value={colorMode}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Component {...pageProps} />
          </ThemeProvider>
        </ColorModeContext.Provider>
      </IntlProvider>
    </CacheProvider>
  );
}
