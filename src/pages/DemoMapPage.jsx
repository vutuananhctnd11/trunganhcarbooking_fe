import React from 'react';
import { Link } from 'react-router-dom';
import VietmapBookingDemo from '../components/VietmapBookingDemo';
export default function DemoMapPage() {
    return (<div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-red-600 selection:text-white pb-16">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group text-slate-300 hover:text-white transition-colors no-underline">
            <img src="/trunganhcar_logo.png" alt="Trung Anh Car Logo" className="h-10 sm:h-12 w-auto object-contain filter drop-shadow group-hover:scale-105 transition-transform"/>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-wide text-white block leading-tight">
                TRUNG ANH CAR
              </span>
              <span className="text-[10px] text-red-400 font-semibold uppercase tracking-wider block">
                VIETMAP Maps API Integration (React + Vite)
              </span>
            </div>
          </Link>

          <Link to="/" className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 no-underline">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            <span>Về trang chủ</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        <VietmapBookingDemo />
      </main>
    </div>);
}
