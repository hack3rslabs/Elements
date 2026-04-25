"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const trackEvent = async () => {
            const sessionId = localStorage.getItem('elements_session_id');
            const params: Record<string, string> = {};
            searchParams.forEach((value, key) => {
                params[key] = value;
            });

            try {
                await fetch("http://localhost:5000/api/analytics", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId,
                        event: "page_view",
                        path: pathname,
                        params,
                        metadata: {
                            userAgent: navigator.userAgent,
                            screenSize: `${window.innerWidth}x${window.innerHeight}`
                        }
                    })
                });
            } catch {
                // Background tracking, fail silently
            }
        };

        trackEvent();
    }, [pathname, searchParams]);

    return null; // Invisible component
}
