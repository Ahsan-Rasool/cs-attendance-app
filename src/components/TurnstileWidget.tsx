import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView, type WebView as WebViewType, type WebViewMessageEvent } from 'react-native-webview';
import { TURNSTILE_BASE_URL, TURNSTILE_SITE_KEY } from '../api/client.ts';

// Same Cloudflare Turnstile widget the original app embeds. The site key is
// bound to the iotpro.uk origin, hence the baseUrl.
const html = (theme: 'light' | 'dark') => `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad" async defer></script>
<style>html,body{margin:0;padding:0;background:transparent;width:100%;overflow-x:hidden}#widget{display:flex;justify-content:center;width:100%;box-sizing:border-box}</style>
</head><body><div id="widget"></div><script>
function post(m){window.ReactNativeWebView.postMessage(JSON.stringify(m));}
function reportHeight(){post({type:'height',value:document.getElementById('widget').offsetHeight});}
function onTurnstileLoad(){
  new ResizeObserver(reportHeight).observe(document.getElementById('widget'));
  window.turnstile.render('#widget',{sitekey:'${TURNSTILE_SITE_KEY}',theme:'${theme}',size:'flexible',appearance:'interaction-only',
    callback:function(t){post({type:'token',value:t});},
    'expired-callback':function(){post({type:'expired'});},
    'error-callback':function(){post({type:'error'});}});
}
</script></body></html>`;

export function TurnstileWidget({ theme, onToken, onError }: {
  theme: 'light' | 'dark'; onToken: (t: string | null) => void; onError: () => void;
}) {
  const [height, setHeight] = useState(0);
  const ref = useRef<WebViewType>(null);
  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.type === 'token') onToken(m.value);
      else if (m.type === 'expired') { onToken(null); ref.current?.injectJavaScript('window.turnstile && window.turnstile.reset(); true;'); }
      else if (m.type === 'error') { onToken(null); onError(); }
      else if (m.type === 'height') setHeight(Math.ceil(m.value));
    } catch { /* ignore malformed messages */ }
  };
  return (
    <View style={{ height, width: '100%', overflow: 'hidden' }}>
      <WebView key={theme} ref={ref} source={{ html: html(theme), baseUrl: TURNSTILE_BASE_URL }} onMessage={onMessage}
        style={{ backgroundColor: 'transparent' }} scrollEnabled={false} javaScriptEnabled originWhitelist={['*']} />
    </View>
  );
}
