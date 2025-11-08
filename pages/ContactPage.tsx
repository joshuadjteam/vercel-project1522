
import React from 'react';
import Clock from '../components/Clock';

const ContactPage: React.FC = () => {
    return (
        <div className="w-full max-w-lg bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-teal-600/50 rounded-2xl shadow-2xl p-8 text-light-text dark:text-white">
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
        </div>
    );
};

export default ContactPage;