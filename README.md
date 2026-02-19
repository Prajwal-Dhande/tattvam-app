# 🍏 Tattvam - Smart Nutritional Analysis App

[![Live Demo](https://img.shields.io/badge/Live_Demo-View_App-success?style=for-the-badge)](https://tattvam-app.vercel.app/)
[![Frontend Deployment](https://img.shields.io/badge/Frontend-Vercel-black?style=for-the-badge&logo=vercel)](https://tattvam-app.vercel.app/)
[![Backend Deployment](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](#)

## 📌 Overview
Tattvam is a full-stack web application designed to help users make healthier food choices. By simply scanning a product's barcode, the system instantly fetches and analyzes its nutritional data, providing a comprehensive health grade and breakdown.

Built with a focus on seamless user experience, fast API responses, and clean system architecture.

## 🚀 Live Application
**Check out the live app here:** [tattvam-app.vercel.app](https://tattvam-app.vercel.app/)

## ✨ Key Features
* **Real-Time Barcode Scanning:** Quickly identifies products using integrated scanning modules.
* **Instant Nutritional Grading:** Processes complex food data to generate an easy-to-understand health grade.
* **Full-Stack Architecture:** Decoupled frontend and backend for maximum scalability and performance.
* **Responsive UI:** Modern, mobile-first design ensuring a smooth experience across all devices.

## 💻 Tech Stack
* **Frontend:** React.js / Next.js, Tailwind CSS (Clean, responsive UI)
* **Backend:** Node.js, Express.js (RESTful API architecture)
* **Database:** MongoDB (Fast data retrieval)
* **Deployment:** Vercel (Frontend UI) & Render (Backend Server)

## 🧠 System Architecture (How it works)
1. **Client Request:** The user scans a barcode via the frontend.
2. **API Layer:** The frontend sends a secure request to the Render backend.
3. **Data Processing:** The backend queries the database to fetch raw product data.
4. **Grading Algorithm:** The system evaluates macros (sugar, fat, protein) and assigns a health grade.
5. **Response:** The processed data is sent back and rendered dynamically on the UI.

## 🛠️ Local Installation & Setup
Want to run this project locally? Run these commands in your terminal:

git clone https://github.com/Prajwal-Dhande/tattvam-app.git
cd tattvam-app/frontend
npm install
cd ../backend
npm install
npm run dev

Note: Ensure you have a .env file in your backend folder with your database URI before running the app.

---
*Built by [Prajwal Dhande](https://github.com/Prajwal-Dhande)*
