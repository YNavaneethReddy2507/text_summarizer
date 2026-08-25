# DocuMind AI — AI Text Reader, Analyzer & Summarizer

> **Read Less. Understand More.**  
> An enterprise-grade AI Document Intelligence suite that ingests multi-format documents (PDF, DOCX, TXT, MD), performs deep NLP analysis (Graph Centrality, TF-IDF, Flesch-Kincaid Readability), generates multi-mode summaries, enables grounded RAG Q&A with citations, and synthesizes audio voice summaries using Text-to-Speech (TTS).

---

## 🚀 Key Features

- **Multi-Format Ingestion**: Supports `.pdf`, `.docx`, `.txt`, and `.md` with robust whitespace cleaning and character normalization.
- **Advanced Graph NLP Summarization**: Utilizes TextRank / LexRank sentence eigenvector centrality with 5 distinct summary modes:
  - *Quick Snapshot* (3–4 punchy sentences)
  - *Standard Mode* (~15–20% compression)
  - *In-Depth / Detailed* (~35% length preserving technical metrics)
  - *Key Bullets* (Scannable bullet takeaways)
  - *Executive Brief* (Background $\rightarrow$ Key Findings $\rightarrow$ Recommendations)
- **"Explain Simply" (ELI5)**: Simplifies dense technical and academic papers into plain layman English.
- **Statistical & Readability Analytics**: Real-time word counts, Flesch Reading Ease score, Flesch-Kincaid Grade Level, and dynamic **Time Saved** calculations.
- **Grounded RAG Q&A Assistant**: Ask any question about your document and receive answers strictly verified against source chunks with clickable citations.
- **Text-to-Speech (TTS) Voice Player**: Listen to summaries on the go with custom speed rates (0.8x to 1.5x), pitch controls, and natural neural voice selection.
- **Multi-Format Export**: One-click download of styled reports in **PDF**, **DOCX**, **Markdown**, or **Plain Text**.
- **100% Privacy & Local Option**: Runs entirely on local NLP graph algorithms by default, with optional support for Gemini, OpenAI, or Groq API keys.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti, Web Speech Synthesis API.
- **Backend**: FastAPI (Python 3.10+ / 3.13), Uvicorn, Pydantic v2, PyPDF, Python-docx, Scikit-Learn, NumPy, ReportLab.
- **Testing**: Pytest for backend unit and integration test suite.

---

## 💻 Prerequisites

Ensure you have the following installed on your laptop/machine:
1. **Python 3.10+** (Tested on Python 3.13): [Download Python](https://www.python.org/downloads/)
2. **Node.js 18+** (with npm): [Download Node.js](https://nodejs.org/)
3. **Git**: [Download Git](https://git-scm.com/)

---

## 🏃 Step-by-Step Setup & Run Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/YNavaneethReddy2507/text_summarizer.git
cd text_summarizer
```

---

### 2. Backend Setup (FastAPI)

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. (Optional but recommended) Create and activate a Python virtual environment:
   - **Windows**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   *The backend will be running at:* `http://localhost:8000`  
   *Interactive API documentation (Swagger UI):* `http://localhost:8000/docs`

---

### 3. Frontend Setup (React + Vite)

1. Open a **new / second terminal** window and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install the frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend dashboard will be running at:* `http://localhost:5173`

4. Open your browser and visit: **`http://localhost:5173`**

---

## 🧪 Running the Backend Test Suite

To verify all 11 backend test suites (document extraction, NLP statistics, summarization modes, RAG retrieval, and API endpoints):

```bash
cd backend
python -m pytest tests/ -v
```

---

## 📁 Project Structure

```text
text_summarizer/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints.py          # REST API routes (/analyze, /upload, /ask, /export, etc.)
│   │   ├── schemas/
│   │   │   └── document.py           # Pydantic data schemas & request/response models
│   │   ├── services/
│   │   │   ├── document_processor.py # PDF, DOCX, TXT extraction and cleanup
│   │   │   ├── nlp_engine.py         # Readability metrics, TF-IDF, and topic detection
│   │   │   ├── summarizer.py         # TextRank / LexRank graph summarizer engine
│   │   │   ├── rag_engine.py          # Chunking, vector similarity, and grounded Q&A
│   │   │   ├── history_service.py    # Local analysis persistence
│   │   │   └── export_service.py     # PDF (ReportLab), DOCX, MD, and TXT exporters
│   │   └── main.py                   # FastAPI application entrypoint & CORS
│   ├── tests/
│   │   └── test_backend.py           # 11 automated pytest test cases
│   └── requirements.txt              # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Header with theme toggle & status indicators
│   │   │   ├── HeroLanding.tsx        # Landing hero with benchmark sample buttons
│   │   │   ├── InputWorkspace.tsx     # Direct text & drag-and-drop file uploader
│   │   │   ├── DashboardResults.tsx   # Tabbed results (Summary, Points, Keywords, Heatmap, Q&A)
│   │   │   ├── StatsGrid.tsx          # Readability, time saved, and compression cards
│   │   │   ├── AudioPlayer.tsx        # Text-to-Speech (TTS) voice player
│   │   │   ├── HistoryModal.tsx       # Past analysis browser and reload
│   │   │   ├── ExplainabilityModal.tsx# Mathematical NLP architecture breakdown
│   │   │   ├── ApiKeyModal.tsx        # Optional LLM API key configurator
│   │   │   └── Footer.tsx             # App footer
│   │   ├── services/
│   │   │   └── api.ts                 # Backend REST API client
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript interfaces
│   │   ├── App.tsx                    # Main React application component
│   │   ├── index.css                  # Tailwind CSS styling & animations
│   │   └── main.tsx                   # Vite React root
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── sample_data/                       # Pre-generated academic, technical, and financial sample files
├── .gitignore                         # Git ignore configurations
└── README.md                          # Project documentation
```

---

## 📄 License
MIT License. Free for personal, academic, and commercial use.
