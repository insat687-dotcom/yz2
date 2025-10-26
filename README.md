# PDF Soru-Cevap Sistemi (Demo-ready)

Bu proje, PDF yükleyip soruyu sunucuya göndererek cevap almanızı sağlar. Eğer `OPENAI_API_KEY` ortam değişkeni yoksa sunucu "demo modu"nda çalışır ve belge içeriğine dayalı basit, lokal cevaplar döner — böylece hiçbir dosyayı düzenlemeden doğrudan çalıştırabilirsiniz.

Özellikler:
- Demo modu: OPENAI_API_KEY yoksa çalışır (tamamen local, hiçbir gizli anahtar içermez).
- Gerçek mod: `.env` içine `OPENAI_API_KEY` koyarsanız OpenAI Chat Completions API'sine bağlanır.
- PDF'ten metin çıkarma: `pdf-parse` kullanılır.
- Basit web arayüzü: index.html + style.css + script.js

Hızlı başlatma (değişiklik yapmadan, demo modunda çalıştırmak için):
1. Node.js (14+) yüklü olsun.
2. Terminalde proje dizininde:
   - `npm install`
   - `npm start`
3. Tarayıcıda `http://localhost:3000` açın.
4. PDF yükleyin, soruyu yazın ve "Soru Sor" butonuna tıklayın. (Demo modunda cevaplar basit kurallara göre üretilir.)

Gerçek OpenAI entegrasyonu:
- `.env` dosyasına `OPENAI_API_KEY=sk-...` ekleyin (bu anahtarı güvenli tutun).
- (Zorunlu:) sızdırılmış bir anahtarınız olduysa OpenAI panelinden derhal iptal edin.
- Ardından `npm start` ile sunucuyu yeniden başlatın; sunucu gerçek model ile çalışacaktır.

Güvenlik notları:
- Demo modunu geliştirme/test için kullanın. Üretimde mutlaka:
  - `.env` dosyasını .gitignore'a ekleyin.
  - Rate limiting, kimlik doğrulama ve dosya taraması uygulayın.
  - OpenAI anahtarınızı sunucuda güvenli şekilde saklayın ve istemciye asla koymayın.