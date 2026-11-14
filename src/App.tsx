import { useEffect, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Grid3X3,
  Info,
  X,
} from 'lucide-react';
import { HeaderBar } from './components/HeaderBar';
import { Tab1ProdiProfil } from './components/Tab1ProdiProfil';
import { Tab2CplManager } from './components/Tab2CplManager';
import { Tab3MkMatrix } from './components/Tab3MkMatrix';
import { Tab4RekapExport } from './components/Tab4RekapExport';
import {
  EMPTY_CURRICULUM_STATE,
  UNPATTY_SAMPLE_CURRICULUM,
} from './data/sampleCurriculum';
import {
  fetchSavedProdiList,
  isModulRpsUrlConfigured,
  isSupabaseConfigured,
  loadActiveLocalDraft,
  loadProdiFromSupabase,
  MODUL_RPS_URL,
  saveLocalDraft,
  upsertMasterKurikulumToSupabase,
} from './lib/supabase';
import type {
  AiCplSuggestion,
  AiMappingRecommendation,
  CplItem,
  CurriculumState,
  MataKuliah,
  ProdiIdentity,
  ProfilLulusan,
  SavedProdiSummary,
} from './types/curriculum';

type TabKey = 'tab1' | 'tab2' | 'tab3' | 'tab4';

interface BannerNotice {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('tab1');
  const [curriculum, setCurriculum] = useState<CurriculumState>(() => {
    return loadActiveLocalDraft() ?? EMPTY_CURRICULUM_STATE;
  });

  const [savedProdiList, setSavedProdiList] = useState<SavedProdiSummary[]>([]);
  const [selectedSavedKey, setSelectedSavedKey] = useState('');
  const [isLoadingProdiList, setIsLoadingProdiList] = useState(false);
  const [isLoadingSelectedProdi, setIsLoadingSelectedProdi] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notice, setNotice] = useState<BannerNotice | null>(null);
  const [showModul1Modal, setShowModul1Modal] = useState(false);

  const supabaseReady = isSupabaseConfigured();

  const refreshProdiList = async () => {
    if (!supabaseReady) return;
    setIsLoadingProdiList(true);
    try {
      const list = await fetchSavedProdiList();
      setSavedProdiList(list);
    } catch (err) {
      setNotice({
        type: 'error',
        title: 'Gagal Memuat Daftar Prodi',
        message:
          err instanceof Error
            ? err.message
            : 'Tidak dapat terhubung ke tabel obe_kurikulum_prodi.',
      });
    } finally {
      setIsLoadingProdiList(false);
    }
  };

  useEffect(() => {
    refreshProdiList();
  }, []);

  useEffect(() => {
    saveLocalDraft(curriculum);
  }, [curriculum]);

  const handleSelectSavedProdi = async (key: string) => {
    setSelectedSavedKey(key);
    if (!key) return;
    const [kodeProdi, tahunKurikulum] = key.split('::');
    if (!kodeProdi || !tahunKurikulum) return;

    setIsLoadingSelectedProdi(true);
    setNotice(null);
    try {
      const loaded = await loadProdiFromSupabase(kodeProdi, tahunKurikulum);
      setCurriculum(loaded);
      setNotice({
        type: 'success',
        title: 'Data Prodi Berhasil Dimuat',
        message: `Kurikulum ${loaded.prodiInfo.kodeProdi} — ${loaded.prodiInfo.namaProdi} (${loaded.prodiInfo.tahunKurikulum}) dengan ${loaded.mkList.length} Mata Kuliah siap disunting.`,
      });
    } catch (err) {
      setNotice({
        type: 'error',
        title: 'Gagal Memuat Kurikulum Prodi',
        message:
          err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunduh data.',
      });
    } finally {
      setIsLoadingSelectedProdi(false);
    }
  };

  const handleLoadSample = () => {
    setCurriculum(UNPATTY_SAMPLE_CURRICULUM);
    setSelectedSavedKey('');
    setNotice({
      type: 'info',
      title: 'Contoh Kurikulum Dimuat',
      message:
        'Data contoh Program Studi Ilmu Kelautan (IKP) Universitas Pattimura Tahun 2026 telah dimuat ke ruang kerja.',
    });
  };

  const handleResetEmpty = () => {
    setCurriculum(EMPTY_CURRICULUM_STATE);
    setSelectedSavedKey('');
    setActiveTab('tab1');
    setNotice({
      type: 'info',
      title: 'Ruang Kerja Dikosongkan',
      message: 'Siap menyusun Master Kurikulum Program Studi baru.',
    });
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setNotice(null);
    try {
      const { syncedCount } = await upsertMasterKurikulumToSupabase(curriculum);
      setNotice({
        type: 'success',
        title: 'Sinkronisasi Ekosistem Supabase Berhasil',
        message: `${syncedCount} mata kuliah untuk ${curriculum.prodiInfo.kodeProdi.toUpperCase()} (${curriculum.prodiInfo.tahunKurikulum}) berhasil disinkronkan ke database pusat (obe_kurikulum_prodi) dan siap ditarik otomatis oleh Modul 1 (Desain RPS OBE).`,
      });
      await refreshProdiList();
    } catch (err) {
      setNotice({
        type: 'error',
        title: 'Sinkronisasi Supabase Memerlukan Perhatian',
        message:
          err instanceof Error
            ? err.message
            : 'Gagal melakukan upsert ke tabel obe_kurikulum_prodi.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoToModul1 = () => {
    if (isModulRpsUrlConfigured()) {
      window.location.href = MODUL_RPS_URL;
    } else {
      setShowModul1Modal(true);
    }
  };

  // Prodi Identity handler
  const handleChangeProdiInfo = (next: ProdiIdentity) => {
    setCurriculum((prev) => ({ ...prev, prodiInfo: next }));
  };

  // PL CRUD
  const handleAddPl = (item: Omit<ProfilLulusan, 'id'>) => {
    setCurriculum((prev) => ({
      ...prev,
      profilLulusan: [
        ...prev.profilLulusan,
        { ...item, id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
      ],
    }));
  };

  const handleUpdatePl = (id: string, item: Omit<ProfilLulusan, 'id'>) => {
    setCurriculum((prev) => {
      const existing = prev.profilLulusan.find((p) => p.id === id);
      const oldKode = existing?.kode;
      const newKode = item.kode;

      return {
        ...prev,
        profilLulusan: prev.profilLulusan.map((p) =>
          p.id === id ? { ...item, id } : p
        ),
        cplList:
          oldKode && oldKode !== newKode
            ? prev.cplList.map((cpl) => ({
                ...cpl,
                plCodes: cpl.plCodes.map((c) => (c === oldKode ? newKode : c)),
              }))
            : prev.cplList,
      };
    });
  };

  const handleDeletePl = (id: string) => {
    setCurriculum((prev) => {
      const target = prev.profilLulusan.find((p) => p.id === id);
      return {
        ...prev,
        profilLulusan: prev.profilLulusan.filter((p) => p.id !== id),
        cplList: target
          ? prev.cplList.map((cpl) => ({
              ...cpl,
              plCodes: cpl.plCodes.filter((c) => c !== target.kode),
            }))
          : prev.cplList,
      };
    });
  };

  // CPL CRUD
  const handleAddCpl = (item: Omit<CplItem, 'id'>) => {
    setCurriculum((prev) => ({
      ...prev,
      cplList: [
        ...prev.cplList,
        { ...item, id: `cpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
      ],
    }));
  };

  const handleUpdateCpl = (id: string, item: Omit<CplItem, 'id'>) => {
    setCurriculum((prev) => {
      const existing = prev.cplList.find((c) => c.id === id);
      const oldKode = existing?.kode;
      const newKode = item.kode;

      return {
        ...prev,
        cplList: prev.cplList.map((c) => (c.id === id ? { ...item, id } : c)),
        mkList:
          oldKode && oldKode !== newKode
            ? prev.mkList.map((mk) => ({
                ...mk,
                cplCodes: mk.cplCodes.map((code) =>
                  code === oldKode ? newKode : code
                ),
              }))
            : prev.mkList,
      };
    });
  };

  const handleDeleteCpl = (id: string) => {
    setCurriculum((prev) => {
      const target = prev.cplList.find((c) => c.id === id);
      return {
        ...prev,
        cplList: prev.cplList.filter((c) => c.id !== id),
        mkList: target
          ? prev.mkList.map((mk) => ({
              ...mk,
              cplCodes: mk.cplCodes.filter((code) => code !== target.kode),
            }))
          : prev.mkList,
      };
    });
  };

  const handleApplyAiCplSuggestions = (
    suggestions: AiCplSuggestion[],
    replaceAll: boolean
  ) => {
    setCurriculum((prev) => {
      if (replaceAll) {
        const nextCpls: CplItem[] = suggestions.map((s, idx) => ({
          id: `cpl-ai-${Date.now()}-${idx}`,
          kode: s.kode.toUpperCase(),
          aspek: s.aspek,
          deskripsi: s.deskripsi,
          plCodes: s.plCodes ?? [],
        }));
        return { ...prev, cplList: nextCpls };
      }

      const merged = [...prev.cplList];
      for (const s of suggestions) {
        const upperKode = s.kode.toUpperCase();
        const existingIdx = merged.findIndex(
          (c) => c.kode.toUpperCase() === upperKode
        );
        if (existingIdx >= 0) {
          merged[existingIdx] = {
            ...merged[existingIdx],
            aspek: s.aspek,
            deskripsi: s.deskripsi,
            plCodes: s.plCodes?.length ? s.plCodes : merged[existingIdx].plCodes,
          };
        } else {
          merged.push({
            id: `cpl-ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            kode: upperKode,
            aspek: s.aspek,
            deskripsi: s.deskripsi,
            plCodes: s.plCodes ?? [],
          });
        }
      }
      return { ...prev, cplList: merged };
    });

    setNotice({
      type: 'success',
      title: 'Rumusan CPL Diperbarui',
      message: `${suggestions.length} rumusan CPL dari asisten AI telah diterapkan ke daftar CPL Prodi.`,
    });
  };

  // MK CRUD & Matrix Toggles
  const handleAddMk = (item: Omit<MataKuliah, 'id' | 'cplCodes'>) => {
    setCurriculum((prev) => ({
      ...prev,
      mkList: [
        ...prev.mkList,
        {
          ...item,
          id: `mk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          cplCodes: [],
        },
      ],
    }));
  };

  const handleUpdateMk = (id: string, item: Omit<MataKuliah, 'id' | 'cplCodes'>) => {
    setCurriculum((prev) => ({
      ...prev,
      mkList: prev.mkList.map((m) => (m.id === id ? { ...m, ...item } : m)),
    }));
  };

  const handleDeleteMk = (id: string) => {
    setCurriculum((prev) => ({
      ...prev,
      mkList: prev.mkList.filter((m) => m.id !== id),
    }));
  };

  const handleToggleCplOnMk = (mkId: string, cplCode: string) => {
    setCurriculum((prev) => ({
      ...prev,
      mkList: prev.mkList.map((mk) => {
        if (mk.id !== mkId) return mk;
        const exists = mk.cplCodes.includes(cplCode);
        return {
          ...mk,
          cplCodes: exists
            ? mk.cplCodes.filter((c) => c !== cplCode)
            : [...mk.cplCodes, cplCode],
        };
      }),
    }));
  };

  const handleApplyAiMappings = (recommendations: AiMappingRecommendation[]) => {
    setCurriculum((prev) => {
      const validCplSet = new Set(prev.cplList.map((c) => c.kode));
      const recByMkCode = new Map<string, string[]>();
      for (const rec of recommendations) {
        const filteredCodes = rec.cplCodes.filter((code) => validCplSet.has(code));
        recByMkCode.set(rec.kodeMk.toUpperCase(), Array.from(new Set(filteredCodes)));
      }

      return {
        ...prev,
        mkList: prev.mkList.map((mk) => {
          const suggested = recByMkCode.get(mk.kode.toUpperCase());
          if (!suggested) return mk;
          return { ...mk, cplCodes: suggested };
        }),
      };
    });

    setNotice({
      type: 'success',
      title: 'Pemetaan CPL-MK Diterapkan',
      message: `Rekomendasi pembebanan CPL untuk ${recommendations.length} mata kuliah telah diterapkan pada matriks.`,
    });
  };

  const tabs: {
    key: TabKey;
    label: string;
    countLabel?: string;
    icon: typeof Building2;
  }[] = [
    {
      key: 'tab1',
      label: '1. Identitas Prodi & Profil Lulusan',
      countLabel: `${curriculum.profilLulusan.length} PL`,
      icon: Building2,
    },
    {
      key: 'tab2',
      label: '2. Rumusan CPL + AI',
      countLabel: `${curriculum.cplList.length} CPL`,
      icon: GraduationCap,
    },
    {
      key: 'tab3',
      label: '3. Mata Kuliah & Matriks CPL-MK',
      countLabel: `${curriculum.mkList.length} MK`,
      icon: Grid3X3,
    },
    {
      key: 'tab4',
      label: '4. Rekapitulasi & Ekspor',
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <HeaderBar
        savedProdiList={savedProdiList}
        selectedSavedKey={selectedSavedKey}
        isLoadingProdiList={isLoadingProdiList}
        isLoadingSelectedProdi={isLoadingSelectedProdi}
        isSyncing={isSyncing}
        supabaseConfigured={supabaseReady}
        onRefreshProdiList={refreshProdiList}
        onSelectSavedProdi={handleSelectSavedProdi}
        onLoadSample={handleLoadSample}
        onResetEmpty={handleResetEmpty}
        onSyncToSupabase={handleSyncToSupabase}
        onGoToModul1={handleGoToModul1}
      />

      {/* Sticky Workspace Tab Navigation */}
      <nav
        aria-label="Navigasi Tahapan Kurikulum OBE"
        className="no-print sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#0f172a] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.countLabel && (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      active ? 'text-amber-300' : 'text-slate-400'
                    }`}
                  >
                    · {tab.countLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {notice && (
          <div
            role="status"
            className={`no-print rounded-xl border p-4 flex items-start justify-between gap-3 ${
              notice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : notice.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : 'bg-blue-50 border-blue-200 text-slate-900'
            }`}
          >
            <div className="flex items-start gap-3">
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : notice.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-[#1e3a8a] shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-bold">{notice.title}</p>
                <p className="text-xs sm:text-sm opacity-90 mt-0.5">{notice.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Tutup notifikasi"
              className="p-1 rounded-md hover:bg-black/5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === 'tab1' && (
          <Tab1ProdiProfil
            prodiInfo={curriculum.prodiInfo}
            profilLulusan={curriculum.profilLulusan}
            onChangeProdiInfo={handleChangeProdiInfo}
            onAddPl={handleAddPl}
            onUpdatePl={handleUpdatePl}
            onDeletePl={handleDeletePl}
          />
        )}

        {activeTab === 'tab2' && (
          <Tab2CplManager
            prodiInfo={curriculum.prodiInfo}
            profilLulusan={curriculum.profilLulusan}
            cplList={curriculum.cplList}
            onAddCpl={handleAddCpl}
            onUpdateCpl={handleUpdateCpl}
            onDeleteCpl={handleDeleteCpl}
            onApplyAiSuggestions={handleApplyAiCplSuggestions}
          />
        )}

        {activeTab === 'tab3' && (
          <Tab3MkMatrix
            prodiInfo={curriculum.prodiInfo}
            cplList={curriculum.cplList}
            mkList={curriculum.mkList}
            onAddMk={handleAddMk}
            onUpdateMk={handleUpdateMk}
            onDeleteMk={handleDeleteMk}
            onToggleCplOnMk={handleToggleCplOnMk}
            onApplyAiMappings={handleApplyAiMappings}
          />
        )}

        {activeTab === 'tab4' && <Tab4RekapExport state={curriculum} />}
      </main>

      {/* Clean Institutional Footer */}
      <footer className="no-print border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
          <span>
            Pusat Kurikulum dan Inovasi Pembelajaran · Universitas Pattimura
          </span>
          <span>
            SIMPEL-OBE 00 · Fondasi Pembebanan CPL ke Mata Kuliah
          </span>
        </div>
      </footer>

      {/* Modal for unconfigured Modul 1 URL */}
      {showModul1Modal && (
        <div className="no-print fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ExternalLink className="w-5 h-5 text-[#1e3a8a]" />
                <h3 className="text-base font-bold text-slate-900">
                  Tautan Modul 1: Desain RPS OBE
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModul1Modal(false)}
                className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              URL tujuan Modul 1 saat ini masih menggunakan placeholder{' '}
              <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                {MODUL_RPS_URL}
              </code>
              . Atur variabel lingkungan <code className="font-mono text-xs">VITE_MODUL_RPS_URL</code> atau ganti konstanta <code className="font-mono text-xs">MODUL_RPS_URL</code> pada <code className="font-mono text-xs">src/lib/supabase.ts</code> agar tombol ini langsung membuka aplikasi Modul 1.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowModul1Modal(false)}
                className="px-4 py-2 rounded-lg bg-[#1e3a8a] hover:bg-[#172e6e] text-white text-xs font-semibold cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
