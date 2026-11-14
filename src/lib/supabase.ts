import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  AspekCpl,
  CplItem,
  CplSnapshotPayload,
  CurriculumState,
  MataKuliah,
  ObeKurikulumRow,
  SavedProdiSummary,
} from '../types/curriculum';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || '[MASUKKAN_PROJECT_URL_SUPABASE_ANDA]';
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || '[MASUKKAN_ANON_KEY_SUPABASE_ANDA]';
export const MODUL_RPS_URL =
  import.meta.env.VITE_MODUL_RPS_URL || '[MASUKKAN_URL_MODUL_RPS_ANDA]';

const VALID_ASPEK: AspekCpl[] = [
  'Sikap',
  'Pengetahuan',
  'Keterampilan Umum',
  'Keterampilan Khusus',
];

export function isSupabaseConfigured(): boolean {
  return (
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_ANON_KEY) &&
    !SUPABASE_URL.includes('[MASUKKAN_') &&
    !SUPABASE_ANON_KEY.includes('[MASUKKAN_') &&
    (SUPABASE_URL.startsWith('https://') || SUPABASE_URL.startsWith('http://'))
  );
}

export function isModulRpsUrlConfigured(): boolean {
  return Boolean(MODUL_RPS_URL) && !MODUL_RPS_URL.includes('[MASUKKAN_');
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!cachedClient) {
    cachedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return cachedClient;
}

const DRAFT_STORAGE_PREFIX = 'simpel_obe_00_draft_';
const ACTIVE_DRAFT_KEY = 'simpel_obe_00_active_draft';

export function saveLocalDraft(state: CurriculumState): void {
  try {
    localStorage.setItem(ACTIVE_DRAFT_KEY, JSON.stringify(state));
    if (state.prodiInfo.kodeProdi && state.prodiInfo.tahunKurikulum) {
      const scopedKey = `${DRAFT_STORAGE_PREFIX}${state.prodiInfo.kodeProdi.trim().toUpperCase()}_${state.prodiInfo.tahunKurikulum.trim()}`;
      localStorage.setItem(scopedKey, JSON.stringify(state));
    }
  } catch {
    // Ignore storage quota issues silently
  }
}

export function loadActiveLocalDraft(): CurriculumState | null {
  try {
    const raw = localStorage.getItem(ACTIVE_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CurriculumState;
  } catch {
    return null;
  }
}

export function loadScopedLocalDraft(
  kodeProdi: string,
  tahunKurikulum: string
): CurriculumState | null {
  try {
    const scopedKey = `${DRAFT_STORAGE_PREFIX}${kodeProdi.trim().toUpperCase()}_${tahunKurikulum.trim()}`;
    const raw = localStorage.getItem(scopedKey);
    if (!raw) return null;
    return JSON.parse(raw) as CurriculumState;
  } catch {
    return null;
  }
}

export async function fetchSavedProdiList(): Promise<SavedProdiSummary[]> {
  const client = getSupabaseClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from('obe_kurikulum_prodi')
    .select('kode_prodi, nama_prodi, tahun_kurikulum, kode_mk');

  if (error) {
    throw new Error(`Gagal memuat daftar prodi dari Supabase: ${error.message}`);
  }

  const grouped = new Map<string, SavedProdiSummary>();
  for (const row of data ?? []) {
    const kodeProdi = String(row.kode_prodi ?? '').trim();
    const tahunKurikulum = String(row.tahun_kurikulum ?? '').trim();
    const namaProdi = String(row.nama_prodi ?? '').trim();
    if (!kodeProdi || !tahunKurikulum) continue;

    const key = `${kodeProdi}::${tahunKurikulum}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.jumlahMk += 1;
      if (!existing.namaProdi && namaProdi) {
        existing.namaProdi = namaProdi;
      }
    } else {
      grouped.set(key, {
        key,
        kodeProdi,
        namaProdi: namaProdi || kodeProdi,
        tahunKurikulum,
        jumlahMk: 1,
      });
    }
  }

  return Array.from(grouped.values()).sort((a, b) =>
    `${b.tahunKurikulum}-${a.kodeProdi}`.localeCompare(`${a.tahunKurikulum}-${b.kodeProdi}`)
  );
}

function normalizeAspek(raw: unknown): AspekCpl {
  const str = String(raw ?? '').trim();
  const match = VALID_ASPEK.find((item) => item.toLowerCase() === str.toLowerCase());
  return match ?? 'Keterampilan Khusus';
}

export async function loadProdiFromSupabase(
  kodeProdi: string,
  tahunKurikulum: string
): Promise<CurriculumState> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      'Konfigurasi Supabase belum diisi. Perbarui SUPABASE_URL dan SUPABASE_ANON_KEY pada src/lib/supabase.ts.'
    );
  }

  const { data, error } = await client
    .from('obe_kurikulum_prodi')
    .select('kode_prodi, nama_prodi, tahun_kurikulum, kode_mk, nama_mk, sks, semester, cpl_dibebankan')
    .eq('kode_prodi', kodeProdi)
    .eq('tahun_kurikulum', tahunKurikulum)
    .order('semester', { ascending: true })
    .order('kode_mk', { ascending: true });

  if (error) {
    throw new Error(`Gagal memuat data kurikulum prodi: ${error.message}`);
  }

  const rows = (data ?? []) as ObeKurikulumRow[];
  if (rows.length === 0) {
    throw new Error(`Data kurikulum untuk ${kodeProdi} (${tahunKurikulum}) tidak ditemukan.`);
  }

  const localCompanion = loadScopedLocalDraft(kodeProdi, tahunKurikulum);
  const cplMap = new Map<string, CplItem>();

  if (localCompanion) {
    for (const cpl of localCompanion.cplList) {
      cplMap.set(cpl.kode, cpl);
    }
  }

  const localMkLookup = new Map<string, MataKuliah>();
  if (localCompanion) {
    for (const mk of localCompanion.mkList) {
      localMkLookup.set(mk.kode, mk);
    }
  }

  const mkList: MataKuliah[] = rows.map((row, idx) => {
    const cplPayload = Array.isArray(row.cpl_dibebankan) ? row.cpl_dibebankan : [];
    const cplCodes: string[] = [];

    for (const entry of cplPayload) {
      const kode = String(entry?.kode ?? '').trim();
      if (!kode) continue;
      cplCodes.push(kode);
      if (!cplMap.has(kode)) {
        cplMap.set(kode, {
          id: `cpl-${kode}-${Date.now()}-${cplMap.size}`,
          kode,
          deskripsi: String(entry?.deskripsi ?? '').trim(),
          aspek: normalizeAspek(entry?.aspek),
          plCodes: [],
        });
      }
    }

    const companionMk = localMkLookup.get(row.kode_mk);
    return {
      id: companionMk?.id ?? `mk-${row.kode_mk}-${idx}`,
      kode: row.kode_mk,
      nama: row.nama_mk,
      sks: Number(row.sks) || 2,
      semester: Number(row.semester) || 1,
      sifat: companionMk?.sifat ?? 'Wajib',
      bahanKajian: companionMk?.bahanKajian ?? '',
      cplCodes: Array.from(new Set(cplCodes)),
    };
  });

  const sortedCpls = Array.from(cplMap.values()).sort((a, b) =>
    a.kode.localeCompare(b.kode, undefined, { numeric: true })
  );

  const firstRow = rows[0];
  return {
    prodiInfo: {
      kodeProdi: firstRow.kode_prodi,
      namaProdi: firstRow.nama_prodi,
      jenjang: localCompanion?.prodiInfo.jenjang ?? 'S1',
      tahunKurikulum: firstRow.tahun_kurikulum,
      totalSksLulus: localCompanion?.prodiInfo.totalSksLulus ?? 144,
    },
    profilLulusan: localCompanion?.profilLulusan ?? [],
    cplList: sortedCpls,
    mkList,
  };
}

export async function upsertMasterKurikulumToSupabase(
  state: CurriculumState
): Promise<{ syncedCount: number }> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      'Konfigurasi Supabase belum aktif. Silakan isi SUPABASE_URL dan SUPABASE_ANON_KEY pada src/lib/supabase.ts terlebih dahulu.'
    );
  }

  const kodeProdi = state.prodiInfo.kodeProdi.trim().toUpperCase();
  const namaProdi = state.prodiInfo.namaProdi.trim();
  const tahunKurikulum = state.prodiInfo.tahunKurikulum.trim();

  if (!kodeProdi || !namaProdi || !tahunKurikulum) {
    throw new Error('Kode Prodi, Nama Program Studi, dan Tahun Kurikulum wajib diisi sebelum menyimpan.');
  }

  if (state.mkList.length === 0) {
    throw new Error('Minimal harus terdapat 1 Mata Kuliah dalam matriks sebelum menyinkronkan ke Supabase.');
  }

  const cplByCode = new Map<string, CplItem>();
  for (const cpl of state.cplList) {
    cplByCode.set(cpl.kode, cpl);
  }

  const rows: ObeKurikulumRow[] = state.mkList.map((mk) => {
    const cplDibebankan: CplSnapshotPayload[] = mk.cplCodes
      .map((kode) => cplByCode.get(kode))
      .filter((item): item is CplItem => Boolean(item))
      .map((item) => ({
        kode: item.kode,
        deskripsi: item.deskripsi,
        aspek: item.aspek,
      }));

    return {
      kode_prodi: kodeProdi,
      nama_prodi: namaProdi,
      tahun_kurikulum: tahunKurikulum,
      kode_mk: mk.kode.trim().toUpperCase(),
      nama_mk: mk.nama.trim(),
      sks: Math.max(1, Math.round(Number(mk.sks) || 0)),
      semester: Math.min(8, Math.max(1, Math.round(Number(mk.semester) || 1))),
      cpl_dibebankan: cplDibebankan,
    };
  });

  // Attempt upsert with composite conflict target first; fallback gracefully if table uses a single PK without composite unique index
  const { error: upsertConflictError } = await client
    .from('obe_kurikulum_prodi')
    .upsert(rows, { onConflict: 'kode_prodi,tahun_kurikulum,kode_mk' });

  if (upsertConflictError) {
    if (upsertConflictError.code === '42P10') {
      const { error: upsertDefaultError } = await client
        .from('obe_kurikulum_prodi')
        .upsert(rows);
      if (upsertDefaultError) {
        throw new Error(`Gagal upsert ke Supabase: ${upsertDefaultError.message}`);
      }
    } else {
      throw new Error(`Gagal upsert ke Supabase: ${upsertConflictError.message}`);
    }
  }

  saveLocalDraft(state);
  return { syncedCount: rows.length };
}
