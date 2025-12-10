'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    useEffect(() => {
        if (!error) {
            // No error, just return to home
            router.replace('/');
        }
    }, [error, router]);

    if (!error) {
        return <div className="p-6 text-white">Redirecting...</div>;
    }

    return (
        <div className="p-6 text-white space-y-2">
            <div className="text-red-400 font-semibold">Login error</div>
            <div className="text-red-200 text-sm">{error}</div>
            <button
                onClick={() => router.replace('/')}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
            >
                Go Home
            </button>
        </div>
    );
}

export default function RedirectPage() {
    return (
        <Suspense fallback={<div className="p-6 text-white">Loading...</div>}>
            <RedirectContent />
        </Suspense>
    );
}