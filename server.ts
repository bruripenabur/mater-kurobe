import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY belum dikonfigurasi pada environment server. Silakan periksa panel Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/ai/generate-cpl', async (req, res) => {
    try {
      const { prodiInfo, profilLulusan, existingCpl, mode } = req.body ?? {};
      if (!prodiInfo?.namaProdi) {
        res.status(400).json({ error: 'Nama Program Studi wajib diisi sebelum menggunakan asisten AI.' });
        return;
      }

      const ai = getGeminiClient();
      const actionMode = mode === 'validate' ? 'validate' : 'generate';

      const prompt = `Anda adalah Pakar Kurikulum Pendidikan Tinggi Berbasis Outcome-Based Education (OBE) dan SN-Dikti / Permendiktisaintek untuk Universitas Pattimura.

Konteks Program Studi:
- Kode Prodi: ${prodiInfo.kodeProdi || '-'}
- Nama Prodi: ${prodiInfo.namaProdi}
- Jenjang: ${prodiInfo.jenjang || 'S1'}
- Tahun Kurikulum: ${prodiInfo.tahunKurikulum || '2026'}
- Total SKS Lulus: ${prodiInfo.totalSksLulus || 144}

Daftar Profil Lulusan (PL):
${JSON.stringify(profilLulusan ?? [], null, 2)}

Daftar CPL Saat Ini:
${JSON.stringify(existingCpl ?? [], null, 2)}

Tugas Anda (Mode: ${actionMode === 'validate' ? 'Validasi & Penyempurnaan CPL yang ada' : 'Generate CPL Baru + Validasi Kelengkapan terhadap PL'}):
1. Jika mode "validate": Tinjau setiap CPL yang ada, evaluasi kesesuaian kata kerja operasional berdasarkan Taksonomi Bloom (C4-C6 untuk kognitif jenjang S1/S2, A3-A5 untuk afektif, P3-P5 untuk psikomotorik), pastikan kalimat aktif terukur tanpa kata ambigu ("memahami", "mengetahui"), dan berikan rumusan perbaikan yang lebih presisi dalam Bahasa Indonesia akademik.
2. Jika mode "generate": Selain menyempurnakan CPL yang belum optimal (jika ada), buatlah usulan rumusan CPL baru yang komprehensif mencakup seluruh Profil Lulusan serta keempat aspek SN-Dikti/Permendiktisaintek ("Sikap", "Pengetahuan", "Keterampilan Umum", "Keterampilan Khusus") dengan penomoran berlanjut (CPL-01, CPL-02, dst.).
3. Petakan setiap CPL ke kode Profil Lulusan (plCodes) yang paling relevan dari daftar PL yang diberikan.
4. Berikan ringkasan evaluasi menyeluruh dalam bahasa Indonesia yang ringkas dan konstruktif.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Berikan output JSON valid sesuai skema. Gunakan bahasa Indonesia baku akademik standar SN-Dikti dan OBE.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'Ringkasan analisis kelayakan dan ketercakupan CPL terhadap Profil Lulusan.',
              },
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    kode: { type: Type.STRING, description: 'Kode CPL seperti CPL-01, CPL-02' },
                    aspek: {
                      type: Type.STRING,
                      description: 'Salah satu dari: Sikap, Pengetahuan, Keterampilan Umum, Keterampilan Khusus',
                    },
                    deskripsi: {
                      type: Type.STRING,
                      description: 'Rumusan CPL terukur dengan kata kerja operasional Taksonomi Bloom.',
                    },
                    plCodes: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Daftar kode PL terkait, misalnya ["PL-01", "PL-02"]',
                    },
                    bloomLevel: {
                      type: Type.STRING,
                      description: 'Level Taksonomi Bloom utama, misal C4 (Menganalisis) atau C5 (Mengevaluasi)',
                    },
                    catatanValidasi: {
                      type: Type.STRING,
                      description: 'Penjelasan singkat perbaikan atau alasan akademis rumusan CPL.',
                    },
                    status: {
                      type: Type.STRING,
                      description: 'Salah satu dari: baru, disempurnakan, valid',
                    },
                  },
                  required: ['kode', 'aspek', 'deskripsi', 'plCodes', 'bloomLevel', 'catatanValidasi', 'status'],
                },
              },
            },
            required: ['summary', 'suggestions'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memproses permintaan AI CPL.';
      console.error('Error /api/ai/generate-cpl:', error);
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/recommend-mapping', async (req, res) => {
    try {
      const { prodiInfo, cplList, mkList } = req.body ?? {};
      if (!Array.isArray(cplList) || cplList.length === 0) {
        res.status(400).json({ error: 'Daftar CPL masih kosong. Lengkapi CPL terlebih dahulu.' });
        return;
      }
      if (!Array.isArray(mkList) || mkList.length === 0) {
        res.status(400).json({ error: 'Daftar Mata Kuliah masih kosong. Tambahkan mata kuliah terlebih dahulu.' });
        return;
      }

      const ai = getGeminiClient();

      const prompt = `Anda adalah Pakar Pemetaan Kurikulum Outcome-Based Education (OBE) Universitas Pattimura.

Program Studi: ${prodiInfo?.namaProdi || '-'} (${prodiInfo?.jenjang || 'S1'})

Daftar CPL Tersedia:
${JSON.stringify(
  cplList.map((c: { kode: string; aspek: string; deskripsi: string }) => ({
    kode: c.kode,
    aspek: c.aspek,
    deskripsi: c.deskripsi,
  })),
  null,
  2
)}

Daftar Mata Kuliah:
${JSON.stringify(
  mkList.map((m: { kode: string; nama: string; sks: number; semester: number; sifat: string; bahanKajian: string }) => ({
    kode: m.kode,
    nama: m.nama,
    sks: m.sks,
    semester: m.semester,
    sifat: m.sifat,
    bahanKajian: m.bahanKajian,
  })),
  null,
  2
)}

Tugas Anda:
1. Untuk setiap Mata Kuliah, tentukan 1 hingga 4 CPL yang paling relevan dan realistis dibebankan pada mata kuliah tersebut (berdasarkan nama mata kuliah, bahan kajian utama, semester, dan sifat mata kuliah). Hindari membebani semua CPL sekaligus pada satu mata kuliah secara tidak realistis.
2. Pastikan seluruh CPL pada daftar CPL mendapatkan minimal 1 mata kuliah pengampu yang relevan jika memungkinkan.
3. Berikan alasan akademis yang spesifik untuk setiap mata kuliah.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Berikan output JSON valid sesuai skema. Hanya gunakan kode CPL yang persis terdapat pada Daftar CPL Tersedia dan kode MK yang persis terdapat pada Daftar Mata Kuliah.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'Ringkasan strategi pembebanan CPL ke mata kuliah secara keseluruhan.',
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    kodeMk: { type: Type.STRING, description: 'Kode MK persis sesuai input' },
                    namaMk: { type: Type.STRING, description: 'Nama MK' },
                    cplCodes: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Array kode CPL yang direkomendasikan, misal ["CPL-01", "CPL-04"]',
                    },
                    alasanAkademis: {
                      type: Type.STRING,
                      description: 'Alasan akademis keterkaitan bahan kajian MK dengan CPL tersebut.',
                    },
                  },
                  required: ['kodeMk', 'namaMk', 'cplCodes', 'alasanAkademis'],
                },
              },
            },
            required: ['summary', 'recommendations'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memproses rekomendasi pemetaan CPL-MK.';
      console.error('Error /api/ai/recommend-mapping:', error);
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIMPEL-OBE 00 server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
