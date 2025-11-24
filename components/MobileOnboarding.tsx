
import React, { useState } from 'react';

const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-blue-500 mb-8" viewBox="0 0 24 24" fill="currentColor"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>;
const IdIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-purple-500 mb-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>;
const HelpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-green-500 mb-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>;

interface MobileOnboardingProps {
    onComplete: () => void;
}

const MobileOnboarding: React.FC<MobileOnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "Welcome to Lynix Mobile",
            description: "Experience a powerful, connected workspace right in your pocket. Lynix Mobile brings your essential apps and services together.",
            icon: <PhoneIcon />,
            buttonText: "Next"
        },
        {
            title: "Your Identity",
            description: "Your Lynix ID is your passport to the ecosystem. Use it to access your files, messages, and settings across all devices seamlessly.",
            icon: <IdIcon />,
            buttonText: "Next"
        },
        {
            title: "Need Assistance?",
            description: "Stuck? The 'Help' app is always there for you. Chat with our AI assistant or find answers to common questions instantly.",
            icon: <HelpIcon />,
            buttonText: "Get Started"
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 bg-[#121212] text-white z-[15000] flex flex-col animate-fade-in">
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
                <div className="animate-fade-in-up key={step}">
                    {steps[step].icon}
                </div>
                <h1 className="text-3xl font-bold mb-4 animate-fade-in-up">{steps[step].title}</h1>
                <p className="text-gray-400 text-lg leading-relaxed max-w-md animate-fade-in-up">
                    {steps[step].description}
                </p>
            </div>
            
            <div className="p-8 w-full">
                <div className="flex justify-center space-x-2 mb-8">
                    {steps.map((_, i) => (
                        <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-blue-500' : 'w-2 bg-gray-700'}`} />
                    ))}
                </div>
                <button 
                    onClick={handleNext}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl text-lg transition-colors shadow-lg"
                >
                    {steps[step].buttonText}
                </button>
            </div>
        </div>
    );
};

export default MobileOnboarding;
