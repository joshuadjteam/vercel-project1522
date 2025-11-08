
import React from 'react';
import Clock from '../components/Clock';

const HomePage: React.FC = () => {
    return (
        <div className="w-full max-w-4xl flex flex-col items-center justify-center space-y-8">
            <div className="relative w-full max-w-xl">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">G</span>
                <input
                    type="text"
                    placeholder="Search with Google..."
                    className="w-full bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-light-text dark:text-white rounded-full py-3 pl-10 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors">
                    Search
                </button>
            </div>

            <div className="w-full bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-teal-600/50 rounded-2xl shadow-2xl p-8 text-center text-light-text dark:text-white">
                <h1 className="text-4xl font-bold mb-4">Welcome to Lynix by DJTeam!</h1>
                <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                    Welcome to Lynix, where innovation in technology and coding comes to life. Since our inception in January 2024, we've been dedicated to pushing the boundaries of web development. We launched our first suite of products in July 2024 and began sharing our journey on our YouTube channel '@DarCodR'. Today, our primary mission remains rooted in creating powerful coding solutions, while expanding our services to include reliable email support, crystal-clear SIP Voice communication, and more. Explore what we have to offer.
                </p>
                <div className="mt-8">
                    <Clock />
                </div>
            </div>
        </div>
    );
};

export default HomePage;