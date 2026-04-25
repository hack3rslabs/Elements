"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Search, X, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Web Speech API type declarations (not in default TS DOM lib)
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}
type SpeechRecognitionType = Window['SpeechRecognition'] | Window['webkitSpeechRecognition'];

interface SearchResult {
    name: string;
    slug: string;
    price: number;
    mrp: number;
    image: string;
    categoryName: string;
    rating: number;
}

export function VoiceSearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const recognitionRef = useRef<SpeechRecognitionType | null>(null);

    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setTranscript("");
                setResults([]);
                setError("");
                setListening(false);
            }, 0);
        }
    }, [open]);

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Voice search is not supported in your browser. Try Chrome or Edge.");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = "en-IN";
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onresult = (event: { results: { [x: number]: any; length: number; } }) => {
            const result = event.results[event.results.length - 1];
            setTranscript(result[0].transcript);
            if (result.isFinal) {
                searchProducts(result[0].transcript);
            }
        };
        recognition.onerror = () => {
            setError("Couldn't hear you. Please try again.");
            setListening(false);
        };
        recognition.onend = () => setListening(false);

        recognitionRef.current = recognition;
        recognition.start();
        setListening(true);
        setError("");
    };

    const stopListening = () => {
        recognitionRef.current?.stop();
        setListening(false);
    };

    const searchProducts = async (query: string) => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.success) setResults(data.data.products || []);
        } catch {
            setError("Search failed. Please try again.");
        }
        setLoading(false);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="font-bold text-lg">🎤 Voice Search</h2>
                    <button onClick={onClose} aria-label="Close voice search" className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Voice Button */}
                <div className="p-8 flex flex-col items-center">
                    <button
                        onClick={listening ? stopListening : startListening}
                        aria-label={listening ? "Stop listening" : "Start voice search"}
                        className={`h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${listening
                            ? "bg-red-500 animate-pulse scale-110"
                            : "bg-gradient-to-br from-[#1877F2] to-[#0d47a1] hover:scale-105"
                            }`}
                    >
                        {listening ? (
                            <MicOff className="h-10 w-10 text-white" />
                        ) : (
                            <Mic className="h-10 w-10 text-white" />
                        )}
                    </button>
                    <p className="mt-4 text-sm text-muted-foreground">
                        {listening ? "Listening... Speak now" : "Tap to search by voice"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Say &quot;kitchen sink&quot;, &quot;floor tiles&quot;, &quot;elevation panels&quot;...
                    </p>

                    {/* Transcript */}
                    {transcript && (
                        <div className="mt-4 w-full">
                            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium">{transcript}</span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="mt-3 text-sm text-red-500">{error}</p>
                    )}
                </div>

                {/* Results */}
                {loading && (
                    <div className="px-5 pb-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Searching products...
                    </div>
                )}

                {results.length > 0 && (
                    <div className="border-t max-h-[40vh] overflow-y-auto">
                        <p className="px-5 pt-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {results.length} product{results.length > 1 ? 's' : ''} found
                        </p>
                        <div className="p-3 space-y-1">
                            {results.map(p => (
                                <Link
                                    key={p.slug}
                                    href={`/product/${p.slug}`}
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    <div className="h-14 w-14 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative">
                                        <Image src={p.image} alt={p.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{p.name}</p>
                                        <p className="text-xs text-muted-foreground">{p.categoryName}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-sm font-bold text-[#1877F2]">₹{p.price.toLocaleString("en-IN")}</span>
                                            {p.mrp > p.price && (
                                                <span className="text-xs text-muted-foreground line-through">₹{p.mrp.toLocaleString("en-IN")}</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {!loading && transcript && results.length === 0 && (
                    <div className="border-t p-8 text-center">
                        <p className="text-muted-foreground text-sm">No products found for &quot;{transcript}&quot;</p>
                        <p className="text-xs text-muted-foreground mt-1">Try saying something like &quot;kitchen sink&quot; or &quot;floor tiles&quot;</p>
                    </div>
                )}
            </div>
        </div>
    );
}

