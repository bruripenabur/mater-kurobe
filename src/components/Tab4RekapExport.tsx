import React, { useMemo } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Printer,
  AlertTriangle,
} from 'lucide-react';
import type { CurriculumState } from '../types/curriculum';
import {
  exportCurriculumCsv,
  triggerPrintCurriculum,
} from '../utils/exportCurriculum';

interface Tab4RekapExportProps {
  state: CurriculumState;
}

export const Tab4RekapExport: React.FC<Tab4RekapExportProps> = ({ state }) => {
  const { prodiInfo, profilLulusan, cplList, mkList } = state;

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

  const totalSksMapped = useMemo(
    () => mkList.reduce((sum, mk) => sum + (Number(mk.sks) || 0), 0),
    [mkList]
  );

  const semesterBreakdown = useMemo(() => {
    const map = new Map<
      number,
      { semester: number; wajibSks: number; pilihanSks: number; totalSks: number; mkCount: number }
    >();
    for (let s = 1; s <= 8; s++) {
      map.set(s, { semester: s, wajibSks: 0, pilihanSks: 0, totalSks: 0, mkCount: 0 });
    }
    for (const mk of mkList) {
      const sem = Math.min(8, Math.max(1, Number(mk.semester) || 1));
      const entry = map.get(sem)!;
      const sksVal = Number(mk.sks) || 0;
      if (mk.sifat === 'Pilihan') {
        entry.pilihanSks += sksVal;
      } else {
        entry.wajibSks += sksVal;
      }
      entry.totalSks += sksVal;
      entry.mkCount += 1;
    }
    return Array.from(map.values());
  }, [mkList]);

  const maxSemSks = Math.max(
    24,
    ...semesterBreakdown.map((item) => item.totalSks)
  );

  const cplRecap = useMemo(() => {
    return sortedCpls.map((cpl) => {
      const supportingMks = sortedMks.filter((mk) => mk.cplCodes.includes(cpl.kode));
      const totalSksCpl = supportingMks.reduce((s, m) => s + (Number(m.sks) || 0), 0);
      return {
        cpl,
        supportingMks,
        mkCount: supportingMks.length,
        totalSksCpl,
      };
    });
  }, [sortedCpls, sortedMks]);

  const unmappedCplCount = cplRecap.filter((r) => r.mkCount === 0).length;
  const unmappedMkCount = sortedMks.filter(
    (m) => m.cplCodes.filter((c) => sortedCpls.some((cpl) => cpl.kode === c)).length === 0
  ).length;
  const matrixHealthy =
    sortedCpls.length > 0 &&
    sortedMks.length > 0 &&
    unmappedCplCount === 0 &&
    unmappedMkCount === 0;

  return (
    <div className="space-y-6">
      {/* Screen View */}
      <div className="no-print space-y-6">
        {/* Export Action Header */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Rekapitulasi Peta Kurikulum & Ekspor Dokumen Resmi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tinjau keseimbangan beban SKS per semester dan cakupan pembebanan CPL sebelum mencetak atau mengekspor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => exportCurriculumCsv(state)}
              disabled={mkList.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e3a8a] hover:bg-[#172e6e] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Matriks Kurikulum (CSV)</span>
            </button>

            <button
              type="button"
              onClick={triggerPrintCurriculum}
              disabled={mkList.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Ekspor PDF Resmi</span>
            </button>
          </div>
        </section>

        {/* 4-column KPI summary strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">Total Mata Kuliah</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {mkList.length} <span className="text-sm font-sans font-normal text-slate-500">MK</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {profilLulusan.length} Profil Lulusan terdaftar
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">SKS Terstruktur vs Target</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-[#1e3a8a] mt-1">
              {totalSksMapped}{' '}
              <span className="text-sm font-sans font-normal text-slate-500">
                / {prodiInfo.totalSksLulus} SKS
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              {prodiInfo.totalSksLulus > 0
                ? `${Math.round((totalSksMapped / prodiInfo.totalSksLulus) * 100)}% dari target kelulusan`
                : 'Target SKS belum ditetapkan'}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">Rumusan CPL Prodi</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {cplList.length}{' '}
              <span className="text-sm font-sans font-normal text-slate-500">Butir</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Aspek Sikap, Pengetahuan, KU & KK
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">Integritas Matriks OBE</p>
            <div className="mt-1.5 flex items-center gap-2">
              {matrixHealthy ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-sm font-bold text-emerald-700">Lengkap & Valid</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="text-sm font-bold text-amber-700">Perlu Tinjauan</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {matrixHealthy
                ? 'Semua CPL & MK terpetakan'
                : `${unmappedCplCount} CPL kosong · ${unmappedMkCount} MK tanpa CPL`}
            </p>
          </div>
        </section>

        {/* Visual Distribution SKS per Semester */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-[#1e3a8a]" />
              <h3 className="text-base font-bold text-slate-900">
                Distribusi SKS per Semester (Semester 1–8)
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded-xs bg-[#1e3a8a] inline-block" />
                MK Wajib
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded-xs bg-amber-400 inline-block" />
                MK Pilihan
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
              {semesterBreakdown.map((item) => {
                const wajibHeight = Math.round((item.wajibSks / maxSemSks) * 140);
                const pilihanHeight = Math.round((item.pilihanSks / maxSemSks) * 140);
                return (
                  <div
                    key={item.semester}
                    className="flex flex-col items-center p-3 rounded-xl border border-slate-200 bg-slate-50/50"
                  >
                    <div className="text-xs font-mono font-bold tabular-nums text-slate-900 mb-2">
                      {item.totalSks} SKS
                    </div>
                    <div className="w-full h-[148px] flex flex-col justify-end items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-2">
                      {item.pilihanSks > 0 && (
                        <div
                          style={{ height: `${Math.max(8, pilihanHeight)}px` }}
                          className="w-full max-w-[36px] bg-amber-400 rounded-t-sm transition-all"
                          title={`MK Pilihan: ${item.pilihanSks} SKS`}
                        />
                      )}
                      {item.wajibSks > 0 && (
                        <div
                          style={{ height: `${Math.max(8, wajibHeight)}px` }}
                          className="w-full max-w-[36px] bg-[#1e3a8a] rounded-t-sm transition-all"
                          title={`MK Wajib: ${item.wajibSks} SKS`}
                        />
                      )}
                      {item.totalSks === 0 && (
                        <span className="text-[11px] text-slate-400 my-auto">0</span>
                      )}
                    </div>
                    <div className="mt-2.5 text-xs font-semibold text-slate-800">
                      Sem {item.semester}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {item.mkCount} MK
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Recap Table per CPL */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Download className="w-5 h-5 text-[#1e3a8a]" />
              <h3 className="text-base font-bold text-slate-900">
                Rekapitulasi Mata Kuliah Pengampu per CPL
              </h3>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {sortedCpls.length} CPL
            </span>
          </div>

          {sortedCpls.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Belum ada data CPL untuk direkapitulasi.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4 w-24">Kode CPL</th>
                    <th className="py-3 px-4 w-40">Aspek</th>
                    <th className="py-3 px-4">Rumusan CPL</th>
                    <th className="py-3 px-4 w-28 text-center">Jml MK</th>
                    <th className="py-3 px-4 w-28 text-center">Total SKS</th>
                    <th className="py-3 px-4 w-64">Daftar MK Pengampu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {cplRecap.map(({ cpl, supportingMks, mkCount, totalSksCpl }) => (
                    <tr key={cpl.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-[#1e3a8a] tabular-nums align-top whitespace-nowrap">
                        {cpl.kode}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-700 align-top whitespace-nowrap">
                        {cpl.aspek}
                      </td>
                      <td className="py-3 px-4 text-slate-700 text-xs sm:text-sm align-top">
                        {cpl.deskripsi}
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums font-bold align-top">
                        <span className={mkCount === 0 ? 'text-amber-700' : 'text-slate-900'}>
                          {mkCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700 align-top">
                        {totalSksCpl}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-600 align-top">
                        {supportingMks.length > 0
                          ? supportingMks.map((m) => m.kode).join(', ')
                          : 'Belum ada pengampu'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Print-Only Official Document */}
      <div className="hidden print-only text-slate-900 space-y-5">
        <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Pusat Kurikulum dan Inovasi Pembelajaran · Universitas Pattimura
            </p>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              DOKUMEN MASTER KURIKULUM OBE — MATRIKS PEMBEBANAN CPL-MK
            </h1>
          </div>
          <div className="text-right text-xs font-mono">
            <div>
              Prodi: {prodiInfo.kodeProdi || '-'} — {prodiInfo.namaProdi || '-'}
            </div>
            <div>
              Jenjang: {prodiInfo.jenjang} · Tahun: {prodiInfo.tahunKurikulum} · Target:{' '}
              {prodiInfo.totalSksLulus} SKS
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold mb-2">A. Matriks Pembebanan CPL terhadap Mata Kuliah</h2>
          <table className="w-full border-collapse border border-slate-400 text-[11px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-400 py-1.5 px-2 text-center">Sem</th>
                <th className="border border-slate-400 py-1.5 px-2 text-left">Kode MK</th>
                <th className="border border-slate-400 py-1.5 px-2 text-left">Nama Mata Kuliah</th>
                <th className="border border-slate-400 py-1.5 px-2 text-center">SKS</th>
                <th className="border border-slate-400 py-1.5 px-2 text-center">Sifat</th>
                {sortedCpls.map((cpl) => (
                  <th key={cpl.id} className="border border-slate-400 py-1.5 px-1 text-center font-mono">
                    {cpl.kode}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedMks.map((mk) => (
                <tr key={mk.id}>
                  <td className="border border-slate-400 py-1 px-2 text-center font-mono">
                    {mk.semester}
                  </td>
                  <td className="border border-slate-400 py-1 px-2 font-mono font-semibold">
                    {mk.kode}
                  </td>
                  <td className="border border-slate-400 py-1 px-2">{mk.nama}</td>
                  <td className="border border-slate-400 py-1 px-2 text-center font-mono">
                    {mk.sks}
                  </td>
                  <td className="border border-slate-400 py-1 px-2 text-center">{mk.sifat}</td>
                  {sortedCpls.map((cpl) => (
                    <td key={cpl.id} className="border border-slate-400 py-1 px-1 text-center font-bold">
                      {mk.cplCodes.includes(cpl.kode) ? '✓' : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-sm font-bold mb-2">B. Referensi Rumusan Capaian Pembelajaran Lulusan (CPL)</h2>
          <table className="w-full border-collapse border border-slate-400 text-[11px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-400 py-1.5 px-2 text-left w-20">Kode</th>
                <th className="border border-slate-400 py-1.5 px-2 text-left w-36">Aspek</th>
                <th className="border border-slate-400 py-1.5 px-2 text-left">Rumusan CPL</th>
              </tr>
            </thead>
            <tbody>
              {sortedCpls.map((cpl) => (
                <tr key={cpl.id}>
                  <td className="border border-slate-400 py-1 px-2 font-mono font-semibold">
                    {cpl.kode}
                  </td>
                  <td className="border border-slate-400 py-1 px-2">{cpl.aspek}</td>
                  <td className="border border-slate-400 py-1 px-2">{cpl.deskripsi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
