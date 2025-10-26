// server.js
// Express sunucu: PDF alır, pdf-parse ile metin çıkarır.
// Eğer OPENAI_API_KEY environment variable varsa gerçek OpenAI Chat API'sine bağlanır.
// Eğer anahtar yoksa "demo modu"nda lokal, basit cevap üretir (hiçbir gizli anahtar içermez).

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const fetch = require('node-fetch');

const app = express();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 30 * 1024 * 1024 } }); // 30MB limit

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4';

app.use(express.static(path.join(__dirname, '/')));

app.post('/api/ask', upload.single('pdf'), async (req, res) => {
  try {
    const file = req.file;
    const question = (req.body.question || '').trim();

    if (!file || !question) {
      if (file && file.path) try { fs.unlinkSync(file.path); } catch (e) {}
      return res.status(400).json({ error: 'PDF ve soru gerekli.' });
    }

    const dataBuffer = fs.readFileSync(file.path);
    const pdfData = await pdfParse(dataBuffer);
    let text = (pdfData && pdfData.text) ? pdfData.text : '';
    text = text.replace(/\s+/g, ' ').trim();

    // Temel güvenlik: dosyayı hemen sil
    try { fs.unlinkSync(file.path); } catch (e) {}

    // Eğer OPENAI_API_KEY varsa gerçek modele sor
    if (OPENAI_API_KEY) {
      const systemPrompt = "Sadece verilen PDF içeriğine dayanarak cevap ver. Eğer belge cevap için yeterli bilgi içermiyorsa dürüstçe 'Belgede bilgi yok' diye belirt. Cevap Türkçe olsun.";
      const userPrompt = `PDF İçeriği:
${text}

Soru: ${question}

Cevap:`;

      const apiUrl = 'https://api.openai.com/v1/chat/completions';
      const requestBody = {
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1500
      };

      const apiRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      const apiData = await apiRes.json();
      if (!apiRes.ok) {
        console.error('OpenAI API hata:', apiData);
        return res.status(502).json({ error: 'OpenAI API hatası', detail: apiData });
      }

      const answer = apiData.choices?.[0]?.message?.content ?? null;
      if (!answer) {
        return res.status(500).json({ error: 'Modelden geçerli cevap alınamadı.', raw: apiData });
      }
      return res.json({ answer, mode: 'openai' });
    }

    // Demo modu: basit anahtar kelime araması ve en yakın cümleyi döndürme
    const q = question.toLowerCase();
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    // öncelikli arama: tam soru kelimelerinin geçtiği cümle
    const qWords = q.split(/\s+/).filter(w => w.length>2);
    let best = null;
    let bestMatchCount = 0;

    for (const s of sentences) {
      const sLower = s.toLowerCase();
      let matchCount = 0;
      for (const w of qWords) {
        if (sLower.includes(w)) matchCount++;
      }
      if (matchCount > bestMatchCount) {
        bestMatchCount = matchCount;
        best = s;
      }
    }

    let answerText = '';
    if (best && bestMatchCount > 0) {
      answerText = best.trim();
    } else if (sentences.length > 0) {
      // fallback: ilk birkaç cümleyi özet gibi döndür
      answerText = sentences.slice(0, 3).join(' ');
    } else {
      answerText = 'Belge okunamadı veya metin bulunamadı.';
    }

    // Demo uyarısı ile döndür
    return res.json({
      answer: `Demo modu yanıtı (gerçek model yok):\n\n${answerText}`,
      mode: 'demo'
    });
  } catch (err) {
    console.error('Sunucu hata:', err);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

app.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
  if (!OPENAI_API_KEY) {
    console.log('UYARI: OPENAI_API_KEY tanımlı değil. Sunucu demo modunda çalışıyor (gerçek modele bağlanmaz).');
  } else {
    console.log('OPENAI_API_KEY bulundu. Sunucu OpenAI ile iletişim kuracak.');
  }
});