import React, { useMemo } from 'react';
import { X, Sparkles, Thermometer, CloudRain, Cloud, AlertTriangle, MapPin, Clock } from 'lucide-react';

interface ForecastModalProps {
    isOpen: boolean;
    onClose: () => void;
    forecast: string;
    regionName: string;
    loading: boolean;
    error?: string;
}

// Parse markdown-style text into formatted sections
const parseMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentSection: string[] = [];
    let currentTitle = '';
    let sectionIndex = 0;

    const flushSection = () => {
        if (currentTitle || currentSection.length > 0) {
            elements.push(
                <div key={sectionIndex++} className="mb-4">
                    {currentTitle && (
                        <h4 className="font-semibold text-slate-700 mb-2">{currentTitle}</h4>
                    )}
                    {currentSection.map((line, i) => (
                        <p key={i} className="text-slate-600 text-sm leading-relaxed">{line}</p>
                    ))}
                </div>
            );
            currentSection = [];
            currentTitle = '';
        }
    };

    lines.forEach((line) => {
        // Clean up markdown syntax
        let cleanLine = line
            .replace(/^\*\*(\d+\..*?):\*\*$/g, '$1:') // **1. Title:** -> 1. Title:
            .replace(/\*\*([^*]+)\*\*/g, '$1') // **text** -> text
            .replace(/^\*\s+/g, '• ') // * item -> • item
            .replace(/^-\s+/g, '• ') // - item -> • item
            .trim();

        // Check if this is a section header (numbered item ending with colon)
        if (/^\d+\.\s+.+:$/.test(cleanLine)) {
            flushSection();
            currentTitle = cleanLine;
        } else if (cleanLine) {
            currentSection.push(cleanLine);
        }
    });

    flushSection();
    return elements;
};

// Get weather icon based on content
const getWeatherCondition = (forecast: string): { icon: string; gradient: string } => {
    const lowerForecast = forecast.toLowerCase();
    if (lowerForecast.includes('thunderstorm') || lowerForecast.includes('storm')) {
        return { icon: '⛈️', gradient: 'from-slate-600 to-slate-800' };
    }
    if (lowerForecast.includes('heavy rain')) {
        return { icon: '🌧️', gradient: 'from-blue-500 to-blue-700' };
    }
    if (lowerForecast.includes('rain') || lowerForecast.includes('shower')) {
        return { icon: '🌦️', gradient: 'from-blue-400 to-indigo-500' };
    }
    if (lowerForecast.includes('cloudy') || lowerForecast.includes('overcast')) {
        return { icon: '☁️', gradient: 'from-slate-400 to-slate-500' };
    }
    if (lowerForecast.includes('partly cloudy')) {
        return { icon: '⛅', gradient: 'from-blue-400 to-amber-400' };
    }
    if (lowerForecast.includes('sunny') || lowerForecast.includes('clear')) {
        return { icon: '☀️', gradient: 'from-amber-400 to-orange-500' };
    }
    return { icon: '🌤️', gradient: 'from-sky-400 to-blue-500' };
};

// Extract key metrics from forecast
const extractMetrics = (forecast: string) => {
    const tempMatch = forecast.match(/(\d+)[°]?C?\s*[-–to]+\s*(\d+)[°]?C/i) || 
                      forecast.match(/minimum[:\s]*(\d+)[°]?C/i);
    const rainMatch = forecast.match(/(\d+)[-–]?(\d+)?\s*mm/i);
    const probMatch = forecast.match(/(\d+)\s*%/i);

    let tempMin = '', tempMax = '';
    if (tempMatch) {
        if (tempMatch[2]) {
            tempMin = tempMatch[1];
            tempMax = tempMatch[2];
        } else {
            tempMin = tempMatch[1];
        }
    }

    // Try to find max temp separately
    const maxTempMatch = forecast.match(/maximum[:\s]*(\d+)[°]?C/i);
    if (maxTempMatch) {
        tempMax = maxTempMatch[1];
    }

    return {
        tempMin,
        tempMax,
        rainfall: rainMatch ? (rainMatch[2] ? `${rainMatch[1]}-${rainMatch[2]}` : rainMatch[1]) : null,
        probability: probMatch ? probMatch[1] : null
    };
};

export const ForecastModal: React.FC<ForecastModalProps> = ({
    isOpen,
    onClose,
    forecast,
    regionName,
    loading,
    error
}) => {
    const weatherCondition = useMemo(() => getWeatherCondition(forecast), [forecast]);
    const metrics = useMemo(() => extractMetrics(forecast), [forecast]);
    const parsedContent = useMemo(() => parseMarkdown(forecast), [forecast]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-white rounded-3xl shadow-2xl transform transition-all">
                
                {/* Hero Header with Weather Gradient */}
                <div className={`relative p-8 bg-gradient-to-br ${weatherCondition.gradient} overflow-hidden`}>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                    
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Header Content */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                            <Sparkles className="w-4 h-4" />
                            <span className="font-medium">AI Weather Forecast</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-1">{regionName}</h2>
                                <div className="flex items-center gap-4 text-white/80 text-sm">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        Next 24 Hours
                                    </span>
                                </div>
                            </div>
                            <div className="text-7xl drop-shadow-lg">
                                {weatherCondition.icon}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Cards */}
                {!loading && !error && (metrics.tempMin || metrics.rainfall) && (
                    <div className="px-6 -mt-6 relative z-20">
                        <div className="grid grid-cols-3 gap-3">
                            {/* Temperature Card */}
                            {metrics.tempMin && (
                                <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                                    <div className="flex items-center gap-2 text-orange-500 mb-2">
                                        <Thermometer className="w-4 h-4" />
                                        <span className="text-xs font-semibold uppercase tracking-wide">Temp</span>
                                    </div>
                                    <div className="text-2xl font-bold text-slate-800">
                                        {metrics.tempMin}°
                                        {metrics.tempMax && <span className="text-slate-400"> - {metrics.tempMax}°</span>}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">Celsius</div>
                                </div>
                            )}

                            {/* Rainfall Card */}
                            {metrics.rainfall && (
                                <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                                    <div className="flex items-center gap-2 text-blue-500 mb-2">
                                        <CloudRain className="w-4 h-4" />
                                        <span className="text-xs font-semibold uppercase tracking-wide">Rain</span>
                                    </div>
                                    <div className="text-2xl font-bold text-slate-800">
                                        {metrics.rainfall}
                                        <span className="text-lg text-slate-400 ml-1">mm</span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">Expected</div>
                                </div>
                            )}

                            {/* Probability Card */}
                            {metrics.probability && (
                                <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                                    <div className="flex items-center gap-2 text-indigo-500 mb-2">
                                        <Cloud className="w-4 h-4" />
                                        <span className="text-xs font-semibold uppercase tracking-wide">Chance</span>
                                    </div>
                                    <div className="text-2xl font-bold text-slate-800">
                                        {metrics.probability}
                                        <span className="text-lg text-slate-400">%</span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">Probability</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[45vh]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 animate-pulse" />
                                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                                    <div className="text-4xl animate-bounce">🌤️</div>
                                </div>
                            </div>
                            <p className="mt-6 text-slate-600 font-medium">Analyzing weather patterns...</p>
                            <p className="text-sm text-slate-400 mt-1">Powered by Google Gemini AI</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 rounded-2xl bg-red-50 border border-red-200">
                            <div className="flex items-center gap-3 text-red-600 mb-2">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="font-semibold">Unable to Generate Forecast</span>
                            </div>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Detailed Forecast */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                                    Detailed Forecast
                                </h3>
                                <div className="space-y-3">
                                    {parsedContent}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                            <div className="w-5 h-5 rounded bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                                <Sparkles className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-xs font-medium">Powered by Google Gemini</span>
                        </div>
                        <span className="text-xs text-slate-400">
                            {new Date().toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
