// İstemci: PDF yükleyip /api/ask endpoint'ine gönderir.
// Demo modunda (sunucuda OPENAI_API_KEY yoksa) sunucu basit yerel cevap dönecektir.

class PDFQuestionAnswering {
  constructor() {
    this.selectedFile = null;
    this.initElements();
    this.attachListeners();
  }

  initElements() {
    this.pdfFileInput = document.getElementById('pdfFile');
    this.fileNameDiv = document.getElementById('fileName');
    this.questionInput = document.getElementById('questionInput');
    this.askButton = document.getElementById('askButton');
    this.buttonText = document.querySelector('.button-text');
    this.loadingSpinner = document.querySelector('.loading-spinner');
    this.answerSection = document.getElementById('answerSection');
    this.answerText = document.getElementById('answerText');
    this.errorSection = document.getElementById('errorSection');
    this.errorText = document.getElementById('errorText');
  }

  attachListeners() {
    this.pdfFileInput.addEventListener('change', e => this.handleFileSelect(e));
    this.askButton.addEventListener('click', () => this.askQuestion());
    this.questionInput.addEventListener('input', () => this.validateForm());
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type && file.type !== 'application/pdf') {
      this.showError('Lütfen sadece PDF dosyası seçin.');
      return;
    }
    this.selectedFile = file;
    this.fileNameDiv.textContent = `Seçilen dosya: ${file.name}`;
    this.fileNameDiv.classList.add('show');
    this.hideError();
    this.validateForm();
  }

  validateForm() {
    const hasQuestion = this.questionInput.value.trim().length > 0;
    const hasFile = !!this.selectedFile;
    this.askButton.disabled = !(hasQuestion && hasFile);
  }

  async askQuestion() {
    const question = this.questionInput.value.trim();
    if (!question || !this.selectedFile) {
      this.showError('Lütfen PDF yükleyin ve sorunuzu yazın.');
      return;
    }

    this.setLoading(true);
    this.hideError();
    this.hideAnswer();

    try {
      const form = new FormData();
      form.append('pdf', this.selectedFile);
      form.append('question', question);

      const res = await fetch('/api/ask', { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Sunucu hatası: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.answer) {
        this.showAnswer(data.answer + (data.mode === 'demo' ? '\n\n(Not: Bu cevap demo modunda üretilmiştir.)' : ''));
      } else {
        throw new Error(data.error || 'Cevap alınamadı.');
      }
    } catch (err) {
      console.error(err);
      this.showError(err.message || 'Cevap alınırken hata oluştu.');
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(isLoading) {
    if (isLoading) {
      if (this.buttonText) this.buttonText.style.display = 'none';
      if (this.loadingSpinner) this.loadingSpinner.style.display = 'block';
      this.askButton.disabled = true;
    } else {
      if (this.buttonText) this.buttonText.style.display = 'block';
      if (this.loadingSpinner) this.loadingSpinner.style.display = 'none';
      this.validateForm();
    }
  }

  showAnswer(text) {
    this.answerText.textContent = text;
    this.answerSection.style.display = 'block';
    this.answerSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  hideAnswer() {
    this.answerSection.style.display = 'none';
  }

  showError(msg) {
    this.errorText.textContent = msg;
    this.errorSection.style.display = 'block';
    this.errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  hideError() {
    this.errorSection.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => new PDFQuestionAnswering());