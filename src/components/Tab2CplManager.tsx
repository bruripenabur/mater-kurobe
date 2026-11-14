import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type {
  AiCplResponse,
  AiCplSuggestion,
  AspekCpl,
  CplItem,
  ProdiIdentity,
  ProfilLulusan,
} from '../types/curriculum';

interface Tab2CplManagerProps {
  prodiInfo: ProdiIdentity;
  profilLulusan: ProfilLulusan[];
  cplList: CplItem[];
  onAddCpl: (item: Omit<CplItem, 'id'>) => void;
  onUpdateCpl: (id: string, item: Omit<CplItem, 'id'>) => void;
  onDeleteCpl: (id: string) => void;
  onApplyAiSuggestions: (suggestions: AiCplSuggestion[], replaceAll: boolean) => void;
}

const ASPEK_OPTIONS: AspekCpl[] = [
  'Sikap',
  'Pengetahuan',
  'Keterampilan Umum',
  'Keterampilan Khusus',
];

export const Tab2CplManager: React.FC<Tab2CplManagerProps> = ({
  prodiInfo,
  profilLulusan,
  cplList,
  onAddCpl,
  onUpdateCpl,
  onDeleteCpl,
  onApplyAiSuggestions,
}) => {
  const suggestNextCplCode = () => {
    const nextNum = cplList.length + 1;
    return `CPL-${String(nextNum).padStart(2, '0')}`;
  };

  const [kode, setKode] = useState('');
  const [aspek, setAspek] = useState<AspekCpl>('Keterampilan Khusus');
  const [deskripsi, setDeskripsi] = useState('');
  const [selectedPlCodes, setSelectedPlCodes] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [aiMode, setAiMode] = useState<'generate' | 'validate'>('generate');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiCplResponse | null>(null);

  const togglePlSelection = (plCode: string) => {
    setSelectedPlCodes((prev) =>
      prev.includes(plCode) ? prev.filter((c) => c !== plCode) : [...prev, plCode]
    );
  };

  const resetForm = () => {
    setKode('');
    setAspek('Keterampilan Khusus');
    setDeskripsi('');
    setSelectedPlCodes([]);
    setEditingId(null);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalKode = (kode.trim() || suggestNextCplCode()).toUpperCase();
    if (!deskripsi.trim()) {
      setFormError('Rumusan deskripsi CPL wajib diisi.');
      return;
    }

    const duplicate = cplList.some(
      (c) => c.kode.toUpperCase() === finalKode && c.id !== editingId
    );
    if (duplicate) {
      setFormError(`Kode ${finalKode} sudah terdaftar. Gunakan kode unik.`);
      return;
    }

    const payload: Omit<CplItem, 'id'> = {
      kode: finalKode,
      aspek,
      deskripsi: deskripsi.trim(),
      plCodes: selectedPlCodes,
    };

    if (editingId) {
      onUpdateCpl(editingId, payload);
    } else {
      onAddCpl(payload);
    }
    resetForm();
  };

  const startEdit = (item: CplItem) => {
    setEditingId(item.id);
    setKode(item.kode);
    setAspek(item.aspek);
    setDeskripsi(item.deskripsi);
    setSelectedPlCodes(item.plCodes);
    setFormError(null);
  };

  const handleRunAi = async (mode: 'generate' | 'validate') => {
    setAiMode(mode);
    setIsAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/generate-cpl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prodiInfo,
          profilLulusan,
          existingCpl: cplList,
          mode,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Gagal mendapatkan respons dari asisten AI.');
      }
      setAiResult(data as AiCplResponse);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memanggil AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Assistant Toolbar */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Asisten Perumusan & Validasi CPL Berbasis Taksonomi Bloom (AI)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
              Gunakan kecerdasan buatan untuk menyusun draf CPL dari daftar Profil Lulusan atau memvalidasi kata kerja operasional SN-Dikti/Permendiktisaintek pada CPL yang sudah ada.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={isAiLoading}
            onClick={() => handleRunAi('generate')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f172a] hover:bg-[#1e3a8a] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isAiLoading && aiMode === 'generate' ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
            <span>✨ Generate / Validasi Rumusan CPL dengan AI</span>
          </button>

          {cplList.length > 0 && (
            <button
              type="button"
              disabled={isAiLoading}
              onClick={() => handleRunAi('validate')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 disabled:opacity-60 text-slate-900 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isAiLoading && aiMode === 'validate' ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-amber-700" />
              )}
              <span>Audit CPL Tersimpan</span>
            </button>
          )}
        </div>
      </section>

      {aiError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-semibold">Pemrosesan AI tidak dapat diselesaikan</p>
            <p className="text-xs mt-0.5 text-rose-700">{aiError}</p>
          </div>
        </div>
      )}

      {/* AI Suggestion Review Panel */}
      {aiResult && (
        <section className="bg-white rounded-xl border border-amber-300 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-amber-50/70 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Hasil Rekomendasi & Validasi AI ({aiResult.suggestions.length} Butir CPL)
              </h3>
              <p className="text-xs text-slate-700 mt-0.5">{aiResult.summary}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onApplyAiSuggestions(aiResult.suggestions, false);
                  setAiResult(null);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1e3a8a] hover:bg-[#172e6e] text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Terapkan & Gabungkan Semua</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyAiSuggestions(aiResult.suggestions, true);
                  setAiResult(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Ganti Daftar CPL</span>
              </button>
              <button
                type="button"
                onClick={() => setAiResult(null)}
                aria-label="Tutup panel AI"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-amber-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-200 max-h-[420px] overflow-y-auto">
            {aiResult.suggestions.map((sug, idx) => (
              <div
                key={`${sug.kode}-${idx}`}
                className="p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4 hover:bg-slate-50/70"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-[#1e3a8a] tabular-nums">
                      {sug.kode}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-semibold text-slate-700">{sug.aspek}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-amber-700 font-medium">
                      {sug.bloomLevel}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 uppercase font-semibold">
                      {sug.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-900 leading-relaxed">{sug.deskripsi}</p>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Catatan Evaluasi:</span>{' '}
                    {sug.catatanValidasi}
                    {sug.plCodes?.length > 0 && (
                      <>
                        {' · '}
                        <span className="font-mono text-[#1e3a8a]">
                          PL: {sug.plCodes.join(', ')}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onApplyAiSuggestions([sug], false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 self-start cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Terapkan Butir Ini</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main CPL Form & List */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-[#1e3a8a]" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Rumusan Capaian Pembelajaran Lulusan (CPL) Prodi
              </h2>
              <p className="text-xs text-slate-500">
                Kelola butir CPL beserta aspek SN-Dikti/Permendiktisaintek dan pemetaannya ke Profil Lulusan.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono tabular-nums font-semibold text-[#1e3a8a]">
            {cplList.length} CPL Terdaftar
          </span>
        </div>

        <div className="p-6 space-y-6">
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editingId ? 'Sunting Rumusan CPL' : 'Tambah Rumusan CPL Baru'}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Batal Sunting
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode CPL
                </label>
                <input
                  type="text"
                  value={kode}
                  onChange={(e) => setKode(e.target.value.toUpperCase())}
                  placeholder={suggestNextCplCode()}
                  className="w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Aspek SN-Dikti / Permendiktisaintek
                </label>
                <select
                  value={aspek}
                  onChange={(e) => setAspek(e.target.value as AspekCpl)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                >
                  {ASPEK_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-7">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rumusan Deskripsi CPL <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Contoh: Mampu merancang dan mengevaluasi sistem pengelolaan sumber daya kelautan berkelanjutan..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                />
              </div>
            </div>

            {/* Pemetaan ke Profil Lulusan */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-2">
                Pemetaan Relasi ke Profil Lulusan (PL):
              </span>
              {profilLulusan.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Belum ada Profil Lulusan di Tab 1. Anda tetap dapat menyimpan CPL dan memetakannya nanti.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profilLulusan.map((pl) => {
                    const active = selectedPlCodes.includes(pl.kode);
                    return (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => togglePlSelection(pl.kode)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-[#1e3a8a]'
                        }`}
                      >
                        <span className="font-mono font-semibold">{pl.kode}</span>
                        <span className="opacity-75">·</span>
                        <span className="max-w-[180px] truncate">{pl.profesi}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {formError && (
              <p className="text-xs font-medium text-rose-600">{formError}</p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e3a8a] hover:bg-[#172e6e] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{editingId ? 'Simpan Perubahan CPL' : 'Tambah CPL'}</span>
              </button>
            </div>
          </form>

          {/* CPL Table */}
          {cplList.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/40">
              <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                Daftar CPL masih kosong
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Tambahkan rumusan CPL secara manual di atas atau klik tombol AI untuk menghasilkan draf CPL berdasarkan Profil Lulusan Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4 w-24 whitespace-nowrap">Kode CPL</th>
                    <th className="py-3 px-4 w-44 whitespace-nowrap">Aspek</th>
                    <th className="py-3 px-4">Rumusan Deskripsi CPL</th>
                    <th className="py-3 px-4 w-40">Relasi PL</th>
                    <th className="py-3 px-4 w-24 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {cplList.map((cpl) => (
                    <tr key={cpl.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 align-top font-mono font-bold text-[#1e3a8a] tabular-nums whitespace-nowrap">
                        {cpl.kode}
                      </td>
                      <td className="py-3.5 px-4 align-top text-xs font-semibold text-slate-700 whitespace-nowrap">
                        {cpl.aspek}
                      </td>
                      <td className="py-3.5 px-4 align-top text-slate-800 leading-relaxed">
                        {cpl.deskripsi}
                      </td>
                      <td className="py-3.5 px-4 align-top font-mono text-xs text-slate-600">
                        {cpl.plCodes.length > 0 ? cpl.plCodes.join(', ') : '—'}
                      </td>
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(cpl)}
                            title="Sunting CPL"
                            className="p-1.5 rounded-md text-slate-500 hover:text-[#1e3a8a] hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCpl(cpl.id)}
                            title="Hapus CPL"
                            className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
