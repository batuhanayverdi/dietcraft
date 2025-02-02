import React, { useState, useEffect } from 'react';
import './Card.css';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';


const Card = () => {
    const [gender, setGender] = useState('');
    const [femaleCondition, setFemaleCondition] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [age, setAge] = useState('');
    const [specificDiet, setSpecificDiet] = useState(false);
    const [dietType, setDietType] = useState('');
    const [illness, setIllness] = useState(false);
    const [illnessType, setIllnessType] = useState('');
    const [cuisine, setCuisine] = useState([]);
    const [allergy, setAllergy] = useState(false);
    const [allergyType, setAllergyType] = useState('');
    const [tastePreferences, setTastePreferences] = useState([]);
    const [goal, setGoal] = useState('');
    const [data, setData] = useState('');
    const navigate = useNavigate(); 
    const [dislikedMeals, setDislikedMeals] = useState([]);
    const [fridgeImage, setFridgeImage] = useState(null); // Yüklenen buzdolabı fotoğrafını tutar
    const [analysisResult, setAnalysisResult] = useState(''); // Fotoğraf analiz sonucunu tutar
    const [loading, setLoading] = useState(false); // Yükleme durumunu kontrol eder
    const [isFridgeAnalyzing, setIsFridgeAnalyzing] = useState(false);



    const handleFridgeUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFridgeImage(file);
            console.log("✅ Fridge image selected:", file.name);
            if (recognizedObjects.length > 0) {
                console.log("🔄 Keeping previous recognized objects.");
            }
        } else {
            console.log("⚠️ No file selected.");
        }
    };
    
    const [recognizedObjects, setRecognizedObjects] = useState([]); // recognizedObjects state'i


    // ✅ recognizedObjects state'i değiştikçe güncellendiğini görmek için log ekleyelim
    useEffect(() => {
        if (recognizedObjects.length > 0) {
            console.log("✅ Recognized Objects updated:", recognizedObjects);
        }
    }, [recognizedObjects]);
    
    const analyzeFridgeContents = async () => {
        if (!fridgeImage) {
            alert("Please upload a photo of your fridge contents first.");
            return;
        }
    
        setIsFridgeAnalyzing(true); // Yükleme başladığında buton metnini değiştir

        setLoading(true);
    
        const formData = new FormData();
        formData.append('image', fridgeImage);
    
        try {
            const response = await api.post('http://localhost:5000/api/analyze-fridge', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
    
            console.log("✅ Backend API Response:", response.data);
            console.log("✅ Full API Response:", JSON.stringify(response.data, null, 2));
            console.log("✅ Extracted Foods List:", response.data.foods);
            console.log("📌 Checking response structure:", response.data);
    
            if (response.data && Array.isArray(response.data.foods)) { 
                console.log("✅ Setting recognizedObjects...");
                setRecognizedObjects(response.data.foods);
            
                // React state'in güncellenmesini bekleyelim
                await new Promise(resolve => setTimeout(resolve, 1500));
            
                // State'in gerçekten güncellenip güncellenmediğini log ile kontrol edelim
                console.log("✅ Recognized Objects updated:", response.data.foods);
            }

        } catch (error) {
            console.error("❌ Backend API Request Failed:", error);
            alert("Error analyzing fridge contents. Check the backend logs.");
        } finally {
            if (recognizedObjects.length === 0) {
                console.warn("⚠️ Waiting before closing loading popup...");
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 saniye bekle
            }
            
            setLoading(false);
            setIsFridgeAnalyzing(false); // Yükleme tamamlandığında buton metnini geri değiştir
            console.log("✅ Loading popup closed.");
        }
    };
    
    
    const handleCuisineChange = (e) => {
        const value = e.target.value;
        setCuisine((prev) =>
            prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
        );
    };

    const handleDislike = (mealType, day, details) => {
        setDislikedMeals((prev) => [...prev, { mealType, day, details }]);
    };
    
    const handleTasteChange = (e) => {
        const value = e.target.value;
        setTastePreferences((prev) =>
            prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
        );
    };

    const sanitizeInput = (input) => {
        const bannedWords = ["ignore", "jailbreak", "bypass", "drop all", "delete"];
        
        // Return immediately if the input is empty or not a string
        if (!input || typeof input !== "string") {
            return "";
        }
    
        // Trim the input and convert it to lowercase for consistent comparison
        const sanitizedInput = input.trim().toLowerCase();
    
        // Check if the input contains any of the banned words
        const containsBannedWord = bannedWords.some((word) => 
            sanitizedInput.includes(word)
        );
    
        if (containsBannedWord) {
            return ""; // Clear the entire input if a banned word is found
        }
    
        return input.trim(); // Return the cleaned input
    };
    
    const postContent = async (e) => {
        e.preventDefault();
        if (isFridgeAnalyzing) {
            alert("Fridge analysis is still in progress. Please wait before creating your diet plan.");
            return;
        }
        setLoading(true); // Pop-up için loading durumu
        setData('Loading...');
        console.log("⏳ Starting process: Fridge analysis + Diet plan generation...");

        const bodyMessage = {
            "model": "gpt-3.5-turbo",
            "messages": [{
                "role": "user",
                "content": `
                    Create a highly detailed and personalized weekly diet plan for a person based on the following information:
                    Gender: ${gender} ${gender === 'Female' ? `and Condition: ${femaleCondition}` : ''}
                    Height: ${height} cm
                    Weight: ${weight} kg
                    Age: ${age} years old.
                    Goal: ${goal}
                    Specific Diet Plan: ${specificDiet ? dietType : 'None'}
                    Illness/Medicine: ${illness ? illnessType : 'None'}
                    Preferred Cuisines: ${cuisine.join(", ") || 'No preference'}
                    Allergy: ${allergy ? sanitizeInput(allergyType) : 'None'}
                    Taste Preferences: ${tastePreferences.join(", ") || 'No preference'}
                    ${recognizedObjects.length > 0 ? `Use the following available ingredients: ${recognizedObjects.join(", ")}` : ""}
                    Disliked Meals: ${
                        dislikedMeals.length > 0
                            ? dislikedMeals
                                .map((meal) => `${meal.day} | ${meal.mealType} | ${meal.details}`)
                                .join("\n")
                            : "None"
                    }
                    Important Notes:
                    - DO NOT include any ingredients or recipes containing the user's allergens (${sanitizeInput(allergyType)}). 
                    - Replace all instances of ${sanitizeInput(allergyType)} with safe alternatives. For example, if the user is allergic to apples, exclude meals like "apple pie," "apple cinnamon oatmeal," or "apple slices."
                    - Carefully review the recipes to ensure ${sanitizeInput(allergyType)} is not included in any form (raw, cooked, processed, or as a minor ingredient).
                    - If any allergen (${sanitizeInput(allergyType)}) is detected in the recipe, provide a clear replacement, such as replacing "apples" with "pears."
                    - Use the fridge items (${recognizedObjects.length > 0 ? recognizedObjects.join(", ") : 'None'}) as primary ingredients.
                    - Suggest replacements if the fridge items are insufficient for a full meal.

                    Format:
                    Each row of the table should follow this format: "Day | Meal | Details".
                    Example:
                    Monday | Breakfast | Oatmeal with almond milk and berries
                    Monday | Morning Snack | Cucumber slices with tzatziki sauce
                    Monday | Lunch | Grilled chicken with quinoa and salad
                    Monday | Afternoon Snack | Mixed nuts and dried fruit
                    Monday | Dinner | Grilled salmon with roasted vegetables and quinoa

                    Please ensure the following:
                    - The plan must strictly exclude any form of the allergen (${sanitizeInput(allergyType)}).
                    - Use "Morning Snack" for the first snack of the day.
                    - Use "Afternoon Snack" for the second snack of the day.
                `
            }],  

        };

        try {
            const response = await api.post('chat/completions', bodyMessage); // Yanıtı burada tanımlıyoruz
            if (!response.data || !response.data.choices) {
                console.error("Invalid API response structure:", response.data);
                alert("An unexpected error occurred. Please try again.");
                return;
            }


        const dietPlanResponse = await api.post('chat/completions', bodyMessage);

        console.log("✅ API Raw Response for Diet Plan:", response);
        
        if (!dietPlanResponse.data || !dietPlanResponse.data.choices) {
            console.error("❌ Invalid API response structure:", dietPlanResponse.data);
            alert("An unexpected error occurred. Please try again.");
            return;
        }
        
        const dietPlan = dietPlanResponse.data.choices[0]?.message?.content || null;
        
        if (!dietPlan) {
            console.error("⚠️ Diet Plan is empty or undefined:", dietPlanResponse.data);
            alert("Diet plan could not be generated. Please try again.");
            return;
        }
        
        console.log("🍽 Generated Diet Plan:", dietPlan);

        const tipsResponse = await api.post('chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [{
                role: "user",
                content: `
                    Based on the user's profile and available ingredients in the fridge, provide up to 10 personalized health and nutrition tips:
                    Gender: ${gender}
                    ${gender === 'Female' ? `Condition: ${femaleCondition || "None"}` : ""}
                    Height: ${height} cm
                    Weight: ${weight} kg
                    Age: ${age} years old
                    Goal: ${goal || "None"}
                    Specific Diet Plan: ${specificDiet ? dietType : "None"}
                    Illness/Medicine: ${illness ? illnessType : "None"}
                    Preferred Cuisines: ${cuisine.join(", ") || 'No preference'}
                    Allergy: ${allergy ? sanitizeInput(allergyType) : 'None'}
                    Taste Preferences: ${tastePreferences.join(", ") || 'No preference'}
                    ${recognizedObjects.length > 0 ? `Use the following available ingredients: ${recognizedObjects.join(", ")}` : ""}


                    Notes:
                    - Provide highly personalized and practical tips.
                    - Limit the total number of tips to 10.
                    - Provide like a sentence: "I noticed that you have ${recognizedObjects.join(", ") || 'no specific items detected'} in your fridge. Based on these ingredients, I have suggested meals that align with your dietary preferences. However, you may still need to buy additional ingredients such as essential spices, fresh vegetables, or protein sources to complete your meals".
                    - Include the daily recommended calorie intake and its breakdown as carbohydrates, protein, and fat.
                    - Include recommendations for daily intake of key vitamins (e.g., Vitamin D, Vitamin C, Iron) and minerals (e.g., Calcium, Magnesium) based on user profile.
                    - Provide suggestions for physical activities or lifestyle changes aligned with the user's goals (e.g., types of exercises or daily routines).
                    - Tailor recommendations to accommodate illnesses or medication impacts on diet.
                    - Include daily hydration recommendations based on weight, age, and activity level.
                `
            }]
        });

        console.log("📌 Recognized Objects before sending to Tips API:", recognizedObjects);
        console.log("✅ Tips API Raw Response:", tipsResponse);

        if (!tipsResponse.data || !tipsResponse.data.choices || !tipsResponse.data.choices[0].message) {
            console.error("❌ Invalid Tips API response:", tipsResponse.data);
            alert("Personalized tips could not be generated. Please try again.");
            return;
        }
        
        const personalizedTips = tipsResponse.data.choices[0]?.message?.content?.split("\n").filter((tip) => tip.trim() !== "") || [];
        
        console.log("💡 Generated Tips:", personalizedTips);
        
        setData(dietPlan);
        navigate('/diet-plan', { 
            state: { 
                dietPlan, 
                originalPlan: dietPlan, 
                userInputs: { gender, femaleCondition, height, weight, age, specificDiet, dietType, illness, illnessType, cuisine, allergy, allergyType, tastePreferences, goal, recognizedObjects },
                personalizedTips,
            } 
        });

    } catch (error) {
        console.error("Error creating diet plan:", error);
        alert("An error occurred while creating your diet plan. Please try again.");
    } finally {
        if (recognizedObjects.length === 0) {
            console.warn("⚠️ Waiting before closing loading popup...");
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 saniye bekle
        }
        
        if (recognizedObjects.length === 0) {
            console.warn("⚠️ Waiting before closing loading popup...");
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye bekle
        }
        
        setLoading(false);
        console.log("✅ Loading popup closed.");

    }
};

    return (
        <>
            {/* ✅ Navigasyon Barı */}
            <nav className="navbar">
                <div className="nav-icon">⭐</div>
                <div className="nav-links">
                    <button onClick={() => navigate('/home')}>Main Page</button>
                    <button onClick={() => navigate('/about')}>About</button>
                    <button onClick={() => navigate('/login')}>Welcome</button>
                </div>
            </nav>

            {/* ✅ Kart Alanı */}
            <div className="card-container">
                {/* Form Kutusu */}
                <div className="form-section">
                    <h1 className="card-title">Create Your Personalized Diet Plan!</h1>
                    <p><strong>To serve you best, we need some answers first ❤️</strong></p>

                    {/* I am a... */}
                    <label>I am a...</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="">Please select from list</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                    </select>

                    {gender === 'Female' && (
                        <>
                            <label>If female, specify condition</label>
                            <select value={femaleCondition} onChange={(e) => setFemaleCondition(e.target.value)}>
                                <option value="">Please select from list</option>
                                <option value="Pregnant">Pregnant</option>
                                <option value="Nursing">Nursing</option>
                                <option value="Neither">Neither</option>
                            </select>
                        </>
                    )}

                    {/* Physical Attributes */}
                    <label style={{ marginTop: '5px', display: 'block' }}>My Height:</label>
                    <input 
                        type="number" 
                        id="height" 
                        className="input-card" 
                        placeholder="e.g., 170" 
                        required 
                        onChange={(e) => setHeight(e.target.value)} 
                    />

                    <label style={{ marginTop: '10px', display: 'block' }}>My Weight:</label>
                    <input 
                        type="number" 
                        id="weight" 
                        className="input-card" 
                        placeholder="e.g., 70" 
                        required 
                        onChange={(e) => setWeight(e.target.value)} 
                    />

                    <label style={{ marginTop: '10px', display: 'block' }}>My Age:</label>
                    <input 
                        type="number" 
                        id="age" 
                        className="input-card" 
                        placeholder="e.g., 25" 
                        required 
                        onChange={(e) => setAge(e.target.value)} 
                    />

                    {/* Specific Diet Plan */}
                    <label style={{ marginTop: '10px', display: 'block' }}>Do you follow a specific diet plan?</label>
                    <div className="radio-group">
                        <label><input type="radio" name="diet" onChange={() => setSpecificDiet(true)} /> Yes</label>
                        <label><input type="radio" name="diet" onChange={() => setSpecificDiet(false)} /> No</label>
                    </div>

                    {specificDiet && (
                        <>
                            <label>If yes, specify diet type</label>
                            <select value={dietType} onChange={(e) => setDietType(e.target.value)}>
                                <option value="">Please select from list</option>
                                <option value="Vegetarian">Vegetarian</option>
                                <option value="Vegan">Vegan</option>
                                <option value="Keto">Keto</option>
                                <option value="Low-Carb">Low-Carb</option>
                                <option value="High-Protein">High-Protein</option>
                                <option value="Pescatarian">Pescatarian</option>                               
                            </select>
                        </>
                    )}


                    {/* Goal */}
                    <label>What is your goal?</label>
                    <select 
                        className="input-card"
                        required
                        onChange={(e) => setGoal(e.target.value)}
                    >
                        <option value="">Select</option>
                        <option value="Calorie Surplus">Calorie Surplus</option>
                        <option value="Calorie Deficit">Calorie Deficit</option>
                        <option value="Maintain Form">Maintain Form</option>
                        <option value="Build Muscle">Build Muscle</option>
                    </select>

                    {/* Illness or Medicine */}
                    <label>Any illness or medicine?</label>
                    <div className="radio-group">
                        <label><input type="radio" name="illness" onChange={() => setIllness(true)} /> Yes</label>
                        <label><input type="radio" name="illness" onChange={() => setIllness(false)} /> No</label>
                    </div>

                    {illness && (
                        <>
                            <label>If yes, specify illness type</label>
                            <select value={illnessType} onChange={(e) => setIllnessType(e.target.value)}>
                                <option value="">Please select from list</option>
                                <option value="Diabetes">Diabetes</option>
                                <option value="Hypertension">Hypertension</option>
                                <option value="Obesity">Obesity</option>
                                <option value="High Cholesterol">High Cholesterol</option>
                                <option value="Heart Disease">Heart Disease</option>
                                <option value="Epilepsy">Epilepsy</option>
                            </select>
                        </>
                    )}

                    {/* Cuisine Preferences */}
                    <label style={{ marginTop: '10px', display: 'block', marginBottom: '5px' }}>Which cuisine do you prefer?</label>
                    <div className="checkbox-group">
                        {["Italian", "Turkish", "Chinese", "Mexican", "French", "Indian", "Japanese", "Greek", "Thai", "Mediterranean","Spanish","Korean","Lebanese"].map((c) => (
                            <label key={c}>
                                <input
                                    type="checkbox"
                                    value={c}
                                    checked={cuisine.includes(c)}
                                    onChange={handleCuisineChange}
                                />
                                {c}
                            </label>
                        ))}
                    </div>

                    {/* Allergy Section */}
                    <label style={{ marginTop: '10px', display: 'block' }}>Are you allergic?</label>
                    <div className="radio-group">
                        <label><input type="radio" name="allergy" onChange={() => setAllergy(true)} /> Yes</label>
                        <label><input type="radio" name="allergy" onChange={() => setAllergy(false)} /> No</label>
                    </div>

                    {allergy && (
                        <input
                            type="text"
                            placeholder="If yes, please write"
                            value={allergyType}
                            onChange={(e) => setAllergyType(e.target.value)}
                        />
                    )}

                    {/* Taste Preferences */}
                    <label style={{ marginTop: '10px', display: 'block', marginBottom: '5px' }}>Your taste preferences</label>
                    <div className="checkbox-group">
                        {["Sweet", "Salty", "Sour"].map((t) => (
                            <label key={t}>
                                <input
                                    type="checkbox"
                                    value={t}
                                    checked={tastePreferences.includes(t)}
                                    onChange={handleTasteChange}
                                />
                                {t}
                        </label>
                    ))}
                </div>

                    {/* ✅ Diyet Planı Pop-up */}
                    {loading && !isFridgeAnalyzing && (
                        <div className="loading-popup">
                            <div className="loading-content">
                                <p>Preparing your personalized diet plan... Please wait!</p>
                            </div>
                        </div>
                    )}

                    {/* ✅ Buzdolabı Analizi Pop-up */}
                    {isFridgeAnalyzing && (
                        <div className="loading-popup">
                            <div className="loading-content">
                                <p>Analyzing Fridge... Please wait!</p>
                            </div>
                        </div>
                    )}

                    {/* ✅ Buzdolabı Yükleme Alanı */}
                    <div className="fridge-upload-section">
                        <h2 className="card-title">Upload Your Fridge Contents!</h2>
                        <p><strong>To help us better tailor your diet plan, upload a photo of your fridge contents.</strong></p>
                        
                        <label style={{ marginTop: '10px', display: 'block' }}>Upload a photo:</label>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleFridgeUpload(e)} 
                            className="file-input"
                        />
                        
                        {fridgeImage && (
                            <div className="image-preview">
                                <p>Uploaded Image Preview:</p>
                                <img src={URL.createObjectURL(fridgeImage)} alt="Fridge Preview" className="preview-image" />
                            </div>
                        )}

                        {/* ✅ Buzdolabındaki Malzemeler Göster */}
                        {recognizedObjects.length > 0 && (
                            <div className="fridge-items-list">
                                <h3>Items in Your Fridge:</h3>
                                <ul>
                                    {recognizedObjects.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {analysisResult && (
                            <div className="analysis-result">
                                <h3>Analysis Result:</h3>
                                <p>{analysisResult}</p>
                            </div>
                        )}
                    </div>

                    {/* ✅ Butonları düzenli hizala */}
                    <div className="button-container">
                        {/* Analyze Fridge Butonu (Sola Yaslanmış) */}
                        <div className="left-button">
                            <button 
                                className="card-button analyze-fridge" 
                                onClick={analyzeFridgeContents} 
                                onMouseEnter={(e) => (e.target.style.backgroundColor = 'white')}
                                onMouseLeave={(e) => (e.target.style.backgroundColor = '')}
                                disabled={isFridgeAnalyzing} 
                            >
                                {isFridgeAnalyzing ? "Analyzing..." : "Analyze fridge (optional)!"}
                            </button>
                        </div>

                        {/* Create My Dietary Plan Butonu (Sağa Yaslanmış) */}
                        <div className="right-button">
                            <button
                                className="card-button"
                                onClick={postContent}
                                onMouseEnter={(e) => (e.target.style.backgroundColor = 'white')}
                                onMouseLeave={(e) => (e.target.style.backgroundColor = '')}
                            >
                                Create my dietary plan!
                            </button>
                        </div>
                    </div>
                </div>

                {/* ✅ Resim Bölümü */}
                <div className="image-section">
                    <img src="/pexels-elletakesphotos-1660027 1.jpg" alt="Healthy Food" className="card-image" />
                </div>
            </div>




        </>
    );
};

export default Card;
