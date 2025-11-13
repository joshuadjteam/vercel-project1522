
import React from 'react';
import Clock from '../components/Clock';
import AppContainer from '../components/AppContainer';

const ContactPage: React.FC = () => {
    return (
        <AppContainer className="w-full max-w-lg p-8 text-light-text dark:text-white">
            <h1 className="text-4xl font-bold mb-4 text-center">Get in Touch</h1>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-8">We're here to help and answer any question you might have.</p>
            <div className="space-y-4 text-lg">
                <p><span className="font-bold">Email:</span> admin@lynixity.x10.bz</p>
                <p><span className="font-bold">Phone:</span> +1 (647) 247 - 4844</p>
                <p><span className="font-bold">TalkID:</span> 0470055990</p>
            </div>
            <div className="mt-8">
                <Clock />
            </div>
        </AppContainer>
    );
};

export default ContactPage;
