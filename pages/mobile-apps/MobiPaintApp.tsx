
import React, { useRef, useEffect, useState, useCallback } from 'react';

const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const MobiPaintApp: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDrawingRef = useRef(false);

    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5);

    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (canvas && container) {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            if (contextRef.current) {
                contextRef.current.lineCap = 'round';
                contextRef.current.strokeStyle = color;
                contextRef.current.lineWidth = brushSize;
            }
        }
    }, [color, brushSize]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        contextRef.current = context;
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [resizeCanvas]);
    
    useEffect(() => { if (contextRef.current) contextRef.current.strokeStyle = color; }, [color]);
    useEffect(() => { if (contextRef.current) contextRef.current.lineWidth = brushSize; }, [brushSize]);

    const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const touch = e.nativeEvent instanceof TouchEvent ? e.nativeEvent.touches[0] : e.nativeEvent as MouseEvent;
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    };

    const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!contextRef.current) return;
        const { x, y } = getPosition(e);
        contextRef.current.beginPath();
        contextRef.current.moveTo(x, y);
        isDrawingRef.current = true;
    }, []);

    const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawingRef.current || !contextRef.current) return;
        const { x, y } = getPosition(e);
        contextRef.current.lineTo(x, y);
        contextRef.current.stroke();
    }, []);
    
    const stopDrawing = useCallback(() => {
        if (!contextRef.current) return;
        contextRef.current.closePath();
        isDrawingRef.current = false;
    }, []);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (canvas && context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
    };
    
    return (
        <div className="w-full h-full flex flex-col bg-gray-100 dark:bg-gray-900">
            <div ref={containerRef} className="flex-grow w-full overflow-hidden">
                <canvas 
                    ref={canvasRef}
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                    className="cursor-crosshair"
                />
            </div>
            <div className="flex-shrink-0 w-full bg-white dark:bg-slate-800 p-2 border-t border-gray-300 dark:border-slate-700 shadow-lg">
                <div className="w-full flex items-center justify-around">
                    <div className="flex items-center space-x-2">
                        <input id="color-picker" type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-12 p-1 bg-transparent border-2 border-gray-300 dark:border-slate-600 rounded-md cursor-pointer" />
                    </div>
                    <div className="flex flex-col items-center space-y-1">
                         <label htmlFor="brush-size" className="text-xs font-medium text-light-text dark:text-dark-text">Size: {brushSize}</label>
                        <input id="brush-size" type="range" min="1" max="50" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} className="w-32" />
                    </div>
                    <button onClick={clearCanvas} className="p-3 text-red-500 bg-red-100 dark:bg-red-900/50 rounded-full">
                       <TrashIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobiPaintApp;
