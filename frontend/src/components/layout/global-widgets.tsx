"use client";

import { usePathname } from "next/navigation";
import { AIAssistant } from "@/components/ai/ai-assistant";
import { FloatingWhatsApp } from "@/components/ui/whatsapp-button";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";
import { LeadGenGate } from "@/components/analytics/lead-gen-gate";
import { Suspense } from "react";

export function GlobalWidgets() {
    const pathname = usePathname();
    const isAdminOrLogin = pathname?.startsWith("/admin") || pathname?.startsWith("/login");

    return (
        <>
            <Suspense fallback={null}>
                <AnalyticsTracker />
            </Suspense>
            {!isAdminOrLogin && <LeadGenGate />}
            {!isAdminOrLogin && <FloatingWhatsApp />}
            {!isAdminOrLogin && <AIAssistant />}
        </>
    );
}
