# 🌿 Tattvam - Smart Nutritional Analysis App

![Tattvam Banner](https://placehold.co/800x200/00C897/white?text=Tattvam+-+AI+Powered+Food+Scanner)

Tattvam is an intelligent, AI-powered food scanning mobile application built to help users make healthier dietary choices. By simply scanning a product's barcode, Tattvam analyzes ingredients, calculates Nutri-Scores, and uncovers hidden harmful chemicals using the power of Gemini AI and the Open Food Facts API.

## ✨ Key Features

* 📱 Instant Barcode Scanning: Scan any packaged food item to get a detailed nutritional breakdown instantly.
* 🤖 AI Fallback Mechanism: If a product lacks a Nutri-Score in the global database, our integrated Gemini AI steps in to analyze the raw ingredients, identify harmful components (like Palm Oil, MSG, high sugar), and generate a highly accurate, estimated Nutri-Score.
* 🩺 Health Profile & Alerts: Set personalized dietary preferences (Vegan, Keto, etc.) and specific allergies. The app actively warns you if a scanned product contains your allergens.
* 💬 Chat with Tattvam AI: Have a specific question about a scanned product? Ask the integrated AI health assistant for scientific, no-nonsense advice.
* 🔥 Trending & Alternatives: Discover globally trending healthy products and get smart, healthier alternative suggestions for poorly rated junk food.

## 🛠️ Tech Stack

Frontend (Mobile App)
* React Native & Expo
* Expo Camera (for Barcode Scanning)
* AsyncStorage (for local caching & preferences)

Backend (API Server)
* Node.js & Express.js
* MongoDB & Mongoose
* Google Gemini AI (gemini-2.5-flash)
* Open Food Facts API

## 🚀 How to Run Locally

### 1. Clone the repository
git clone [https://github.com/Prajwal-Dhande/tattvam-app.git](https://github.com/Prajwal-Dhande/tattvam-app.git)
cd tattvam-app

### 2. Setup the Backend
cd backend
npm install

Create a .env file in the backend folder and add your keys:
PORT=5000
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
JWT_SECRET=your_secret_key

Start the backend server:
npm start

### 3. Setup the Frontend (Mobile App)
Open a new terminal window:
cd tattvam-mobile
npm install

Update the API base URL in the frontend code to match your local backend IP or tunneling service (like ngrok). Then, start the Expo development server:
npx expo start -c

Scan the QR code with the Expo Go app on your physical device.

---
Designed & Developed with ❤️ by Prajwal Dhande
