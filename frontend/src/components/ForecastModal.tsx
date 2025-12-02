import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface ForecastModalProps {
    isOpen: boolean;
    onClose: () => void;
    forecast: string;
    regionName: string;
    loading: boolean;
    error?: string;
}

export const ForecastModal: React.FC<ForecastModalProps> = ({
    isOpen,
    onClose,
    forecast,
    regionName,
    loading,
    error
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden bg-white rounded-3xl shadow-2xl">
                {/* Header with Gradient Border */}
                <div className="relative p-6 border-b border-slate-200 bg-gradient-to-r from-[#4285F4]/10 via-[#9B72F2]/10 to-[#F538A0]/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-r from-[#4285F4] via-[#9B72F2] to-[#F538A0]">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">AI Weather Forecast</h2>
                                <p className="text-sm text-slate-500">{regionName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 transition-colors rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
                                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent rounded-full animate-spin border-t-[#4285F4] border-r-[#9B72F2]"></div>
                            </div>
                            <p className="mt-4 text-sm font-medium text-slate-500">Generating forecast with Gemini AI...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                    ) : (
                        <div className="prose prose-sm max-w-none">
                            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                                {forecast}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Powered by Google Gemini</span>
                        <span>{new Date().toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
