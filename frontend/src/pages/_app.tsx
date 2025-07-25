import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useAuthActions } from '@/store/authStore';
import '@/app/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { checkAuth } = useAuthActions();

  // Initialize auth check on app start
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle route changes for analytics, etc.
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // You can add analytics tracking here
      console.log('Route changed to:', url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return <Component {...pageProps} />;
}