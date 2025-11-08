
// This is a MOCK service. It does not actually call the Gemini API.
// It simulates the behavior for frontend development.

const cannedResponses: { [key: string]: string } = {
    "default": "I'm sorry, I can only provide pre-defined answers in this demo. How else can I assist you with topics like billing, account access, or feature usage?",
    "password": "To reset your password, please navigate to your Profile page and look for the 'Change Password' option. If you cannot log in, please contact support directly.",
    "billing": "You can view your billing information and history in the 'Billing' tab of your user Profile. For specific inquiries, please contact our support team via the Contact page.",
    "features": "Lynix offers a suite of applications including Phone, Chat, LocalMail, and more. You can access these from the 'Apps' menu in the header after signing in. Feature availability may depend on your account type.",
    "hello": "Hello there! I am the Lynix AI assistant. I can help with questions about your account, our features, or billing. What can I do for you?"
};

export const geminiService = {
    getHelpResponse: (prompt: string): Promise<string> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const lowerPrompt = prompt.toLowerCase();
                if (lowerPrompt.includes('password')) {
                    resolve(cannedResponses.password);
                } else if (lowerPrompt.includes('billing') || lowerPrompt.includes('payment')) {
                    resolve(cannedResponses.billing);
                } else if (lowerPrompt.includes('feature') || lowerPrompt.includes('app')) {
                    resolve(cannedResponses.features);
                } else if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
                    resolve(cannedResponses.hello);
                }
                else {
                    resolve(cannedResponses.default);
                }
            }, 1500);
        });
    }
};
