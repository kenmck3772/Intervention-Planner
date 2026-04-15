import React, { useMemo } from 'react';
import { WellProgram, SchematicItem } from '../types';

interface WellboreSchematicViewerProps {
    program: WellProgram;
    analogueProgram: WellProgram | null;
    highlightedItemId: string | null;
    hoveredItemId: string | null;
    onItemClick: (id: string | null) => void;
    onItemMouseEnter: (id: string | null) => void;
    onItemMouseLeave: () => void;
    onAddObservation: (depth: number) => void;
    calculationDepth: string;
    hydrostaticPressure: string;
}

const WellboreSchematicViewer: React.FC<WellboreSchematicViewerProps> = ({
    program,
    analogueProgram,
    highlightedItemId,
    hoveredItemId,
    onItemClick,
    onItemMouseEnter,
    onItemMouseLeave,
    onAddObservation,
    calculationDepth,
    hydrostaticPressure,
}) => {
    // Increased view height for better vertical resolution
    const VIEW_HEIGHT = 1500;
    const MIN_DEPTH = 100;

    // Prepare items with normalized data
    const { sortedItems, scale, maxDiameter } = useMemo(() => {
        const items: (SchematicItem & { diameter: number; zIndex: number })[] = [];

        // 1. Casing
        program.casingSchema.forEach(c => {
            items.push({
                ...c,
                type: 'Casing',
                top: 0,
                bottom: parseFloat(c.shoeDepthMD),
                description: `${c.casingId} (${c.size}" @ ${c.shoeDepthMD}ft)`,
                diameter: parseFloat(c.size),
                zIndex: 1 // Base layer
            });
        });

        // 2. Completion / Tubing
        program.completionTally.forEach(c => {
            if (!c.isHeader) {
                items.push({
                    ...c,
                    type: 'Completion',
                    top: c.topDepth,
                    bottom: c.bottomDepth,
                    description: c.description,
                    diameter: parseFloat(String(c.od)) || 0,
                    zIndex: 2 // Inside casing
                });
            }
        });

        // 3. Plugs
        program.pluggingTally.forEach(p => {
            items.push({
                ...p,
                type: 'Plug',
                top: p.topOfPlug,
                bottom: p.bottomOfPlug,
                description: p.description,
                diameter: 0, // Will calculate visual width later
                zIndex: 3 // On top of everything in the bore
            });
        });

        // 4. Observations
        program.keyObservations.forEach(o => {
            items.push({
                ...o,
                type: 'Observation',
                top: o.depth,
                bottom: o.depth,
                description: o.description,
                diameter: 0,
                zIndex: 4 // Overlay
            });
        });

        // Calculate Scale based on the deepest item
        const maxDepth = items.reduce((max, item) => Math.max(max, parseFloat(String(item.bottom || 0))), MIN_DEPTH);
        // Add some padding at the bottom
        const scale = VIEW_HEIGHT / (maxDepth * 1.05);

        // Calculate Max Diameter for width scaling (exclude 0 diameter items)
        const maxDia = items.reduce((max, item) => Math.max(max, item.diameter), 0) || 30;

        // Sort for rendering order:
        // We rely on z-index for stacking, but DOM order matters for events.
        // Render larger diameter items first (background) to smaller (foreground).
        items.sort((a, b) => {
            // Observations always last
            if (a.type === 'Observation') return 1;
            if (b.type === 'Observation') return -1;
            
            // Then by z-index ascending (Casing < Completion < Plug)
            if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
            
            // Then by diameter descending (within same type, larger goes first/behind)
            return b.diameter - a.diameter;
        });

        return { sortedItems: items, scale, maxDiameter: maxDia };
    }, [program, VIEW_HEIGHT]);

    const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).classList.contains('schematic-bg')) {
            const rect = e.currentTarget.getBoundingClientRect();
            // Calculate click relative to the container's scrolling content
            const y = e.clientY - rect.top + e.currentTarget.scrollTop;
            const clickedDepth = y / scale;
            onAddObservation(Math.round(clickedDepth));
        }
    };

    const renderItem = (item: SchematicItem & { diameter: number; zIndex: number }) => {
        const topPx = parseFloat(String(item.top)) * scale;
        const bottomPx = parseFloat(String(item.bottom)) * scale;
        const heightPx = Math.max(2, bottomPx - topPx);

        const isHighlighted = highlightedItemId === item.id;
        const isHovered = hoveredItemId === item.id;

        let style: React.CSSProperties = {
            top: `${topPx}px`,
            height: `${heightPx}px`,
            zIndex: item.zIndex,
        };

        let className = "absolute text-xs cursor-pointer transition-all border ";
        
        if (item.type === 'Observation') {
            // Observations are sticky notes on the right side
            style.right = '2%';
            style.width = '200px';
            style.height = 'auto'; // Auto height for text
            style.minHeight = '24px';
            style.top = `${topPx}px`;
            // Center vertically on the depth line by translating up 50%
            style.transform = 'translateY(-50%)';
            className += "bg-yellow-100 border-yellow-400 text-yellow-900 rounded shadow-md p-2 z-50 opacity-90 hover:opacity-100";
        } else {
            // Pipes and Plugs are centered
            // Max width of the drawing area is 60% of the container to leave room for annotations
            const DRAWING_WIDTH_PERCENT = 60;
            
            let itemDiameter = item.diameter;
            
            if (item.type === 'Plug') {
                // Plugs default to roughly 50% of the max diameter for visibility if generic
                // Ideally this would match the ID of the casing it is inside, but this is a good approximation
                itemDiameter = maxDiameter * 0.5; 
            }

            // If diameter is missing (e.g. some completion items), default to small
            if (!itemDiameter) itemDiameter = maxDiameter * 0.2;

            const widthPercent = (itemDiameter / maxDiameter) * DRAWING_WIDTH_PERCENT;
            style.width = `${widthPercent}%`;
            style.left = `${50 - (widthPercent / 2)}%`; // Center align

            // Visual Styles based on type
            if (item.type === 'Casing') {
                // Metallic gradient
                style.background = 'linear-gradient(90deg, #64748b, #94a3b8 20%, #cbd5e1 50%, #94a3b8 80%, #64748b)';
                className += "border-slate-600 opacity-100 shadow-sm";
            } else if (item.type === 'Completion') {
                // Blue metallic gradient
                style.background = 'linear-gradient(90deg, #2563eb, #60a5fa 30%, #bfdbfe 50%, #60a5fa 70%, #2563eb)';
                className += "border-blue-700 opacity-100 shadow-sm";
            } else if (item.type === 'Plug') {
                // Hatched pattern for cement
                style.background = 'repeating-linear-gradient(45deg, #ef4444, #ef4444 10px, #f87171 10px, #f87171 20px)';
                className += "border-red-800 shadow-md";
            }
            
            if (isHighlighted) className += " ring-2 ring-yellow-400 ring-offset-1 z-50";
            if (isHovered) className += " brightness-110 shadow-lg z-50";
        }

        return (
            <div
                key={item.id}
                style={style}
                className={className}
                onClick={(e) => { e.stopPropagation(); onItemClick(item.id); }}
                onMouseEnter={() => onItemMouseEnter(item.id)}
                onMouseLeave={onItemMouseLeave}
                title={`${item.type}: ${item.description}\nTop: ${item.top}ft, Bottom: ${item.bottom}ft`}
            >
               {/* Only show text if height is sufficient or it's an observation */}
               {(heightPx > 24 || item.type === 'Observation') && (
                   <div className={`overflow-hidden text-ellipsis whitespace-nowrap px-1 font-semibold select-none ${item.type === 'Casing' ? 'text-slate-800 opacity-0 hover:opacity-100 text-center' : ''}`}>
                       {item.description} 
                   </div>
               )}
            </div>
        );
    };

    return (
        <div className="bg-slate-900 border border-slate-700 p-0 rounded-lg relative overflow-hidden h-[700px] flex flex-col">
            <div className="flex-shrink-0 bg-slate-800 p-2 border-b border-slate-700 flex justify-between items-center z-10">
                <span className="text-xs font-mono text-gray-400">0 ft MD</span>
                <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Schematic View</h4>
                <span className="text-xs font-mono text-gray-400">Scale: 1:{Math.round(scale * 100)}</span>
            </div>
            
            <div className="relative overflow-y-auto flex-grow">
                 {/* Depth Markers / Ruler - Simplified */}
                 <div className="absolute left-0 top-0 bottom-0 w-16 border-r border-slate-800 bg-slate-900/50 z-10 pointer-events-none">
                     {Array.from({ length: 20 }).map((_, i) => {
                         const depth = (i + 1) * (VIEW_HEIGHT / scale / 20); // approximate steps
                         return (
                             <div key={i} className="absolute w-full border-b border-slate-700 text-[10px] text-slate-500 text-right pr-2" style={{ top: `${(i + 1) * (VIEW_HEIGHT / 20)}px` }}>
                                 {Math.round(depth)}'
                             </div>
                         )
                     })}
                 </div>

                <div 
                    className="relative schematic-bg w-full mx-auto" 
                    style={{ height: `${VIEW_HEIGHT}px`}}
                    onClick={handleBackgroundClick}
                >
                    {/* Central axis line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-800 -translate-x-1/2"></div>

                    {sortedItems.map(renderItem)}

                    {/* Calculation Depth Line */}
                    {parseFloat(calculationDepth) > 0 && (
                         <div 
                            className="absolute left-0 right-0 border-t-2 border-dashed border-cyan-400 z-40 pointer-events-none flex items-center"
                            style={{ top: `${parseFloat(calculationDepth) * scale}px` }}
                        >
                            <div className="absolute left-20 bg-cyan-900/90 text-cyan-100 text-xs px-2 py-1 rounded border border-cyan-500 shadow-lg backdrop-blur-sm -translate-y-1/2">
                                Depth: {calculationDepth} ft | {hydrostaticPressure} psi
                            </div>
                        </div>
                    )}
                </div>
            </div>

             {analogueProgram && (
                <div className="absolute top-12 right-4 bg-slate-800/90 p-3 rounded shadow-lg z-50 border border-slate-600 backdrop-blur max-w-xs">
                    <h4 className="font-bold text-xs text-blue-400 uppercase mb-1">Analogue Comparison</h4>
                    <p className="text-sm text-gray-200">{analogueProgram.wellHeader.wellName}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-3">{analogueProgram.schematicDescription}</p>
                </div>
            )}
        </div>
    );
};

export default WellboreSchematicViewer;