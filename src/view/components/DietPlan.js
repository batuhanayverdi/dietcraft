import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './DietPlan.css';
import backImage from './back.png';
import jsPDF from 'jspdf';
import api from '../../services/api';
import 'jspdf-autotable';
import emailService from '../../email';  // Adjust path as needed
import { auth, db } from '../../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

const DietPlan = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { dietPlan, originalPlan, userInputs, personalizedTips: initialTips } = location.state || {};
    const [personalizedTips, setPersonalizedTips] = useState(initialTips || []);
    const [updatedPlan, setUpdatedPlan] = useState(dietPlan);
    const [referencePlan, setReferencePlan] = useState(originalPlan);
    const [feedbackList, setFeedbackList] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [currentPlanId, setCurrentPlanId] = useState(null);
    const [isEmailSending, setIsEmailSending] = useState(false);
    const [messageStatus, setMessageStatus] = useState({ show: false, type: '', message: '' });

    // Verify authentication on component mount
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) {
                console.log("No user logged in");
                navigate('/login');
                return;
            }
            console.log("Authenticated user:", user.uid);
        });

        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (!dietPlan || !initialTips) {
            console.error("DietPlan or PersonalizedTips is missing:", { dietPlan, initialTips });
            navigate('/');
        }
    }, [dietPlan, initialTips, navigate]);


    const mergePlans = (oldPlan, newPlan) => {
        const oldLines = oldPlan.split("\n");
        const newLines = newPlan.split("\n");
    
        const updatedLines = oldLines.map((line) => {
            const [oldDay, oldMeal] = line.split("|").map((item) => item.trim());
            const newLine = newLines.find((updated) => {
                const [newDay, newMeal] = updated.split("|").map((item) => item.trim());
                return oldDay === newDay && oldMeal === newMeal;
            });
            return newLine || line;
        });
    
        const additionalLines = newLines.filter((newLine) => {
            const [newDay, newMeal] = newLine.split("|").map((item) => item.trim());
            return !oldLines.some((oldLine) => {
                const [oldDay, oldMeal] = oldLine.split("|").map((item) => item.trim());
                return oldDay === newDay && oldMeal === newMeal;
            });
        });

        return [...updatedLines, ...additionalLines].join("\n");
    };
    
    const handleDislike = (mealType, day, details) => {
        const chatbotInput = document.querySelector('.chatbot-input');
        chatbotInput.value += `I don't like the ${mealType} on ${day}: "${details}". Please suggest an alternative.\n`;
        console.log(`Dislike Added: MealType=${mealType}, Day=${day}, Details=${details}`);
    };

    const saveDietPlanToFirebase = async (updatedDietPlan, chatEntry = null) => {
        try {
            if (!auth.currentUser) {
                alert('Please log in to save your diet plan');
                navigate('/login');
                return;
            }

            setIsSaving(true);
            const userId = auth.currentUser.uid;

            const dietPlanData = {
                userInputs: {
                    age: location.state.userInputs.age,
                    allergic: location.state.userInputs.allergy,
                    allergyType: location.state.userInputs.allergyType,
                    cuisines: location.state.userInputs.cuisine,
                    specificDiet: location.state.userInputs.specificDiet,
                    dietType: location.state.userInputs.dietType,
                    gender: location.state.userInputs.gender,
                    femaleCondition: location.state.userInputs.femaleCondition,
                    goal: location.state.userInputs.goal,
                    height: location.state.userInputs.height,
                    illnessMedicine: location.state.userInputs.illness,
                    illnessType: location.state.userInputs.illnessType,
                    weight: location.state.userInputs.weight,
                    tastePreferences: location.state.userInputs.tastePreferences
                },
                dietPlan: updatedDietPlan,
                personalizedTips: personalizedTips,
                lastUpdated: serverTimestamp()
            };

            if (chatEntry) {
                dietPlanData.chatHistory = [...chatHistory, chatEntry];
            }

            let planId;
            if (!currentPlanId) {
                // Create new document
                const dietPlanRef = collection(db, `users/${userId}/DietPlansUsers`);
                const newDoc = await addDoc(dietPlanRef, {
                    ...dietPlanData,
                    createdAt: serverTimestamp()
                });
                planId = newDoc.id;
                setCurrentPlanId(planId);
            } else {
                // Update existing document
                const planRef = doc(db, `users/${userId}/DietPlansUsers/${currentPlanId}`);
                await updateDoc(planRef, dietPlanData);
                planId = currentPlanId;
            }

            console.log('Diet plan saved successfully:', planId);
            return planId;

        } catch (error) {
            console.error('Error saving diet plan:', error);
            throw error;
        } finally {
            setIsSaving(false);
        }
    };

    const handleChatbotSubmit = async () => {
        const chatbotInput = document.querySelector('.chatbot-input');
        const userInput = chatbotInput.value.trim();
    
        if (!userInput) {
            alert('Please enter your preferences or disliked meals.');
            return;
        }
    
        try {
            setIsSaving(true);
            
            const bodyMessage = {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a diet planning assistant. When modifying meals:
                            1. Always return the COMPLETE 7-day plan
                            2. Format each line exactly as: "Day | Meal Type | Details"
                            3. Replace any instances of restricted ingredients with suitable alternatives
                            4. Maintain the nutrition value and meal balance
                            5. Keep meal structure: Breakfast, Morning Snack, Lunch, Afternoon Snack, Dinner for each day`
                    },
                    {
                        role: "user",
                        content: `
                            Modify this weekly diet plan according to the following request:
                            "${userInput}"
    
                            Current Diet Plan:
                            ${updatedPlan}
    
                            User Profile:
                            Gender: ${location.state.userInputs.gender} ${location.state.userInputs.gender === 'Female' ? `(${location.state.userInputs.femaleCondition})` : ''}
                            Height: ${location.state.userInputs.height} cm
                            Weight: ${location.state.userInputs.weight} kg
                            Age: ${location.state.userInputs.age} years old
                            Goal: ${location.state.userInputs.goal}
                            Diet Type: ${location.state.userInputs.specificDiet ? location.state.userInputs.dietType : 'None'}
                            Medical Conditions: ${location.state.userInputs.illness ? location.state.userInputs.illnessType : 'None'}
                            Cuisines: ${location.state.userInputs.cuisine.join(", ") || 'No preference'}
                            Allergies: ${location.state.userInputs.allergy ? location.state.userInputs.allergyType : 'None'}
                            Taste Preferences: ${location.state.userInputs.tastePreferences.join(", ") || 'No preference'}
    
                            Important:
                            1. Provide the complete modified plan
                            2. Follow the exact format: "Day | Meal Type | Details"
                            3. Include all meals for all days
                            4. Make sure the modifications align with the user's profile and restrictions
                        `
                    }
                ]
            };
    
            const response = await api.post('chat/completions', bodyMessage);
            const modifiedPlan = response.data.choices[0]?.message?.content;
    
            if (modifiedPlan) {
                // Validate the response format
                const planLines = modifiedPlan.split('\n').filter(line => line.trim());
                const isValidFormat = planLines.every(line => {
                    const parts = line.split('|');
                    return parts.length === 3 && parts[0].trim() && parts[1].trim() && parts[2].trim();
                });
    
                if (!isValidFormat) {
                    throw new Error('Invalid response format from AI');
                }
    
                // Update the plan
                setUpdatedPlan(modifiedPlan);
                
                // Update reference plan for comparison
                setReferencePlan(modifiedPlan);
    
                // Save to Firebase
                await saveDietPlanToFirebase(modifiedPlan);
    
                alert('Your diet plan has been updated successfully!');
                chatbotInput.value = '';
            }
        } catch (error) {
            console.error('Error updating diet plan:', error);
            alert('Failed to update diet plan. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };






    const combinedPlan = originalPlan.split("\n").map((line) => {
        const [day, meal, details] = line.split("|").map((item) => item?.trim() || '');
    
        if (!day || !meal || !details) {
            console.warn('Skipping invalid line:', { day, meal, details });
            return null; // Eksik satırları atla
        }
    
        // Gün ve öğün eşleşen bir updatedPlan varsa bunu kullan
        const updatedLine = updatedPlan.split("\n").find((updated) => {
            const [updatedDay, updatedMeal] = updated.split("|").map((item) => item?.trim() || '');
            return updatedDay === day && updatedMeal === meal;
        });
    
        if (updatedLine) {
            const [, , updatedDetails] = updatedLine.split("|").map((item) => item?.trim() || '');
            return { day, meal, details: updatedDetails };
        }
    
        return { day, meal, details }; // Güncellenmemişse originalPlan'deki veri
    }).filter(Boolean); // Null olanları filtrele
    
    console.log('Combined Plan:', combinedPlan);
    
    console.log('Meal Data:', combinedPlan); // combinedPlan tüm veriyi içeriyor

    // Veriyi tablo formatına dönüştürüp tabloyu oluşturuyoruz
    const tableData = combinedPlan.reduce((acc, { day, meal, details }) => {
        if (!acc[day]) acc[day] = { Day: day, Breakfast: '', "Morning Snack": '', Lunch: '', "Afternoon Snack": '', Dinner: '' };
    
        if (!meal) {
            console.warn('Meal is undefined or null:', { day, meal, details });
            return acc;
        }
        
        switch (meal.toLowerCase()) {
            case 'breakfast':
                acc[day].Breakfast = details;
                break;
            case 'morning snack':
                acc[day]["Morning Snack"] = details;
                break;
            case 'lunch':
                acc[day].Lunch = details;
                break;
            case 'afternoon snack':
                acc[day]["Afternoon Snack"] = details;
                break;
            case 'dinner':
                acc[day].Dinner = details;
                break;
            default:
                console.warn('Unknown Meal Type:', meal); // Bilinmeyen öğün türlerini logla
                break;
        }
        return acc;
    }, {});
    console.log('Table Data:', tableData);
    
    const tableRows = Object.values(tableData);
    console.log('Final Table Rows:', tableRows); // Tabloda gösterilecek satırları kontrol et
    

    
    
    
    const exportToPDF = (tableRows, personalizedTips) => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Weekly Diet Plan', 20, 10);

        const formattedTableRows = tableRows.map(({ Day, Breakfast, "Morning Snack": MSnack, Lunch, "Afternoon Snack": ASnack, Dinner }) => [
            Day, Breakfast, MSnack, Lunch, ASnack, Dinner
        ]);

        doc.autoTable({
            head: [['Day', 'Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner']],
            body: formattedTableRows,
            startY: 20
        });

        if (personalizedTips && personalizedTips.length > 0) {
            let currentY = doc.autoTable.previous.finalY + 10;
            doc.setFontSize(14);
            doc.text('Personalized Tips', 20, currentY);
            currentY += 10;

            doc.setFontSize(10);
            const tipsStartX = 20;
            const pageHeight = doc.internal.pageSize.height;
            const marginBottom = 10;

            personalizedTips.forEach((tip, index) => {
                const splitTip = doc.splitTextToSize(` ${index + 1}. ${tip}`, 170);
                if (currentY + splitTip.length * 6 > pageHeight - marginBottom) {
                    doc.addPage();
                    currentY = 10;
                }
                doc.text(splitTip, tipsStartX, currentY);
                currentY += splitTip.length * 6;
            });
        }

        doc.save('DietPlan.pdf');
    };

    const sendDietPlanByEmail = async () => {
        try {
            console.log('Starting email send process in component');
            
            if (!auth.currentUser) {
                console.error('No user authenticated');
                alert('Please log in to send the diet plan via email');
                return;
            }
    
            setIsEmailSending(true);
            setMessageStatus({ 
                show: true, 
                type: 'info', 
                message: 'Preparing to send diet plan...' 
            });
    
            console.log('Calling email service with:', {
                tableRowsCount: tableRows.length,
                tipsCount: personalizedTips.length
            });
    
            const result = await emailService.sendDietPlan(tableRows, personalizedTips);
            
            console.log('Email service result:', result);
    
            setMessageStatus({ 
                show: true, 
                type: 'success', 
                message: result.message 
            });
    
            setTimeout(() => {
                setMessageStatus({ show: false, type: '', message: '' });
            }, 5000);
    
        } catch (error) {
            console.error('Component email error:', error);
            setMessageStatus({ 
                show: true, 
                type: 'error', 
                message: `Failed to send email: ${error.message}. Please try again.` 
            });
        } finally {
            setIsEmailSending(false);
        }
    };
    return (
        <div className="diet-plan-container"
            style={{ backgroundImage: `url(${backImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
        >
            <nav className="navbar">
                <div className="nav-icon">⭐</div>
                <div className="nav-links">
                    <button onClick={() => navigate('/')}>Main Page</button>
                    <button onClick={() => navigate('/about')}>About</button>
                </div>
                <button className="welcome-button">Welcome {auth.currentUser?.displayName || 'User'}!</button>
            </nav>
    
            <h2>Your Suggested Weekly Diet Plan:</h2>
    
            <div className="action-buttons">
                <button 
                    className="download-button" 
                    onClick={() => exportToPDF(tableRows, personalizedTips)}
                >
                    Download as PDF
                </button>
                <button 
                    className="email-button"
                    onClick={sendDietPlanByEmail}
                    disabled={isEmailSending}
                >
                    {isEmailSending ? 'Opening Email...' : 'Send to Email 📧'}
                </button>
            </div>
    
            {messageStatus.show && (
                <div className={`status-message ${messageStatus.type}`}>
                    {messageStatus.message}
                </div>
            )}
    
            {/* Diet Plan Table */}
            <table className="diet-plan-table">
                <thead>
                    <tr>
                        <th>Day</th>
                        <th>Breakfast</th>
                        <th>Morning Snack</th>
                        <th>Lunch</th>
                        <th>Afternoon Snack</th>
                        <th>Dinner</th>
                    </tr>
                </thead>
                <tbody>
                    {tableRows.map((meal, index) => (
                        <tr key={index}>
                            <td>{meal.Day}</td>
                            <td>
                                {meal.Breakfast} 🍳
                                <button 
                                    className="dislike-button" 
                                    onClick={() => handleDislike('Breakfast', meal.Day, meal.Breakfast)}
                                >
                                    👎
                                </button>
                            </td>
                            <td>
                                {meal["Morning Snack"]} 🥪
                                <button 
                                    className="dislike-button" 
                                    onClick={() => handleDislike('Morning Snack', meal.Day, meal["Morning Snack"])}
                                >
                                    👎
                                </button>
                            </td>
                            <td>
                                {meal.Lunch} 🍜
                                <button 
                                    className="dislike-button" 
                                    onClick={() => handleDislike('Lunch', meal.Day, meal.Lunch)}
                                >
                                    👎
                                </button>
                            </td>
                            <td>
                                {meal["Afternoon Snack"]} 🥗
                                <button 
                                    className="dislike-button" 
                                    onClick={() => handleDislike('Afternoon Snack', meal.Day, meal["Afternoon Snack"])}
                                >
                                    👎
                                </button>
                            </td>
                            <td>
                                {meal.Dinner} 🍽️
                                <button 
                                    className="dislike-button" 
                                    onClick={() => handleDislike('Dinner', meal.Day, meal.Dinner)}
                                >
                                    👎
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
    
            {/* Single Personalized Tips Section */}
            <div className="tips-container">
                <h3>Personalized Tips</h3>
                <ul>
                    {personalizedTips.length > 0 ? (
                        personalizedTips.map((tip, index) => <li key={index}>{tip}</li>)
                    ) : (
                        <li>No specific tips available for your profile.</li>
                    )}
                </ul>
            </div>
    
            {/* Chatbot Input */}
            <div className="chatbot-container">
                <h3>Need to modify your diet plan?</h3>
                <textarea 
                    placeholder="Type your changes or preferences here..."
                    className="chatbot-input"
                    rows="4"
                ></textarea>
                <button 
                    className="chatbot-submit" 
                    onClick={handleChatbotSubmit}
                    disabled={isSaving}
                >
                    {isSaving ? 'Updating...' : 'Submit Changes'}
                </button>
            </div>
        </div>
    );
    
};

export default DietPlan;
