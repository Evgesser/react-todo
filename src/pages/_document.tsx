import * as React from "react";
import Document, { Html, Head, Main, NextScript, DocumentContext } from "next/document";
import createEmotionServer from "@emotion/server/create-instance";
// note: theme is generated dynamically in _app; here we only need palette color
import createEmotionCache from "@/createEmotionCache";
import { EmotionCache } from "@emotion/react";

interface MyDocumentProps {
  emotionStyleTags: React.ReactNode[];
}

export default class MyDocument extends Document<MyDocumentProps> {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* PWA primary color */}
          <meta name="theme-color" content="#1976d2" />
          <link rel="shortcut icon" href="/favicon.ico" />
          {/* Inject MUI styles first to match with the prepend: true configuration. */}
          {(this.props as MyDocumentProps).emotionStyleTags}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

// `getInitialProps` belongs to `_document` (instead of `_app`), it's compatible with static-site generation (SSG).
MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  const originalRenderPage = ctx.renderPage;

  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  ctx.renderPage = () =>
    originalRenderPage({
      // `enhanceApp` wrapper must accept any App component; we add a cache
      // prop to it.  Use eslint-disable to silence the `no-explicit-any` rule.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enhanceApp: (App: any) => (props: any) => <App emotionCache={cache} {...props} />,
    });

  const initialProps = await Document.getInitialProps(ctx);
  const emotionStyles = extractCriticalToChunks(initialProps.html);
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(' ')}`}
      key={style.key}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ));

  return {
    ...initialProps,
    emotionStyleTags,
  };
};
