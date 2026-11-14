import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type {
  AiMappingRecommendation,
  AiMappingResponse,
  CplItem,
  MataKuliah,
  ProdiIdentity,
  SifatMk,
} from '../types/curriculum';

interface Tab3MkMatrixProps {
  prodiInfo: ProdiIdentity;
  cplList: CplItem[];
  mkList: MataKuliah[];
  onAddMk: (item: Omit<MataKuliah, 'id' | 'cplCodes'>) => void;
  onUpdateMk: (id: string, item: Omit<MataKuliah, 'id' | 'cplCodes'>) => void;
  onDeleteMk: (id: string) => void;
  onToggleCplOnMk: (mkId: string, cplCode: string) => void;
  onApplyAiMappings: (recommendations: AiMappingRecommendation[]) => void;
}

export const Tab3MkMatrix: React.FC<Tab3MkMatrixProps> = ({
  prodiInfo,
  cplList,
  mkList,
  onAddMk,
  onUpdateMk,
  onDeleteMk,
  onToggleCplOnMk,
  onApplyAiMappings,
}) => {
  const [showMkForm, setShowMkForm] = useState(true);
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [sks, setSks] = useState(3);
  const [semester, setSemester] = useState(1);
  const [sifat, setSifat] = useState<SifatMk>('Wajib');
  const [bahanKajian, setBahanKajian] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<number | 'all'>('all');

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiMappingResult, setAiMappingResult] = useState<AiMappingResponse | null>(null);

  const sortedCpls = useMemo(
    () =>
      [...cplList].sort((a, b) =>
        a.kode.localeCompare(b.kode, undefined, { numeric: true })
      ),
    [cplList]
  );

  const sortedMks = useMemo(
    () =>
      [...mkList].sort((a, b) =>
        a.semester !== b.semester
          ? a.semester - b.semester
          : a.kode.localeCompare(b.kode)
      ),
    [mkList]
  );

  const filteredMks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedMks.filter((mk) => {
      if (semesterFilter !== 'all' && mk.semester !== semesterFilter) return false;
      if (!q) return true;
      return (
        mk.kode.toLowerCase().includes(q) ||
        mk.nama.toLowerCase().includes(q) ||
        mk.bahanKajian.toLowerCase().includes(q)
      );
    });
  }, [sortedMks, searchQuery, semesterFilter]);

  // Automatic validation
  const validation = useMemo(() => {
    const validCplSet = new Set(sortedCpls.map((c) => c.kode));
    const cplUsageCount = new Map<string, number>();
    for (const c of sortedCpls) {
      cplUsageCount.set(c.kode, 0);
    }

    const mksWithoutCpl: MataKuliah[] = [];
    for (const mk of mkList) {
      const activeCpls = mk.cplCodes.filter((code) => validCplSet.has(code));
      if (activeCpls.length === 0) {
        mksWithoutCpl.push(mk);
      }
      for (const code of activeCpls) {
        cplUsageCount.set(code, (cplUsageCount.get(code) ?? 0) + 1);
      }
    }

    const cplsWithoutMk = sortedCpls.filter(
      (c) => (cplUsageCount.get(c.kode) ?? 0) === 0
    );

    return {
      cplUsageCount,
      mksWithoutCpl,
      cplsWithoutMk,
      isComplete:
        sortedCpls.length > 0 &&
        mkList.length > 0 &&
        mksWithoutCpl.length === 0 &&
        cplsWithoutMk.length === 0,
    };
  }, [sortedCpls, mkList]);

  const resetForm = () => {
    setKode('');
    setNama('');
    setSks(3);
    setSemester(1);
    setSifat('Wajib');
    setBahanKajian('');
    setEditingId(null);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKode = kode.trim().toUpperCase();
    if (!cleanKode) {
      setFormError('Kode Mata Kuliah wajib diisi.');
      return;
    }
    if (!nama.trim()) {
      setFormError('Nama Mata Kuliah wajib diisi.');
      return;
    }
    const duplicate = mkList.some(
      (m) => m.kode.toUpperCase() === cleanKode && m.id !== editingId
    );
    if (duplicate) {
      setFormError(`Kode MK ${cleanKode} sudah terdaftar dalam kurikulum.`);
      return;
    }

    const payload = {
      kode: cleanKode,
      nama: nama.trim(),
      sks: Math.min(12, Math.max(1, Number(sks) || 1)),
      semester: Math.min(8, Math.max(1, Number(semester) || 1)),
      sifat,
      bahanKajian: bahanKajian.trim(),
    };

    if (editingId) {
      onUpdateMk(editingId, payload);
    } else {
      onAddMk(payload);
    }
    resetForm();
  };

  const startEdit = (mk: MataKuliah) => {
    setEditingId(mk.id);
    setKode(mk.kode);
    setNama(mk.nama);
    setSks(mk.sks);
    setSemester(mk.semester);
    setSifat(mk.sifat);
    setBahanKajian(mk.bahanKajian);
    setFormError(null);
    setShowMkForm(true);
  };

  const handleRecommendMapping = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/recommend-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prodiInfo,
          cplList: sortedCpls,
          mkList: sortedMks,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Gagal mendapatkan rekomendasi pemetaan CPL-MK.');
      }
      setAiMappingResult(data as AiMappingResponse);
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat menghubungi asisten AI.'
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Validation Status Banner */}
      {(sortedCpls.length > 0 || mkList.length > 0) && (
        <section
          className={`rounded-xl border p-4 flex items-start gap-3 ${
            validation.isComplete
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          {validation.isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs sm:text-sm space-y-1 flex-1">
            {validation.isComplete ? (
              <>
                <p className="font-bold">
                  Validasi Otomatis Lulus: Seluruh CPL ({sortedCpls.length}) dan Mata Kuliah ({mkList.length}) telah memiliki pembebanan aktif.
                </p>
                <p className="text-xs text-emerald-800">
                  Matriks siap ditinjau pada tab Rekapitulasi dan disinkronkan ke Ekosistem Supabase untuk Modul 1.
                </p>
              </>
            ) : (
              <>
                <p className="font-bold">
                  Peringatan Validasi Matriks CPL-MK
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-xs">
                  {sortedCpls.length === 0 && (
                    <li>Daftar CPL belum tersedia. Tambahkan CPL di Tab 2 terlebih dahulu.</li>
                  )}
                  {mkList.length === 0 && (
                    <li>Daftar Mata Kuliah masih kosong. Tambahkan mata kuliah di form bawah ini.</li>
                  )}
                  {validation.cplsWithoutMk.length > 0 && (
                    <li>
                      <span className="font-semibold">
                        {validation.cplsWithoutMk.length} CPL belum terbebani pada mata kuliah mana pun:
                      </span>{' '}
                      <span className="font-mono font-semibold">
                        {validation.cplsWithoutMk.map((c) => c.kode).join(', ')}
                      </span>
                    </li>
                  )}
                  {validation.mksWithoutCpl.length > 0 && (
                    <li>
                      <span className="font-semibold">
                        {validation.mksWithoutCpl.length} Mata Kuliah belum memiliki CPL dibebankan:
                      </span>{' '}
                      <span className="font-mono font-semibold">
                        {validation.mksWithoutCpl.map((m) => `${m.kode} (${m.nama})`).join(', ')}
                      </span>
                    </li>
                  )}
                </ul>
              </>
            )}
          </div>
        </section>
      )}

      {/* Section 1: Form Input Mata Kuliah (Collapsible) */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {editingId ? 'Sunting Mata Kuliah' : 'Input Struktur Mata Kuliah'}
            </h2>
            <p className="text-xs text-slate-500">
              Tambahkan daftar mata kuliah per semester beserta SKS, sifat, dan bahan kajian utama.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowMkForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 whitespace-nowrap cursor-pointer"
          >
            {showMkForm ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Sembunyikan Form</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Tampilkan Form Tambah MK</span>
              </>
            )}
          </button>
        </div>

        {showMkForm && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode MK <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={kode}
                  onChange={(e) => setKode(e.target.value.toUpperCase())}
                  placeholder="IKP101"
                  className="w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                />
              </div>

              <div className="lg:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Mata Kuliah <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Misal: Oseanografi Fisika & Kimia"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                />
              </div>

              <div className="lg:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SKS
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={sks}
                  onChange={(e) => setSks(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sifat Mata Kuliah
                </label>
                <select
                  value={sifat}
                  onChange={(e) => setSifat(e.target.value as SifatMk)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                >
                  <option value="Wajib">Wajib</option>
                  <option value="Pilihan">Pilihan</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-12">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bahan Kajian Utama
                </label>
                <input
                  type="text"
                  value={bahanKajian}
                  onChange={(e) => setBahanKajian(e.target.value)}
                  placeholder="Pokok bahasan utama mata kuliah (membantu akurasi rekomendasi pemetaan AI)..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                />
              </div>
            </div>

            {formError && (
              <p className="text-xs font-medium text-rose-600">{formError}</p>
            )}

            <div className="flex items-center justify-end gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Batal Sunting
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e3a8a] hover:bg-[#172e6e] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{editingId ? 'Simpan Perubahan MK' : 'Tambah Mata Kuliah'}</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Section 2: Matriks Interaktif Pembebanan CPL-MK */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Grid3X3 className="w-5 h-5 text-[#1e3a8a]" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Matriks Interaktif Pembebanan CPL ke Mata Kuliah
              </h2>
              <p className="text-xs text-slate-500">
                Centang CPL yang dibebankan pada masing-masing mata kuliah sebagai fondasi RPS OBE.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode/nama MK..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white w-48 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
              />
            </div>

            <select
              aria-label="Filter Semester"
              value={semesterFilter}
              onChange={(e) =>
                setSemesterFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
            >
              <option value="all">Semua Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={isAiLoading || sortedCpls.length === 0 || mkList.length === 0}
              onClick={handleRecommendMapping}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0f172a] hover:bg-[#1e3a8a] disabled:opacity-50 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isAiLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>✨ Rekomendasi Pemetaan CPL-MK Otomatis</span>
            </button>
          </div>
        </div>

        {aiError && (
          <div className="m-4 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
            <span className="font-semibold">Gagal menghasilkan rekomendasi AI:</span> {aiError}
          </div>
        )}

        {/* AI Mapping Review Drawer */}
        {aiMappingResult && (
          <div className="m-4 rounded-xl border border-amber-300 bg-amber-50/50 overflow-hidden">
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Rekomendasi Pemetaan CPL-MK dari AI ({aiMappingResult.recommendations.length} Mata Kuliah)
                </h3>
                <p className="text-xs text-slate-700 mt-0.5">{aiMappingResult.summary}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onApplyAiMappings(aiMappingResult.recommendations);
                    setAiMappingResult(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e3a8a] hover:bg-[#172e6e] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Terapkan Semua ke Matriks</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAiMappingResult(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-amber-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-amber-200/70 bg-white">
              {aiMappingResult.recommendations.map((rec) => (
                <div
                  key={rec.kodeMk}
                  className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-[#1e3a8a]">{rec.kodeMk}</span>
                      <span className="font-semibold text-slate-900">{rec.namaMk}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-mono font-semibold text-amber-800">
                        {rec.cplCodes.join(', ') || 'Tidak ada'}
                      </span>
                    </div>
                    <p className="text-slate-600">{rec.alasanAkademis}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onApplyAiMappings([rec])}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white font-semibold whitespace-nowrap shrink-0 self-start cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    Terapkan
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matrix Grid */}
        {mkList.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Grid3X3 className="w-9 h-9 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              Belum ada Mata Kuliah dalam Matriks
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Tambahkan mata kuliah menggunakan form di atas untuk mulai mencentang pembebanan CPL.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
                  <th className="py-3 px-3 w-24 sticky left-0 z-20 bg-slate-50 border-r border-slate-200 whitespace-nowrap">
                    Kode MK
                  </th>
                  <th className="py-3 px-3 min-w-[230px] sticky left-24 z-20 bg-slate-50 border-r border-slate-200">
                    Mata Kuliah & Bahan Kajian
                  </th>
                  <th className="py-3 px-2.5 text-center w-14 whitespace-nowrap">SKS</th>
                  <th className="py-3 px-2.5 text-center w-14 whitespace-nowrap">Sem</th>
                  <th className="py-3 px-2.5 text-center w-20 whitespace-nowrap border-r border-slate-200">
                    Sifat
                  </th>
                  {sortedCpls.map((cpl) => (
                    <th
                      key={cpl.id}
                      title={`${cpl.kode} (${cpl.aspek}): ${cpl.deskripsi}`}
                      className="py-3 px-2 text-center min-w-[76px] border-r border-slate-100 whitespace-nowrap"
                    >
                      <div className="font-mono font-bold text-[#1e3a8a]">{cpl.kode}</div>
                      <div className="text-[10px] font-normal text-slate-500 truncate max-w-[72px] mx-auto">
                        {cpl.aspek === 'Keterampilan Khusus'
                          ? 'KK'
                          : cpl.aspek === 'Keterampilan Umum'
                            ? 'KU'
                            : cpl.aspek}
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center w-16 whitespace-nowrap bg-slate-50">
                    Total
                  </th>
                  <th className="py-3 px-3 text-right w-20 whitespace-nowrap bg-slate-50">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filteredMks.map((mk) => {
                  const activeCplCount = mk.cplCodes.filter((code) =>
                    sortedCpls.some((c) => c.kode === code)
                  ).length;
                  const rowMissingCpl = sortedCpls.length > 0 && activeCplCount === 0;

                  return (
                    <tr
                      key={mk.id}
                      className={`group transition-colors ${
                        rowMissingCpl
                          ? 'bg-amber-50/40 hover:bg-amber-50/80'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-3 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 font-mono font-bold text-[#1e3a8a] tabular-nums whitespace-nowrap align-top">
                        {mk.kode}
                      </td>
                      <td className="py-3 px-3 sticky left-24 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 align-top">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {mk.nama}
                        </div>
                        {mk.bahanKajian && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {mk.bahanKajian}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono tabular-nums font-semibold text-slate-800 align-top">
                        {mk.sks}
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono tabular-nums text-slate-700 align-top">
                        {mk.semester}
                      </td>
                      <td className="py-3 px-2.5 text-center text-xs text-slate-600 border-r border-slate-200 align-top whitespace-nowrap">
                        {mk.sifat}
                      </td>

                      {sortedCpls.map((cpl) => {
                        const checked = mk.cplCodes.includes(cpl.kode);
                        return (
                          <td
                            key={cpl.id}
                            className={`py-2 px-2 text-center border-r border-slate-100 align-middle transition-colors ${
                              checked ? 'bg-blue-50/60' : ''
                            }`}
                          >
                            <label className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 cursor-pointer">
                              <input
                                type="checkbox"
                                aria-label={`Bebankan ${cpl.kode} pada ${mk.kode}`}
                                checked={checked}
                                onChange={() => onToggleCplOnMk(mk.id, cpl.kode)}
                                className="w-4 h-4 accent-[#1e3a8a] rounded cursor-pointer"
                              />
                            </label>
                          </td>
                        );
                      })}

                      <td className="py-3 px-3 text-center font-mono tabular-nums font-bold align-middle">
                        <span
                          className={
                            rowMissingCpl ? 'text-amber-700' : 'text-[#1e3a8a]'
                          }
                        >
                          {activeCplCount}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap align-middle">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(mk)}
                            title="Sunting Mata Kuliah"
                            className="p-1.5 rounded-md text-slate-500 hover:text-[#1e3a8a] hover:bg-slate-100 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteMk(mk.id)}
                            title="Hapus Mata Kuliah"
                            className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Column Footer Totals */}
              {sortedCpls.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold text-xs text-slate-700">
                    <td
                      colSpan={5}
                      className="py-3 px-3 text-right border-r border-slate-200"
                    >
                      Jumlah Mata Kuliah Pengampu per CPL
                    </td>
                    {sortedCpls.map((cpl) => {
                      const count = validation.cplUsageCount.get(cpl.kode) ?? 0;
                      return (
                        <td
                          key={cpl.id}
                          className={`py-3 px-2 text-center font-mono tabular-nums border-r border-slate-100 ${
                            count === 0 ? 'text-amber-700 bg-amber-50' : 'text-[#1e3a8a]'
                          }`}
                        >
                          {count}
                        </td>
                      );
                    })}
                    <td colSpan={2} className="py-3 px-3 text-center font-mono tabular-nums text-slate-600">
                      {mkList.length} MK
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
