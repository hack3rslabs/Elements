"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Elements Error Boundary]", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/20 to-gray-50 flex flex-col items-center justify-center px-4 py-16">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl shadow-red-100/30 border border-white/50 p-10 text-center max-w-md">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-red-200">
                    <AlertTriangle className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                <p className="text-sm text-gray-500 mb-8">
                    An unexpected error occurred. Our team has been notified.
                    Please try again or return to the homepage.
                </p>
                {error.digest && (
                    <p className="text-[10px] text-gray-400 mb-6 font-mono bg-gray-50 rounded-lg py-2 px-3 border">
                        Error ID: {error.digest}
                    </p>
                )}
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1877F2] text-white text-sm font-medium hover:bg-[#0d47a1] transition-all shadow-md shadow-blue-200"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Home className="h-4 w-4" />
                        Home Page
                    </Link>
                </div>
            </div>
            <p className="mt-10 text-xs text-gray-400">
                Elements by Hindustan &bull; Premium Home D&eacute;cor &amp; Construction
            </p>
        </div>
    );
}
