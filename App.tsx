
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useDropzone } from 'react-dropzone';
import { type AnyEdit, type TextEdit, Tool, type CheckmarkEdit } from './types';
import { Toolbar } from './components/Toolbar';
import { PdfViewer } from './components/PdfViewer';
import { UploadIcon, Loader2, Download, FileText } from 'lucide-react';

// pdfjs-dist is globally available from the script tag in index.html
const { pdfjsLib } = window as any;

const App: React.FC = () => {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [edits, setEdits] = useState<AnyEdit[]>([]);
    const [selectedTool, setSelectedTool] = useState<Tool>(Tool.Select);
    const [textSize, setTextSize] = useState<number>(12);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const loadPdf = useCallback(async (file: File) => {
        setIsLoading(true);
        setEdits([]);
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        setIsLoading(false);
    }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            if (file.type === 'application/pdf') {
                setPdfFile(file);
                loadPdf(file);
            } else {
                alert('Please upload a valid PDF file.');
            }
        }
    }, [loadPdf]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setPdfFile(file);
            loadPdf(file);
        }
    };
    
    const handleAddEdit = (x: number, y: number): string => {
        const newId = crypto.randomUUID();

        let adjustedX = x;
        let adjustedY = y;
        
        if (selectedTool === Tool.Text) {
            // Roughly center the first line of text vertically on the click point
            adjustedY = y - (textSize / 2);
        } else if (selectedTool === Tool.Checkmark) {
            const size = 20; // Default checkmark size
            // Center the checkmark on the click point
            adjustedX = x - (size / 2);
            adjustedY = y - (size / 2);
        }

        const newEdit: AnyEdit = {
            id: newId,
            page: currentPage,
            x: adjustedX,
            y: adjustedY,
            type: selectedTool,
            ...(selectedTool === Tool.Text && { content: '', fontSize: textSize, width: 100 }),
            ...(selectedTool === Tool.Checkmark && { size: 20 }),
        };
        setEdits(prevEdits => [...prevEdits, newEdit]);
        return newId;
    };

    const handleUpdateEdit = (id: string, newProps: Partial<AnyEdit>) => {
        setEdits(prevEdits =>
            prevEdits.map(edit => (edit.id === id ? { ...edit, ...newProps } : edit))
        );
    };

    const handleDeleteEdit = (id: string) => {
        setEdits(prevEdits => prevEdits.filter(edit => edit.id !== id));
    };

    const handleDownload = async () => {
        if (!pdfFile) return;
        setIsProcessing(true);
        try {
            const existingPdfBytes = await pdfFile.arrayBuffer();
            const pdfDocToEdit = await PDFDocument.load(existingPdfBytes);
            const helveticaFont = await pdfDocToEdit.embedFont(StandardFonts.Helvetica);
            const zapfDingbatsFont = await pdfDocToEdit.embedFont(StandardFonts.ZapfDingbats);
            
            const pages = pdfDocToEdit.getPages();
            
            for (const edit of edits) {
                const page = pages[edit.page - 1];
                if (!page) continue;
                
                const { height } = page.getSize();
                
                if (edit.type === Tool.Text) {
                    const textEdit = edit as TextEdit;
                    page.drawText(textEdit.content, {
                        x: textEdit.x,
                        y: height - textEdit.y - textEdit.fontSize,
                        font: helveticaFont,
                        size: textEdit.fontSize,
                        color: rgb(0, 0, 0),
                        maxWidth: textEdit.width,
                        lineHeight: textEdit.fontSize * 1.2,
                    });
                } else if (edit.type === Tool.Checkmark) {
                    const checkmarkEdit = edit as CheckmarkEdit;
                    const checkmarkSize = checkmarkEdit.size;
                    page.drawText('✓', {
                        x: checkmarkEdit.x,
                        y: height - checkmarkEdit.y - checkmarkSize,
                        font: zapfDingbatsFont,
                        size: checkmarkSize,
                        color: rgb(0, 0.5, 0),
                    });
                }
            }
            
            const pdfBytes = await pdfDocToEdit.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `edited_${pdfFile.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Failed to download PDF:', error);
            alert('An error occurred while preparing the download.');
        } finally {
            setIsProcessing(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true, noKeyboard: true, accept: {'application/pdf': ['.pdf']} });

    return (
        <div className="flex flex-col h-screen font-sans" {...getRootProps()}>
            <input {...getInputProps()} style={{ display: 'none' }} />
            <header className="bg-white shadow-md p-2 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <h1 className="text-xl font-bold text-gray-800">React PDF Editor</h1>
                </div>
                {pdfFile && <Toolbar
                    selectedTool={selectedTool}
                    setSelectedTool={setSelectedTool}
                    textSize={textSize}
                    setTextSize={setTextSize}
                    handleDownload={handleDownload}
                    isProcessing={isProcessing}
                />}
            </header>
            <main className="flex-1 flex flex-col items-center justify-center overflow-auto p-4 bg-slate-200">
                {isDragActive && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-50 flex items-center justify-center z-20 pointer-events-none">
                        <div className="text-white text-2xl font-bold">Drop PDF Here</div>
                    </div>
                )}
                {!pdfFile ? (
                     <div className="text-center p-8 border-2 border-dashed border-gray-400 rounded-lg bg-white shadow-lg w-full max-w-md">
                        <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Upload a PDF file</h3>
                        <p className="mt-1 text-sm text-gray-500">Drag and drop a file here, or click to select a file.</p>
                        <div className="mt-6">
                            <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                <span>Select file</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="application/pdf" />
                            </label>
                        </div>
                    </div>
                ) : isLoading ? (
                    <div className="flex items-center text-lg text-gray-700">
                        <Loader2 className="animate-spin mr-2 h-6 w-6" />
                        <span>Loading PDF...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center w-full h-full">
                        <PdfViewer
                            pdfDoc={pdfDoc}
                            pageNumber={currentPage}
                            edits={edits.filter(e => e.page === currentPage)}
                            onAddEdit={handleAddEdit}
                            onUpdateEdit={handleUpdateEdit}
                            onDeleteEdit={handleDeleteEdit}
                            selectedTool={selectedTool}
                        />
                         <div className="mt-4 p-2 bg-white rounded-lg shadow-md flex items-center justify-center gap-4">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage <= 1}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span>Page {currentPage} of {numPages}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                                disabled={currentPage >= numPages}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
