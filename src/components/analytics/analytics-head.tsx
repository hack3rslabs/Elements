"use client";

import Script from "next/script";

/**
 * Analytics Head Component
 * Injects GA4, Facebook Pixel, and Google Tag Manager scripts.
 * Controlled via environment variables — leave blank to disable.
 */
export function AnalyticsHead() {
    const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;
    const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
    const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

    return (
        <>
            {/* Google Analytics 4 */}
            {ga4Id && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
                        strategy="afterInteractive"
                    />
                    <Script id="ga4-init" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${ga4Id}', {
                                page_path: window.location.pathname,
                                send_page_view: true,
                            });
                        `}
                    </Script>
                </>
            )}

            {/* Facebook Pixel */}
            {fbPixelId && (
                <Script id="fb-pixel-init" strategy="afterInteractive">
                    {`
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${fbPixelId}');
                        fbq('track', 'PageView');
                    `}
                </Script>
            )}

            {/* Google Tag Manager */}
            {gtmId && (
                <Script id="gtm-init" strategy="afterInteractive">
                    {`
                        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                        })(window,document,'script','dataLayer','${gtmId}');
                    `}
                </Script>
            )}
        </>
    );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
        fbq?: (...args: any[]) => void;
        dataLayer?: any[];
    }
}

/**
 * E-commerce event tracking helpers
 * Call these from components to track user actions
 */
export const trackEvent = {
    addToCart: (product: { id: string; name: string; price: number }) => {
        if (typeof window !== "undefined" && window.gtag) {
            window.gtag("event", "add_to_cart", {
                currency: "INR",
                value: product.price,
                items: [{ item_id: product.id, item_name: product.name, price: product.price }],
            });
        }
        if (typeof window !== "undefined" && window.fbq) {
            window.fbq("track", "AddToCart", {
                content_ids: [product.id],
                content_name: product.name,
                value: product.price,
                currency: "INR",
            });
        }
    },
    purchase: (order: { id: string; total: number; items: { id: string; name: string; price: number }[] }) => {
        if (typeof window !== "undefined" && window.gtag) {
            window.gtag("event", "purchase", {
                transaction_id: order.id,
                value: order.total,
                currency: "INR",
                items: order.items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price })),
            });
        }
        if (typeof window !== "undefined" && window.fbq) {
            window.fbq("track", "Purchase", {
                value: order.total,
                currency: "INR",
                content_ids: order.items.map(i => i.id),
            });
        }
    },
    viewProduct: (product: { id: string; name: string; price: number }) => {
        if (typeof window !== "undefined" && window.gtag) {
            window.gtag("event", "view_item", {
                currency: "INR",
                value: product.price,
                items: [{ item_id: product.id, item_name: product.name, price: product.price }],
            });
        }
        if (typeof window !== "undefined" && window.fbq) {
            window.fbq("track", "ViewContent", {
                content_ids: [product.id],
                content_name: product.name,
                value: product.price,
                currency: "INR",
            });
        }
    },
    search: (query: string) => {
        if (typeof window !== "undefined" && window.gtag) {
            window.gtag("event", "search", {
                search_term: query,
            });
        }
    },
};

