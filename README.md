# 🥗 AI-Powered Personalized Dietary Program Advisor

## 📌 Project Overview
This project is an AI-powered web application that generates **personalized weekly diet plans** based on user inputs, including:
- **Basic Information**: Age, weight, height, and gender.
- **Diet Preferences**: Specific diets (e.g., vegan, keto), favorite cuisines, taste preferences.
- **Health Conditions**: Allergies, illnesses, or dietary restrictions.
- **Fridge Content Analysis**: Users can upload a fridge image, and AI detects available ingredients to integrate them into the diet plan.

## 🚀 Features
✅ **Personalized Weekly Diet Plan Generation**  
✅ **Optional Fridge Content Analysis via Image Upload**  
✅ **AI-Generated Nutritional Tips Based on User Data**  
✅ **Chatbot for Additional Customization**  
✅ **Modern UI with Easy-to-Use Forms and Selections**  

---

## 🛠️ Tech Stack
- **Frontend**: React (with hooks & state management)  
- **Backend**: Node.js + Express.js  
- **AI Integration**: OpenAI GPT-4o (server-side) & GPT-3.5 (client-side for faster responses)  
- **Image Processing**: Base64 image upload & AI analysis  
- **Database**: Firebase (or any preferred database for future development)  

---

## 📥 Installation & Setup
To run this project locally, follow these steps:

### 1️⃣ **Clone the Repository**
```sh
git clone https://github.com/your-repo-name.git
cd your-repo-name

## Installation
Clone the repository:
```npm
git clone https://github.com/batuhanayverdi/dietcraft
```
2️⃣ Install Dependencies
npm install

3️⃣ Set Up Environment Variables
OPENAI_API_KEY=your_api_key_here

4️⃣ Start the Server
node server.js

5️⃣ Start the Frontend
npm start

📷 How It Works
1️⃣ User fills out the form with personal details, preferences, and dietary needs.
2️⃣ (Optional) User uploads a fridge image to analyze available ingredients.
3️⃣ AI processes the data and generates a detailed, personalized weekly meal plan.
4️⃣ User receives a diet plan with daily meal suggestions and nutrition tips.

🔧 Folder Structure
DIATING-IA-MASTER/
│── node_modules/          # Installed dependencies
│── public/                # Static assets
│── src/
│   ├── content/           # Content-related files
│   ├── services/          # API and backend service functions
│   ├── view/
│   │   ├── components/
│   │   │   ├── card/      # Card components for diet plan UI
│   │   │   │   ├── Card.js
│   │   │   │   ├── Card.css
│   │   │   ├── footer/    
│   │   │   ├── nav/
│   ├── App.js             # Main React App file
│   ├── index.js           # React entry point
│── .env                   # Environment variables
│── .gitignore             # Ignored files list
│── package.json           # Project metadata & dependencies
│── server.js              # Node.js backend server
│── README.md              # Documentation

💡 Future Improvements
🔹 User Authentication - Allow users to save and track their diet plans.
🔹 More AI Customization - Fine-tune meal plans based on detailed health data.
🔹 Nutritional Breakdown - Provide more in-depth calorie & macronutrient analysis.

📩 Contact
If you have any questions or feedback, feel free to reach out!
📧 Email: batuhanayverdi01@gmail.com & hnurtutuk@gmail.com
