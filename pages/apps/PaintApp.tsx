
import React, { useRef, useEffect, useState } from 'react';
import AppContainer from '../../components/AppContainer';

const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const PaintApp: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#ffffff');
    const [brushSize, setBrushSize] = useState(5);

    const getContext = () => canvasRef.current?.getContext('2d');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        // Set canvas dimensions based on its container
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
        const context = getContext();
        if (context) {
            context.fillStyle = '#2d3748'; // dark-card color
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
    }, []);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const context = getContext();
        if (context) {
            context.beginPath();
            context.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
            setIsDrawing(true);
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const context = getContext();
        if (context) {
            context.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
            context.strokeStyle = color;
            context.lineWidth = brushSize;
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.stroke();
        }
    };

    const stopDrawing = () => {
        const context = getContext();
        if (context) {
            context.closePath();
            setIsDrawing(false);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = getContext();
        if (canvas && context) {
            context.fillStyle = '#2d3748';
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
    };

    return (
        <AppContainer className="w-full h-full p-4 text-light-text dark:text-white flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-4 flex-shrink-0">Paint</h1>
            <div className="w-full flex-grow relative rounded-lg overflow-hidden border-2 border-gray-400 dark:border-teal-700">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="absolute top-0 left-0"
                />
            </div>
            <div className="w-full flex items-center justify-center space-x-6 p-4 bg-black/5 dark:bg-black/20 rounded-b-lg flex-shrink-0">
                <div className="flex flex-col items-center">
                    <label htmlFor="color-picker" className="text-sm font-medium mb-1">Color</label>
                    <input id="color-picker" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-12 rounded-full cursor-pointer bg-transparent border-none p-0" />
                </div>
                <div className="flex flex-col items-center w-48">
                    <label htmlFor="brush-size" className="text-sm font-medium mb-1">Brush Size: {brushSize}</label>
                    <input id="brush-size" type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full" />
                </div>
                <button onClick={clearCanvas} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors flex items-center space-x-2">
                    <TrashIcon />
                    <span>Clear</span>
                </button>
            </div>
        </AppContainer>
    );
};

export default PaintApp;
