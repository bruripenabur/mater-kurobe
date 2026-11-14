export type JenjangStudi = 'S1' | 'S2' | 'S3' | 'Profesi';

export type AspekCpl =
  | 'Sikap'
  | 'Pengetahuan'
  | 'Keterampilan Umum'
  | 'Keterampilan Khusus';

export type SifatMk = 'Wajib' | 'Pilihan';

export interface ProdiIdentity {
  kodeProdi: string;
  namaProdi: string;
  jenjang: JenjangStudi;
  tahunKurikulum: string;
  totalSksLulus: number;
}

export interface ProfilLulusan {
  id: string;
  kode: string;
  deskripsi: string;
  profesi: string;
}

export interface CplItem {
  id: string;
  kode: string;
  deskripsi: string;
  aspek: AspekCpl;
  plCodes: string[];
}

export interface MataKuliah {
  id: string;
  kode: string;
  nama: string;
  sks: number;
  semester: number;
  sifat: SifatMk;
  bahanKajian: string;
  cplCodes: string[];
}

export interface CurriculumState {
  prodiInfo: ProdiIdentity;
  profilLulusan: ProfilLulusan[];
  cplList: CplItem[];
  mkList: MataKuliah[];
}

export interface CplSnapshotPayload {
  kode: string;
  deskripsi: string;
  aspek: string;
}

export interface ObeKurikulumRow {
  kode_prodi: string;
  nama_prodi: string;
  tahun_kurikulum: string;
  kode_mk: string;
  nama_mk: string;
  sks: number;
  semester: number;
  cpl_dibebankan: CplSnapshotPayload[];
}

export interface SavedProdiSummary {
  key: string;
  kodeProdi: string;
  namaProdi: string;
  tahunKurikulum: string;
  jumlahMk: number;
}

export interface AiCplSuggestion {
  kode: string;
  aspek: AspekCpl;
  deskripsi: string;
  plCodes: string[];
  bloomLevel: string;
  catatanValidasi: string;
  status: 'baru' | 'disempurnakan' | 'valid';
}

export interface AiCplResponse {
  summary: string;
  suggestions: AiCplSuggestion[];
}

export interface AiMappingRecommendation {
  kodeMk: string;
  namaMk: string;
  cplCodes: string[];
  alasanAkademis: string;
}

export interface AiMappingResponse {
  summary: string;
  recommendations: AiMappingRecommendation[];
}
