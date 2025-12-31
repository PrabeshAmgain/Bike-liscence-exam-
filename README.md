# 🏍️ Nepal Driving License Pro Quiz

A world-class, AI-powered quiz application designed specifically for candidates preparing for the **Nepal Ministry of Physical Infrastructure and Transport** (Category A/K - Motorcycle/Scooter) written driving license exam.

## 🌟 Key Features

- **📄 Smart PDF Ingestion**: Upload the official Nepali driving license question bank PDF. The app uses `gemini-3-flash-preview` to intelligently extract 25 random questions while maintaining strict OCR accuracy.
- **🎨 AI-Powered Multimodal Visuals**: 
  - For questions involving traffic signs or road scenarios that contain images in the source PDF, the app identifies these visual requirements.
  - It then utilizes `gemini-2.5-flash-image` to generate high-fidelity, professional vector-style illustrations based on the descriptive context extracted from the PDF.
- **🚥 Standard Exam Format**: 25 Questions, 30 Minutes time limit, and a 75% passing threshold, mirroring the real exam conditions.
- **🇳🇵 Full Nepali Support**: Strictly maintains the original Nepali text and script for all questions and options to ensure exam-day familiarity.
- **⏱️ Professional Exam Interface**: Includes a real-time countdown timer, dynamic progress tracking, and an intuitive, mobile-responsive navigation system.
- **📊 Comprehensive Results & Review**: Detailed score breakdown with a dedicated "Review" mode to see correct vs. incorrect answers alongside official correct indices.

## 🛠️ Technical Architecture

### Frontend
- **Framework**: React 19 (ESM based)
- **Styling**: Tailwind CSS for a modern, high-performance UI.
- **State Management**: React Hooks (useState, useEffect, useCallback, useRef).
- **Icons**: Font Awesome 6 Pro.

### AI & SDKs
- **Core SDK**: `@google/genai`
- **Primary Model**: `gemini-3-flash-preview` (Used for PDF processing and structured JSON extraction).
- **Imaging Model**: `gemini-2.5-flash-image` (Used for recreating exam visuals).
- **Logic**: The app converts the uploaded PDF to Base64, sends it to Gemini for structured extraction, and conditionally triggers image generation for visual-heavy questions.

## 🚀 Getting Started

1. **Upload**: Drag and drop the official Category A/K Question Bank PDF (provided by the Department of Transport Management).
2. **Examination**: Answer the 25 multiple-choice questions. Use the "Next" and "Previous" buttons to navigate.
3. **Timer**: Keep an eye on the 30-minute countdown in the header.
4. **Analysis**: Upon completion, view your percentage and total correct count.
5. **Review**: Use the "Review Answers" button to audit your performance question-by-question.

## ⚙️ Environment Configuration

The application requires a valid Google Gemini API Key provided via the environment:
- `process.env.API_KEY`: Must be a valid API key with access to Gemini 3 and 2.5 series models.

## 🛡️ Privacy & Compliance

- **Data Processing**: PDF data is processed in-memory and sent to Google Gemini for analysis. No data is stored permanently on the client or server.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop viewing to support learning on the go.

---
*Created for the future riders of Nepal. Drive safe!*