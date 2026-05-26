import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { handleAction } from "./server-db";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not configured or placeholder. AI features will run in Demo mode.");
    return null;
  }
  
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. API Endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
});

// Endpoint to fetch Code.gs content dynamically
app.get("/api/apps-script-code", (req, res) => {
  try {
    const codePath = path.join(process.cwd(), "apps-script", "Code.gs");
    if (fs.existsSync(codePath)) {
      const code = fs.readFileSync(codePath, "utf-8");
      res.json({ status: "success", code });
    } else {
      res.status(404).json({ status: "error", message: "File Code.gs tidak ditemukan." });
    }
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Centralized persistent JSON file DB endpoint
app.post("/api/db", (req, res) => {
  const { action, payload } = req.body;
  try {
    const result = handleAction(action, payload);
    res.json({ status: "success", data: result });
  } catch (err: any) {
    console.error(`Server DB Error [${action}]: `, err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// AI Chatbot Admin & Business Consultant
app.post("/api/ai/chatbot", async (req, res) => {
  let { message, context, prompt: bodyPrompt } = req.body;
  const client = getAiClient();
  
  // Backwards compatibility fallback in case prompt/message references are transposed
  if (bodyPrompt && !message) {
    message = bodyPrompt;
  }
  
  if (!client) {
    // Elegant fallback simulation
    const simulatedReply = `[MODE DEMO - Kunci API Gemini Belum Dikonfigurasi]\n\nHalo! Saya Asisten AI POS Anda. Saat ini saya berjalan dalam mode simulasi karena Kunci API Gemini belum dipasang di panel **Settings > Secrets**.\n\nBerdasarkan data toko Anda saat ini:\n1. **Total produk aktif**: ${context?.productsCount || 0} SKU\n2. **Total transaksi tercatat**: ${context?.transactionsCount || 0} transaksi\n3. **Pendapatan saat ini**: Rp ${Number(context?.totalRevenue || 0).toLocaleString('id-ID')}\n4. **Saldo cashflow**: Rp ${Number(context?.cashBalance || 0).toLocaleString('id-ID')}\n\n*Pesan*: Masukkan kunci API Gemini Anda di pengaturan AI Studio untuk mengaktifkan kecerdasan analitis real-time!`;
    return res.json({
      reply: simulatedReply,
      text: simulatedReply
    });
  }

  try {
    const prompt = `Anda adalah Consultant Business & AI Assistant POS Enterprise bernama 'POS-AI-PRO' yang sangat ahli.
Analisis data POS saat ini secara mendalam untuk membantu pemilik toko membuat keputusan taktis terbaik.
Jawab dengan ramah, profesional, menggunakan Bahasa Indonesia yang ringkas namun sarat solusi bisnis tingkat tinggi.

DATA POS AKTIF:
- Total Pendapatan: Rp ${Number(context?.totalRevenue || 0).toLocaleString('id-ID')}
- Total Transaksi: ${context?.transactionsCount || 0}
- Produk Menipis/Kritis: ${JSON.stringify(context?.lowStockProducts || [])}
- Transaksi Terbaru: ${JSON.stringify(context?.recentTransactions || []).slice(0, 500)}
- Saldo Arus Kas: Rp ${Number(context?.cashBalance || 0).toLocaleString('id-ID')}

Pertanyaan Pemilik Toko: "${message || 'Berikan ringkasan ringkas data toko saya'}"

Berikan saran operasional, strategi bundling promo, optimasi stok minimum, dan efisiensi rantai pasokan.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    res.json({ 
      reply: response.text, 
      text: response.text 
    });
  } catch (err: any) {
    console.error("Gemini Chatbot Error: ", err);
    res.status(500).json({ error: "Gagal memproses jawaban AI: " + err.message });
  }
});

// AI Predictions, Sales Analysis & Insights Generation
app.post("/api/ai/business-insights", async (req, res) => {
  const { context } = req.body;
  const client = getAiClient();

  if (!client) {
    // Elegant metrics generator mock to maintain top UX
    return res.json({
      insight: `### 📈 Analisis Performa Penjualan & Prediksi Stok (Demo)

1. **Rekomendasi Bundling Produk**:
   * Gabungkan **Kopi Susu Gula Aren** dengan **Roti Gandum Sehat** sebagai paket sarapan praktis. Berikan potongan harga bundling Rp 1.500 untuk menarik minat beli silang dari 2 kategori berbeda.
   
2. **Prediksi Kritis Berdasarkan Log Stok**:
   * **Roti Gandum Sehat** saat ini tersisa **15 unit**. Menilik rata-rata penjualan 8 unit per 2 hari, produk ini diprediksi **habis dalam waktu 36 jam ke depan**.
   * Kami menyarankan untuk memesan ulang (Purchase Order) minimal **50 unit** sekarang ke supplier *PT Sumber Pangan Makmur*.
   
3. **Efisiensi Rencana Arus Kas**:
   * Biaya operasional cabang Lahat saat ini bersumber pada pengeluaran ATK sebesar Rp 150.000. Rasio biaya operasional terhadap total omzet berada di angka **18.4%** yang terhitung cukup sehat untuk fase scaling.`
    });
  }

  try {
    const prompt = `Anda adalah Kepala Business Intelligence POS serverless. Analisis data penjualan, tingkat stok minimum, dan kasir lalu berikan 3 anjuran taktis tajam terlokalisasi dalam format Markdown.

DATA OPERASIONAL:
- Produk Aktif: ${JSON.stringify(context?.products || []).slice(0, 1000)}
- Riwayat Arus Kas: ${JSON.stringify(context?.cashflows || []).slice(0, 1000)}
- Riwayat Transaksi Penjualan: ${JSON.stringify(context?.transactions || []).slice(0, 1000)}
- Peringatan Stok Kritis: ${JSON.stringify(context?.lowStockProducts || [])}

Tuliskan laporan komprehensif berisi:
1. **Analisis Tren Penjualan & Bundling Cerdas** (Strategi promo bundling, item terlaris).
2. **Prediksi Kehabisan Stok** (Berdasarkan sisa stok vs stok minimum, kapan harus order).
3. **Optimasi Arus Keuangan (Laba Rugi)** (Efisiensi modal, cashflow).

Gunakan Bahasa Indonesia yang sangat profesional dan elegan.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.5,
      }
    });

    res.json({ insight: response.text });
  } catch (err: any) {
    console.error("Gemini Insights Error: ", err);
    res.status(500).json({ error: "Gagal memproses insight bisnis: " + err.message });
  }
});

// Vite Middleware & Static Serving Setup
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Enterprise POS Server] Running on http://localhost:${PORT}`);
  });
}

start();
