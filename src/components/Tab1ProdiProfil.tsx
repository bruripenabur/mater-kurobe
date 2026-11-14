import React, { useState } from 'react';
import { Briefcase, Building2, Check, Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import type { JenjangStudi, ProdiIdentity, ProfilLulusan } from '../types/curriculum';

interface Tab1ProdiProfilProps {
  prodiInfo: ProdiIdentity;
  profilLulusan: ProfilLulusan[];
  onChangeProdiInfo: (next: ProdiIdentity) => void;
  onAddPl: (item: Omit<ProfilLulusan, 'id'>) => void;
  onUpdatePl: (id: string, item: Omit<ProfilLulusan, 'id'>) => void;
  onDeletePl: (id: string) => void;
}

const JENJANG_OPTIONS: JenjangStudi[] = ['S1', 'S2', 'S3', 'Profesi'];

export const Tab1ProdiProfil: React.FC<Tab1ProdiProfilProps> = ({
  prodiInfo,
  profilLulusan,
  onChangeProdiInfo,
  onAddPl,
  onUpdatePl,
  onDeletePl,
}) => {
  const suggestNextPlCode = () => {
    const nextNum = profilLulusan.length + 1;
    return `PL-${String(nextNum).padStart(2, '0')}`;
  };

  const [kode, setKode] = useState('');
  const [profesi, setProfesi] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setKode('');
    setProfesi('');
    setDeskripsi('');
    setEditingId(null);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalKode = (kode.trim() || suggestNextPlCode()).toUpperCase();
    if (!profesi.trim()) {
      setFormError('Profesi atau peran lulusan wajib diisi.');
      return;
    }
    if (!deskripsi.trim()) {
      setFormError('Deskripsi profil lulusan wajib diisi.');
      return;
    }

    const duplicate = profilLulusan.some(
      (item) => item.kode.toUpperCase() === finalKode && item.id !== editingId
    );
    if (duplicate) {
      setFormError(`Kode ${finalKode} sudah digunakan. Gunakan kode unik.`);
      return;
    }

    if (editingId) {
      onUpdatePl(editingId, {
        kode: finalKode,
        profesi: profesi.trim(),
        deskripsi: deskripsi.trim(),
      });
    } else {
      onAddPl({
        kode: finalKode,
        profesi: profesi.trim(),
        deskripsi: deskripsi.trim(),
      });
    }
    resetForm();
  };

  const startEdit = (item: ProfilLulusan) => {
    setEditingId(item.id);
    setKode(item.kode);
    setProfesi(item.profesi);
    setDeskripsi(item.deskripsi);
    setFormError(null);
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Identitas Program Studi */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-[#1e3a8a]" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                01. Identitas Program Studi
              </h2>
              <p className="text-xs text-slate-500">
                Data pokok program studi sebagai kunci pengelompokan Master Kurikulum OBE.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {prodiInfo.kodeProdi ? `${prodiInfo.kodeProdi} · ${prodiInfo.tahunKurikulum}` : 'Belum diisi'}
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kode Prodi <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={prodiInfo.kodeProdi}
              onChange={(e) =>
                onChangeProdiInfo({
                  ...prodiInfo,
                  kodeProdi: e.target.value.toUpperCase(),
                })
              }
              placeholder="Misal: IKP"
              className="w-full px-3.5 py-2 text-sm font-mono uppercase rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Program Studi <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={prodiInfo.namaProdi}
              onChange={(e) =>
                onChangeProdiInfo({
                  ...prodiInfo,
                  namaProdi: e.target.value,
                })
              }
              placeholder="Misal: Ilmu Kelautan / Budidaya Perairan"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Jenjang Pendidikan
            </label>
            <select
              value={prodiInfo.jenjang}
              onChange={(e) =>
                onChangeProdiInfo({
                  ...prodiInfo,
                  jenjang: e.target.value as JenjangStudi,
                })
              }
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
            >
              {JENJANG_OPTIONS.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tahun <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={prodiInfo.tahunKurikulum}
                onChange={(e) =>
                  onChangeProdiInfo({
                    ...prodiInfo,
                    tahunKurikulum: e.target.value,
                  })
                }
                placeholder="2026"
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Total SKS
              </label>
              <input
                type="number"
                min={24}
                max={200}
                value={prodiInfo.totalSksLulus}
                onChange={(e) =>
                  onChangeProdiInfo({
                    ...prodiInfo,
                    totalSksLulus: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Manajemen Profil Lulusan (PL) */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#1e3a8a]" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                02. Profil Lulusan (PL) Program Studi
              </h2>
              <p className="text-xs text-slate-500">
                Tetapkan peran profesional atau karier utama yang diharapkan dari lulusan prodi.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono tabular-nums font-semibold text-[#1e3a8a]">
            {profilLulusan.length} Profil Lulusan
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Add/Edit PL Form */}
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editingId ? 'Sunting Profil Lulusan' : 'Tambah Profil Lulusan Baru'}
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
                  Kode PL
                </label>
                <input
                  type="text"
                  value={kode}
                  onChange={(e) => setKode(e.target.value.toUpperCase())}
                  placeholder={suggestNextPlCode()}
                  className="w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Profesi / Peran Lulusan <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={profesi}
                  onChange={(e) => setProfesi(e.target.value)}
                  placeholder="Misal: Peneliti Kelautan / Pengelola Konservasi"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                />
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi Profil Lulusan <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Uraikan kompetensi umum atau tanggung jawab utama peran lulusan..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                />
              </div>
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
                <span>{editingId ? 'Simpan Perubahan PL' : 'Tambah Profil Lulusan'}</span>
              </button>
            </div>
          </form>

          {/* List of PL */}
          {profilLulusan.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/40">
              <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                Belum ada Profil Lulusan yang ditambahkan
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Tambahkan minimal 2–4 Profil Lulusan (PL-01, PL-02, dst.) atau muat Contoh Kurikulum Unpatti di bilah atas untuk mulai menyusun CPL.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4 w-28 whitespace-nowrap">Kode PL</th>
                    <th className="py-3 px-4 w-64">Profesi / Peran Lulusan</th>
                    <th className="py-3 px-4">Deskripsi Profil Lulusan</th>
                    <th className="py-3 px-4 w-24 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {profilLulusan.map((pl) => (
                    <tr key={pl.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 align-top font-mono font-semibold text-[#1e3a8a] tabular-nums whitespace-nowrap">
                        {pl.kode}
                      </td>
                      <td className="py-3.5 px-4 align-top font-semibold text-slate-900">
                        {pl.profesi}
                      </td>
                      <td className="py-3.5 px-4 align-top text-slate-600 leading-relaxed">
                        {pl.deskripsi}
                      </td>
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(pl)}
                            title="Sunting Profil Lulusan"
                            className="p-1.5 rounded-md text-slate-500 hover:text-[#1e3a8a] hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePl(pl.id)}
                            title="Hapus Profil Lulusan"
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
