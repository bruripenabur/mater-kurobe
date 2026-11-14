import React from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CloudUpload,
  Database,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { SavedProdiSummary } from '../types/curriculum';

interface HeaderBarProps {
  savedProdiList: SavedProdiSummary[];
  selectedSavedKey: string;
  isLoadingProdiList: boolean;
  isLoadingSelectedProdi: boolean;
  isSyncing: boolean;
  supabaseConfigured: boolean;
  onRefreshProdiList: () => void;
  onSelectSavedProdi: (key: string) => void;
  onLoadSample: () => void;
  onResetEmpty: () => void;
  onSyncToSupabase: () => void;
  onGoToModul1: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  savedProdiList,
  selectedSavedKey,
  isLoadingProdiList,
  isLoadingSelectedProdi,
  isSyncing,
  supabaseConfigured,
  onRefreshProdiList,
  onSelectSavedProdi,
  onLoadSample,
  onResetEmpty,
  onSyncToSupabase,
  onGoToModul1,
}) => {
  return (
    <header className="no-print bg-gradient-to-r from-[#0f172a] via-[#162550] to-[#1e3a8a] text-white border-b border-amber-400/30 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top institutional row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-amber-400/15 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white text-balance">
                  SIMPEL-OBE 00: MASTER KURIKULUM PRODI
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-medium whitespace-nowrap shrink-0">
                  <Award className="w-3.5 h-3.5" />
                  Inovasi Mutu Akademik
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200/90 mt-0.5">
                Fondasi Pembebanan CPL ke Mata Kuliah (Single Source of Truth) · Pusat Kurikulum dan Inovasi Pembelajaran — Universitas Pattimura
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onSyncToSupabase}
              disabled={isSyncing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-semibold text-xs sm:text-sm transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4" />
              )}
              <span>
                {isSyncing
                  ? 'Menyinkronkan...'
                  : 'Simpan Master Kurikulum ke Ekosistem Supabase'}
              </span>
            </button>

            <button
              type="button"
              onClick={onGoToModul1}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Lanjut ke Modul 1: Desain RPS OBE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace utility bar: Load Prodi from Supabase + Sample Data */}
        <div className="mt-3.5 pt-3 border-t border-white/15 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium whitespace-nowrap">
              <Database className="w-3.5 h-3.5" />
              <span>Muat Data Prodi:</span>
            </div>

            <div className="flex items-center gap-1.5">
              <select
                aria-label="Muat Data Kurikulum Prodi dari Supabase"
                value={selectedSavedKey}
                onChange={(e) => onSelectSavedProdi(e.target.value)}
                disabled={isLoadingProdiList || isLoadingSelectedProdi}
                className="bg-slate-900/70 border border-white/20 text-white text-xs rounded-lg px-3 py-1.5 min-w-[240px] max-w-[340px] focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
              >
                <option value="">
                  {!supabaseConfigured
                    ? 'Supabase belum dikonfigurasi (Mode Draf Lokal)'
                    : isLoadingProdiList
                      ? 'Memuat daftar prodi dari Supabase...'
                      : savedProdiList.length === 0
                        ? 'Belum ada data prodi tersimpan di Supabase'
                        : '-- Pilih Prodi & Tahun Kurikulum --'}
                </option>
                {savedProdiList.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.kodeProdi} · {item.namaProdi} ({item.tahunKurikulum}) — {item.jumlahMk} MK
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={onRefreshProdiList}
                disabled={isLoadingProdiList}
                title="Segarkan daftar prodi dari Supabase"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProdiList ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoadingSelectedProdi && (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-200">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Mengunduh matriks prodi...
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onLoadSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-medium text-amber-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Muat Contoh Kurikulum Unpatti (IKP)</span>
            </button>

            <button
              type="button"
              onClick={onResetEmpty}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-transparent hover:bg-white/10 border border-white/15 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kurikulum Baru</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
