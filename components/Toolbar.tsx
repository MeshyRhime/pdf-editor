
import React from 'react';
import { Tool } from '../types';
import { MousePointer, Type, Check, Download, Loader2 } from 'lucide-react';

interface ToolbarProps {
    selectedTool: Tool;
    setSelectedTool: (tool: Tool) => void;
    textSize: number;
    setTextSize: (size: number) => void;
    handleDownload: () => void;
    isProcessing: boolean;
}

const ToolButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        title={label}
        className={`p-2 rounded-md flex items-center gap-2 transition-colors duration-200 ${
            isActive ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
        }`}
    >
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
);

export const Toolbar: React.FC<ToolbarProps> = ({
    selectedTool,
    setSelectedTool,
    textSize,
    setTextSize,
    handleDownload,
    isProcessing
}) => {
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1">
                <ToolButton
                    label="Select"
                    icon={<MousePointer className="w-5 h-5" />}
                    isActive={selectedTool === Tool.Select}
                    onClick={() => setSelectedTool(Tool.Select)}
                />
                <ToolButton
                    label="Text"
                    icon={<Type className="w-5 h-5" />}
                    isActive={selectedTool === Tool.Text}
                    onClick={() => setSelectedTool(Tool.Text)}
                />
                <ToolButton
                    label="Checkmark"
                    icon={<Check className="w-5 h-5" />}
                    isActive={selectedTool === Tool.Checkmark}
                    onClick={() => setSelectedTool(Tool.Checkmark)}
                />
            </div>
            {selectedTool === Tool.Text && (
                 <div className="flex items-center gap-2">
                    <label htmlFor="font-size" className="text-sm font-medium text-gray-700">Size:</label>
                    <select
                        id="font-size"
                        value={textSize}
                        onChange={(e) => setTextSize(Number(e.target.value))}
                        className="block w-20 pl-3 pr-2 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option>8</option>
                        <option>10</option>
                        <option>12</option>
                        <option>14</option>
                        <option>16</option>
                        <option>18</option>
                        <option>24</option>
                        <option>32</option>
                    </select>
                </div>
            )}
            <button
                onClick={handleDownload}
                disabled={isProcessing}
                className="ml-4 px-4 py-2 flex items-center gap-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Download className="w-5 h-5" />
                        Download
                    </>
                )}
            </button>
        </div>
    );
};
