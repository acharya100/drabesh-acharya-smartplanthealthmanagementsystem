# Smart Plant Health Management System made by Drabesh Acharya 🌿

A sophisticated AI-powered platform designed to empower gardeners and farmers with instant plant identification and disease diagnosis. This project combines a robust Django backend with a modern, glassmorphic React frontend to provide a premium user experience.

## ✨ Key Features

- **AI Disease Detection**: Upload photos of plants to receive instant diagnosis and treatment recommendations powered by deep learning.
- **Plant Collection Management**: Track your personal garden with detailed care requirements (sunlight, water, temperature).
- **Data Isolation**: Multi-account support ensures your plant data and history are private and specific to your profile.
- **Flexible Login**: Authenticate using either your registered email address or your custom username.
- **Premium UI/UX**:
  - **Glassmorphism**: A modern, translucent design aesthetic.
  - **Dark Mode**: Fully functional and eye-friendly dark theme with persistent preference.
  - **Dynamic Greetings**: Personalized experience with real-time profile updates.
- **Comprehensive Database**: Seeded with a library of common plant diseases and expert treatments.

## 🛠️ Tech Stack

### Backend
- **Framework**: Django & Django REST Framework (DRF)
- **Database**: PostgreSQL (for robust relational data management)
- **AI/ML**: PyTorch & Torchvision (FastResNet-9 for inference)
- **Auth**: JWT (SimpleJWT) with custom dual-field authentication backends.

### Frontend
- **Framework**: React.js with Vite
- **Styling**: Vanilla CSS with a custom-built Design System
- **Icons**: Lucide React
- **API Client**: Axios with automatic token refresh interceptors

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL database

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/acharya100/drabesh-acharya-smartplanthealthmanagementsystem.git
   cd SmartPlantHealthManagementSystem
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   # Configure your .env file with DB_NAME, DB_USER, DB_PASSWORD, etc.
   python manage.py migrate
   python manage.py runserver
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## 📝 Usage

- **Diagnosis**: Go to the 'Detection' tab, upload an image, and let the AI analyze your plant's health.
- **My Plants**: Add plants manually to your collection and receive tailored care statistics on your Dashboard.
- **Settings**: Change your theme, update your profile info, or reset your password.

---

*Developed by Drabesh Acharya*
