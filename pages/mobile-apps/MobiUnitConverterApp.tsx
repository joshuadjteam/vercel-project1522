
import React, { useState, useEffect } from 'react';

type UnitCategory = 'length' | 'weight' | 'temperature';

const MobiUnitConverterApp: React.FC = () => {
    const [category, setCategory] = useState<UnitCategory>('length');
    const [fromUnit, setFromUnit] = useState('');
    const [toUnit, setToUnit] = useState('');
    const [fromValue, setFromValue] = useState<number | ''>('');
    const [toValue, setToValue] = useState<number | ''>('');

    const units: Record<UnitCategory, string[]> = {
        length: ['Meters', 'Kilometers', 'Inches', 'Feet', 'Miles'],
        weight: ['Kilograms', 'Grams', 'Pounds', 'Ounces'],
        temperature: ['Celsius', 'Fahrenheit', 'Kelvin'],
    };

    useEffect(() => {
        setFromUnit(units[category][0]);
        setToUnit(units[category][1] || units[category][0]);
        setFromValue(''); setToValue('');
    }, [category]);

    const convert = (value: number, from: string, to: string, type: UnitCategory): number => {
        if (from === to) return value;
        if (type === 'length') {
            let meters = value;
            if (from === 'Kilometers') meters = value * 1000; if (from === 'Inches') meters = value * 0.0254; if (from === 'Feet') meters = value * 0.3048; if (from === 'Miles') meters = value * 1609.34;
            if (to === 'Meters') return meters; if (to === 'Kilometers') return meters / 1000; if (to === 'Inches') return meters / 0.0254; if (to === 'Feet') return meters / 0.3048; if (to === 'Miles') return meters / 1609.34;
        }
        if (type === 'weight') {
             let grams = value;
             if (from === 'Kilograms') grams = value * 1000; if (from === 'Pounds') grams = value * 453.592; if (from === 'Ounces') grams = value * 28.3495;
             if (to === 'Grams') return grams; if (to === 'Kilograms') return grams / 1000; if (to === 'Pounds') return grams / 453.592; if (to === 'Ounces') return grams / 28.3495;
        }
        if (type === 'temperature') {
            if (from === 'Celsius') { if (to === 'Fahrenheit') return (value * 9/5) + 32; if (to === 'Kelvin') return value + 273.15; }
            if (from === 'Fahrenheit') { if (to === 'Celsius') return (value - 32) * 5/9; if (to === 'Kelvin') return (value - 32) * 5/9 + 273.15; }
            if (from === 'Kelvin') { if (to === 'Celsius') return value - 273.15; if (to === 'Fahrenheit') return (value - 273.15) * 9/5 + 32; }
        }
        return value;
    };

    const handleFromChange = (val: string) => {
        const num = parseFloat(val);
        if (isNaN(num)) { setFromValue(''); setToValue(''); return; }
        setFromValue(num);
        const result = convert(num, fromUnit, toUnit, category);
        setToValue(parseFloat(result.toFixed(4)));
    };

    const handleSwap = () => {
        const tempUnit = fromUnit;
        setFromUnit(toUnit);
        setToUnit(tempUnit);
        if (typeof toValue === 'number') {
             setFromValue(toValue);
             const result = convert(toValue, toUnit, tempUnit, category); 
             setToValue(parseFloat(result.toFixed(4)));
        }
    };

    return (
        <div className="w-full h-full flex flex-col justify-center p-6 bg-dark-bg text-light-text dark:text-white">
            <div className="w-full max-w-md mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-center">Unit Converter</h1>
                <div className="flex justify-center space-x-1 mb-8 bg-black/10 dark:bg-black/20 p-1 rounded-lg">
                    {(['length', 'weight', 'temperature'] as UnitCategory[]).map(cat => (
                        <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-2 text-sm rounded-md capitalize font-medium transition-colors ${category === cat ? 'bg-white dark:bg-teal-600 shadow-sm text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-300'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-lg font-medium opacity-70">From</label>
                        <input type="number" value={fromValue} onChange={e => handleFromChange(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700/50 border-2 border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-3xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0"/>
                        <select value={fromUnit} onChange={e => { setFromUnit(e.target.value); if (typeof fromValue === 'number') handleFromChange(fromValue.toString()); }} className="w-full bg-gray-100 dark:bg-slate-700/50 border-2 border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {units[category].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-center py-2"><button onClick={handleSwap} className="p-3 rounded-full bg-gray-200 dark:bg-slate-600 hover:bg-blue-500 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                    </button></div>
                    <div className="space-y-2">
                        <label className="text-lg font-medium opacity-70">To</label>
                        <input type="number" value={toValue} readOnly className="w-full bg-gray-200 dark:bg-slate-800/50 border-2 border-gray-300 dark:border-slate-700 rounded-lg px-4 py-3 text-3xl font-semibold focus:outline-none" placeholder="Result"/>
                        <select value={toUnit} onChange={e => { setToUnit(e.target.value); if (typeof fromValue === 'number') handleFromChange(fromValue.toString()); }} className="w-full bg-gray-100 dark:bg-slate-700/50 border-2 border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {units[category].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobiUnitConverterApp;
