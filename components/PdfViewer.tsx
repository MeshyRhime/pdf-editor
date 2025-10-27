
import React, { useRef, useEffect, useState } from 'react';
import { type AnyEdit, type TextEdit, Tool, type CheckmarkEdit } from '../types';
import { X } from 'lucide-react';

interface PdfViewerProps {
    pdfDoc: any;
    pageNumber: number;
    edits: AnyEdit[];
    onAddEdit: (x: number, y: number) => string;
    onUpdateEdit: (id: string, newProps: Partial<AnyEdit>) => void;
    onDeleteEdit: (id: string) => void;
    selectedTool: Tool;
}

const EditableItem: React.FC<{
    edit: AnyEdit;
    scale: number;
    onUpdate: (id: string, newProps: Partial<AnyEdit>) => void;
    onDelete: (id: string) => void;
    isSelected: boolean;
    setSelectedItemId: (id: string | null) => void;
    selectedTool: Tool;
}> = ({ edit, scale, onUpdate, onDelete, isSelected, setSelectedItemId, selectedTool }) => {
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [dragState, setDragState] = useState<{
        type: 'move' | 'resize-left' | 'resize-right';
        startX: number;
        startY: number;
        initialX: number;
        initialY: number;
        initialWidth?: number;
    } | null>(null);

    useEffect(() => {
        if (!dragState) return;

        const handleMouseMove = (e: MouseEvent) => {
            const dx = (e.clientX - dragState.startX) / scale;
            const dy = (e.clientY - dragState.startY) / scale;

            if (dragState.type === 'move') {
                onUpdate(edit.id, { x: dragState.initialX + dx, y: dragState.initialY + dy });
            } else if (dragState.type === 'resize-right') {
                const newWidth = Math.max(20, (dragState.initialWidth || 0) + dx);
                onUpdate(edit.id, { width: newWidth });
            } else if (dragState.type === 'resize-left') {
                const newWidth = Math.max(20, (dragState.initialWidth || 0) - dx);
                const newX = dragState.initialX + dx;
                onUpdate(edit.id, { width: newWidth, x: newX });
            }
        };

        const handleMouseUp = () => {
            setDragState(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState, onUpdate, edit.id, scale]);

    useEffect(() => {
        if (isSelected && edit.type === Tool.Text && inputRef.current) {
            setIsEditing(true);
            inputRef.current.focus();
        } else {
            setIsEditing(false);
        }
    }, [isSelected, edit.type]);

    const handleBlur = () => {
        setIsEditing(false);
        if (edit.type === Tool.Text && edit.content.trim() === '') {
            onDelete(edit.id);
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedItemId(edit.id);
        if (selectedTool !== Tool.Select) return;
        setDragState({
            type: 'move',
            startX: e.clientX,
            startY: e.clientY,
            initialX: edit.x,
            initialY: edit.y,
        });
    };

    const handleResizeHandleMouseDown = (e: React.MouseEvent, type: 'resize-left' | 'resize-right') => {
        e.stopPropagation();
        if (edit.type !== Tool.Text) return;
        setDragState({
            type: type,
            startX: e.clientX,
            startY: e.clientY,
            initialX: edit.x,
            initialY: edit.y,
            initialWidth: (edit as TextEdit).width || 100
        });
    };
    
    const textEdit = edit as TextEdit;
    const baseStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${edit.x * scale}px`,
        top: `${edit.y * scale}px`,
        cursor: selectedTool === Tool.Select ? 'move' : 'pointer',
        userSelect: 'none',
        ...(edit.type === Tool.Text && { width: `${(textEdit.width || 100) * scale}px` }),
    };

    const containerClasses = `
        ${isSelected ? 'border-2 border-blue-500 border-dashed' : 'border-2 border-transparent'}
        hover:border-blue-300 hover:border-dashed
        relative p-0.5
    `;

    return (
        <div 
            style={baseStyle}
            className={containerClasses}
            onMouseDown={handleMouseDown}
            onDoubleClick={(e) => {
                e.stopPropagation();
                if (edit.type === Tool.Text) {
                    setIsEditing(true);
                    setTimeout(() => inputRef.current?.focus(), 0);
                }
            }}
        >
            {edit.type === Tool.Text ? (
                <div style={{ fontSize: `${textEdit.fontSize * scale}px`, lineHeight: 1.2 }}>
                    {isEditing ? (
                        <textarea
                            ref={inputRef}
                            value={textEdit.content}
                            onChange={(e) => onUpdate(edit.id, { content: e.target.value })}
                            onBlur={handleBlur}
                            className="bg-transparent outline-none p-0 m-0 border-none resize-none overflow-hidden w-full"
                            style={{
                                fontSize: 'inherit',
                                color: 'black',
                                lineHeight: 'inherit',
                            }}
                        />
                    ) : (
                        <span className="whitespace-pre-wrap break-words">{textEdit.content}</span>
                    )}
                </div>
            ) : (
                <div style={{ fontSize: `${(edit as CheckmarkEdit).size * scale}px`, color: 'green' }}>✓</div>
            )}
            {isSelected && (
                <>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(edit.id);
                        }}
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-red-600 z-10"
                        title="Delete item"
                    >
                        <X size={12} />
                    </button>
                    {edit.type === Tool.Text && (
                        <>
                           <div 
                                className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-4 bg-blue-500 rounded-sm cursor-ew-resize"
                                onMouseDown={(e) => handleResizeHandleMouseDown(e, 'resize-left')}
                            />
                            <div 
                                className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-4 bg-blue-500 rounded-sm cursor-ew-resize"
                                onMouseDown={(e) => handleResizeHandleMouseDown(e, 'resize-right')}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export const PdfViewer: React.FC<PdfViewerProps> = ({
    pdfDoc,
    pageNumber,
    edits,
    onAddEdit,
    onUpdateEdit,
    onDeleteEdit,
    selectedTool
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const viewerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1.5);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    useEffect(() => {
        if (!pdfDoc) return;
        const renderPage = async () => {
            const page = await pdfDoc.getPage(pageNumber);
            const viewport = page.getViewport({ scale });
            const canvas = canvasRef.current;
            if (canvas) {
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport,
                    };
                    await page.render(renderContext).promise;
                }
            }
        };
        renderPage();
    }, [pdfDoc, pageNumber, scale]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (selectedTool === Tool.Select) {
            setSelectedItemId(null);
            return;
        };
        
        if((e.target as HTMLElement).closest('.pointer-events-auto')) return;
        
        const viewer = viewerRef.current;
        if (viewer) {
            const rect = viewer.getBoundingClientRect();
            const x = (e.clientX - rect.left + viewer.scrollLeft) / scale;
            const y = (e.clientY - rect.top + viewer.scrollTop) / scale;
            const newId = onAddEdit(x, y);

            if (selectedTool === Tool.Text) {
                setSelectedItemId(newId);
            } else {
                setSelectedItemId(null);
            }
        }
    };
    
    return (
        <div 
            ref={viewerRef}
            className="relative bg-white shadow-lg overflow-auto"
            style={{ cursor: selectedTool !== Tool.Select ? 'crosshair' : 'default' }}
            onClick={handleCanvasClick}
        >
            <canvas ref={canvasRef} />
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                 {edits.map((edit) => (
                    <div key={edit.id} className="pointer-events-auto">
                        <EditableItem
                            edit={edit}
                            scale={scale}
                            onUpdate={onUpdateEdit}
                            onDelete={onDeleteEdit}
                            isSelected={selectedItemId === edit.id}
                            setSelectedItemId={setSelectedItemId}
                            selectedTool={selectedTool}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
