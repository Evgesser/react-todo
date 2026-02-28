import "@/styles/globals.css";
import * as React from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { CacheProvider, EmotionCache } from "@emotion/react";
import { ThemeProvider, CssBaseline, PaletteMode } from "@mui/material";
import { getTheme } from "@/theme";
import createEmotionCache from "@/createEmotionCache";
import { LanguageProvider } from "@/contexts/LanguageContext";

// context to toggle color mode
export const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const [mode, setMode] = React.useState<PaletteMode>('light');

  React.useEffect(() => {
    const stored = localStorage.getItem('color-mode');
    if (stored === 'dark' || stored === 'light') {
      setMode(stored);
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

  const theme = React.useMemo(() => getTheme(mode), [mode]);

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <LanguageProvider>
        <ColorModeContext.Provider value={colorMode}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Component {...pageProps} />
          </ThemeProvider>
        </ColorModeContext.Provider>
      </LanguageProvider>
    </CacheProvider>
  );
}
