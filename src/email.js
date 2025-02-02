import emailjs from '@emailjs/browser';
import { auth } from './firebase';

// Initialize EmailJS
emailjs.init("MYgqw7IJCg1jseYZP");

const emailService = {
    sendDietPlan: async (dietPlanData, personalizedTips) => {
        try {
            // Check authentication
            if (!auth.currentUser?.email) {
                throw new Error('Please log in to send emails');
            }

            // Get current user's email
            const userEmail = auth.currentUser.email;
            const userName = auth.currentUser.displayName || userEmail.split('@')[0];

            console.log('Preparing to send email to:', userEmail); // Debug log

            // Template parameters
            const templateParams = {
                to_name: userName,
                to_email: userEmail, // This will override the template's default "To Email"
                from_name: "Diet Planning Assistant",
                reply_to: userEmail,
                diet_plan: dietPlanData.map(day => `
                    <div style="margin-bottom: 20px;">
                        <h3>${day.Day}</h3>
                        <ul>
                            <li>Breakfast: ${day.Breakfast}</li>
                            <li>Morning Snack: ${day["Morning Snack"]}</li>
                            <li>Lunch: ${day.Lunch}</li>
                            <li>Afternoon Snack: ${day["Afternoon Snack"]}</li>
                            <li>Dinner: ${day.Dinner}</li>
                        </ul>
                    </div>
                `).join(''),
                personalized_tips: personalizedTips.map((tip, index) => 
                    `<li>${tip}</li>`
                ).join('')
            };

            console.log('Sending email with parameters:', {
                service: 'service_vm66lem',
                template: 'template_si7kl6a',
                userEmail,
                userName
            });

            // Send email with dynamic recipient
            const response = await emailjs.send(
                'service_vm66lem',
                'template_si7kl6a',
                templateParams,
                'MYgqw7IJCg1jseYZP'
            );

            console.log('Email API Response:', response);

            return {
                success: true,
                message: `Diet plan sent successfully to ${userEmail}. Please check your inbox!`
            };

        } catch (error) {
            console.error('Email sending error:', error);
            throw new Error(`Failed to send email: ${error.message || 'Please try again'}`);
        }
    }
};

export default emailService;
