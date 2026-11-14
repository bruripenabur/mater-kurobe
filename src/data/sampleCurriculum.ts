import type { CurriculumState } from '../types/curriculum';

export const EMPTY_CURRICULUM_STATE: CurriculumState = {
  prodiInfo: {
    kodeProdi: '',
    namaProdi: '',
    jenjang: 'S1',
    tahunKurikulum: '2026',
    totalSksLulus: 144,
  },
  profilLulusan: [],
  cplList: [],
  mkList: [],
};

export const UNPATTY_SAMPLE_CURRICULUM: CurriculumState = {
  prodiInfo: {
    kodeProdi: 'IKP',
    namaProdi: 'Ilmu Kelautan',
    jenjang: 'S1',
    tahunKurikulum: '2026',
    totalSksLulus: 144,
  },
  profilLulusan: [
    {
      id: 'pl-1',
      kode: 'PL-01',
      deskripsi:
        'Peneliti dan analis sumber daya kelautan kepulauan yang mampu menerapkan metode oseanografi, ekologi terumbu karang, dan pemetaan spasial laut secara ilmiah.',
      profesi: 'Peneliti Kelautan / Analis Sumber Daya Laut',
    },
    {
      id: 'pl-2',
      kode: 'PL-02',
      deskripsi:
        'Pengelola konservasi pesisir, kawasan konservasi perairan, dan mitigasi bencana laut berbasis ekosistem kepulauan dan kearifan lokal Maluku (Sasi).',
      profesi: 'Pengelola Konservasi Pesisir & Laut',
    },
    {
      id: 'pl-3',
      kode: 'PL-03',
      deskripsi:
        'Konsultan dan praktisi teknologi kelautan, pemetaan GIS/penginderaan jauh, serta analisis dampak lingkungan perairan bagi industri maritim berkelanjutan.',
      profesi: 'Konsultan AMDAL & GIS Kelautan',
    },
    {
      id: 'pl-4',
      kode: 'PL-04',
      deskripsi:
        'Wirausahawan dan penggerak ekonomi biru (blue economy) di sektor bioteknologi laut dan ekowisata bahari yang berintegritas dan adaptif.',
      profesi: 'Teknopreneur Ekonomi Biru',
    },
  ],
  cplList: [
    {
      id: 'cpl-1',
      kode: 'CPL-01',
      aspek: 'Sikap',
      deskripsi:
        'Menunjukkan sikap religius, berintegritas akademik, menjunjung tinggi etika profesi kelautan, serta menghargai kearifan lokal masyarakat pesisir kepulauan.',
      plCodes: ['PL-01', 'PL-02', 'PL-04'],
    },
    {
      id: 'cpl-2',
      kode: 'CPL-02',
      aspek: 'Pengetahuan',
      deskripsi:
        'Menganalisis konsep teoretis dinamika oseanografi fisika, kimia, biologi, dan geologi laut pada ekosistem perairan kepulauan tropis.',
      plCodes: ['PL-01', 'PL-03'],
    },
    {
      id: 'cpl-3',
      kode: 'CPL-03',
      aspek: 'Pengetahuan',
      deskripsi:
        'Mengevaluasi prinsip ekologi terumbu karang, padang lamun, mangrove, serta kebijakan tata ruang laut berkelanjutan.',
      plCodes: ['PL-02', 'PL-03'],
    },
    {
      id: 'cpl-4',
      kode: 'CPL-04',
      aspek: 'Keterampilan Umum',
      deskripsi:
        'Merumuskan pemecahan masalah berbasis bukti ilmiah melalui pemikiran logis, kritis, sistematis, dan komunikatif dalam tim multidisiplin.',
      plCodes: ['PL-01', 'PL-02', 'PL-03'],
    },
    {
      id: 'cpl-5',
      kode: 'CPL-05',
      aspek: 'Keterampilan Khusus',
      deskripsi:
        'Melakukan survei lapangan, pengambilan sampel kualitas air dan biota laut, serta analisis data laboratorium kelautan sesuai standar ilmiah.',
      plCodes: ['PL-01', 'PL-02'],
    },
    {
      id: 'cpl-6',
      kode: 'CPL-06',
      aspek: 'Keterampilan Khusus',
      deskripsi:
        'Mengintegrasikan teknologi Penginderaan Jauh dan Sistem Informasi Geografis (SIG) untuk pemetaan habitat pesisir dan mitigasi dinamika laut.',
      plCodes: ['PL-01', 'PL-03'],
    },
    {
      id: 'cpl-7',
      kode: 'CPL-07',
      aspek: 'Keterampilan Khusus',
      deskripsi:
        'Merancang rencana pengelolaan kawasan konservasi perairan, rehabilitasi ekosistem pesisir, dan pengembangan ekowisata bahari berkelanjutan.',
      plCodes: ['PL-02', 'PL-04'],
    },
  ],
  mkList: [
    {
      id: 'mk-1',
      kode: 'IKP101',
      nama: 'Pengantar Ilmu Kelautan Kepulauan',
      sks: 3,
      semester: 1,
      sifat: 'Wajib',
      bahanKajian: 'Karakteristik laut kepulauan, zona pesisir, etika bahari & kearifan lokal Maluku',
      cplCodes: ['CPL-01', 'CPL-02'],
    },
    {
      id: 'mk-2',
      kode: 'IKP102',
      nama: 'Biologi Laut Dasar',
      sks: 3,
      semester: 1,
      sifat: 'Wajib',
      bahanKajian: 'Klasifikasi biota laut, plankton, nekton, bentos, dan interaksi ekosistem',
      cplCodes: ['CPL-02', 'CPL-05'],
    },
    {
      id: 'mk-3',
      kode: 'IKP201',
      nama: 'Oseanografi Fisika & Kimia',
      sks: 4,
      semester: 2,
      sifat: 'Wajib',
      bahanKajian: 'Arus laut, pasang surut, salinitas, DO, nutrien perairan tropis',
      cplCodes: ['CPL-02', 'CPL-05'],
    },
    {
      id: 'mk-4',
      kode: 'IKP202',
      nama: 'Ekologi Terumbu Karang & Mangrove',
      sks: 3,
      semester: 2,
      sifat: 'Wajib',
      bahanKajian: 'Struktur komunitas terumbu karang, lamun, mangrove, dan ketahanan ekosistem',
      cplCodes: ['CPL-03', 'CPL-05'],
    },
    {
      id: 'mk-5',
      kode: 'IKP301',
      nama: 'Metode Survei & Selam Ilmiah',
      sks: 3,
      semester: 3,
      sifat: 'Wajib',
      bahanKajian: 'Transek garis, Reef Check, teknik sampling bawah air, keselamatan selam',
      cplCodes: ['CPL-01', 'CPL-05'],
    },
    {
      id: 'mk-6',
      kode: 'IKP401',
      nama: 'Penginderaan Jauh & SIG Kelautan',
      sks: 3,
      semester: 4,
      sifat: 'Wajib',
      bahanKajian: 'Citra satelit multispektral, pemetaan batimetri dan tutupan karang/mangrove',
      cplCodes: ['CPL-04', 'CPL-06'],
    },
    {
      id: 'mk-7',
      kode: 'IKP501',
      nama: 'Konservasi & Tata Ruang Laut',
      sks: 3,
      semester: 5,
      sifat: 'Wajib',
      bahanKajian: 'Zonasi KKP, daya dukung pesisir, integrasi Sasi laut dalam konservasi',
      cplCodes: ['CPL-01', 'CPL-03', 'CPL-07'],
    },
    {
      id: 'mk-8',
      kode: 'IKP502',
      nama: 'Bioteknologi & Biofarmaka Laut',
      sks: 3,
      semester: 5,
      sifat: 'Pilihan',
      bahanKajian: 'Senyawa bioaktif spons, mikroalga, dan potensi ekonomi biru',
      cplCodes: ['CPL-02', 'CPL-07'],
    },
    {
      id: 'mk-9',
      kode: 'IKP601',
      nama: 'Metodologi Penelitian Kelautan',
      sks: 3,
      semester: 6,
      sifat: 'Wajib',
      bahanKajian: 'Desain eksperimen, analisis multivariat data kelautan, penulisan proposal ilmiah',
      cplCodes: ['CPL-04', 'CPL-05', 'CPL-06'],
    },
    {
      id: 'mk-10',
      kode: 'IKP701',
      nama: 'Ekowisata Bahari Berkelanjutan',
      sks: 3,
      semester: 7,
      sifat: 'Pilihan',
      bahanKajian: 'Perencanaan wisata bahari kepulauan, valuasi ekonomi ekosistem',
      cplCodes: ['CPL-01', 'CPL-07'],
    },
    {
      id: 'mk-11',
      kode: 'IKP801',
      nama: 'Skripsi / Tugas Akhir Riset Kelautan',
      sks: 6,
      semester: 8,
      sifat: 'Wajib',
      bahanKajian: 'Penelitian mandiri, analisis data lapangan/spasial, publikasi ilmiah',
      cplCodes: ['CPL-01', 'CPL-02', 'CPL-04', 'CPL-05', 'CPL-06'],
    },
  ],
};
