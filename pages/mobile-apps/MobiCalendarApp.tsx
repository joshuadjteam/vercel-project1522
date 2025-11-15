
import React, { useState } from 'react';

const ChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const ChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;

const MobiCalendarApp: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToToday = () => { const now = new Date(); setCurrentDate(now); setSelectedDate(now); };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const isSelected = (day: number) => {
        return day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
    };

    const renderCalendarDays = () => {
        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(
                <button
                    key={day}
                    onClick={() => setSelectedDate(new Date(year, month, day))}
                    className={`aspect-square flex items-center justify-center rounded-full transition-colors relative text-sm
                        ${isToday(day) && !isSelected(day) ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                        ${isSelected(day) ? 'bg-blue-500 text-white font-bold' : 'hover:bg-gray-100 dark:hover:bg-teal-700/20'}
                    `}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    return (
        <div className="w-full h-full text-light-text dark:text-white flex flex-col bg-white dark:bg-gray-800">
            <header className="p-4 flex justify-between items-center shadow-md bg-gray-50 dark:bg-gray-900">
                <div>
                    <h2 className="text-xl font-bold">{monthNames[month]} {year}</h2>
                    <button onClick={goToToday} className="text-xs text-blue-500 hover:underline">Go to Today</button>
                </div>
                <div className="flex space-x-2">
                    <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ChevronLeft /></button>
                    <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ChevronRight /></button>
                </div>
            </header>
            <div className="grid grid-cols-7 text-center py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                {dayNames.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 p-2 flex-grow content-start">
                {renderCalendarDays()}
            </div>
        </div>
    );
};

export default MobiCalendarApp;
