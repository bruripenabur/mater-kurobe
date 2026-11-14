import type { CurriculumState } from '../types/curriculum';

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportCurriculumCsv(state: CurriculumState): void {
  const { prodiInfo, cplList, mkList } = state;
  const sortedCpl = [...cplList].sort((a, b) =>
    a.kode.localeCompare(b.kode, undefined, { numeric: true })
  );
  const sortedMk = [...mkList].sort((a, b) =>
    a.semester !== b.semester
      ? a.semester - b.semester
      : a.kode.localeCompare(b.kode)
  );

  const lines: string[] = [];
  lines.push(
    ['SIMPEL-OBE 00 - MASTER KURIKULUM PRODI', 'UNIVERSITAS PATTIMURA']
      .map(escapeCsvCell)
      .join(',')
  );
  lines.push(
    [
      'Program Studi',
      `${prodiInfo.kodeProdi || '-'} - ${prodiInfo.namaProdi || '-'}`,
      'Jenjang',
      prodiInfo.jenjang,
      'Tahun Kurikulum',
      prodiInfo.tahunKurikulum,
      'Total SKS Lulus',
      prodiInfo.totalSksLulus,
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  lines.push('');

  const header = [
    'Semester',
    'Kode MK',
    'Nama Mata Kuliah',
    'SKS',
    'Sifat',
    'Bahan Kajian Utama',
    ...sortedCpl.map((cpl) => `${cpl.kode} (${cpl.aspek})`),
    'Jumlah CPL',
  ];
  lines.push(header.map(escapeCsvCell).join(','));

  for (const mk of sortedMk) {
    const cplSet = new Set(mk.cplCodes);
    const row = [
      mk.semester,
      mk.kode,
      mk.nama,
      mk.sks,
      mk.sifat,
      mk.bahanKajian || '-',
      ...sortedCpl.map((cpl) => (cplSet.has(cpl.kode) ? 'V' : '')),
      mk.cplCodes.filter((code) => sortedCpl.some((c) => c.kode === code)).length,
    ];
    lines.push(row.map(escapeCsvCell).join(','));
  }

  lines.push('');
  lines.push(['REFERENSI RUMUSAN CPL'].map(escapeCsvCell).join(','));
  lines.push(['Kode CPL', 'Aspek', 'Rumusan Deskripsi CPL', 'Profil Lulusan Terkait'].map(escapeCsvCell).join(','));
  for (const cpl of sortedCpl) {
    lines.push(
      [cpl.kode, cpl.aspek, cpl.deskripsi, cpl.plCodes.join('; ') || '-']
        .map(escapeCsvCell)
        .join(',')
    );
  }

  // UTF-8 BOM so Excel opens Indonesian characters cleanly
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const fileSlug = `${prodiInfo.kodeProdi || 'PRODI'}_${prodiInfo.tahunKurikulum || '2026'}`
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toUpperCase();
  link.href = url;
  link.download = `Matriks_Kurikulum_OBE_${fileSlug}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function triggerPrintCurriculum(): void {
  window.print();
}
