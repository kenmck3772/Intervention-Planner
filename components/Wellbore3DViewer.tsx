// Wellbore3DViewer.tsx
// This component is responsible for rendering an interactive 3D visualization
// of the wellbore path and its components (casing, tubing) using the three.js library.

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { WellProgram, DeviationSurveyStation } from '../types';

/**
 * Props for the Wellbore3DViewer component.
 */
interface Wellbore3DViewerProps {
    /** The full well program containing survey, casing, and tubing data. */
    program: WellProgram;
}

/**
 * Calculates a 3D path from deviation survey data using the industry-standard Minimum Curvature method.
 */
const calculate3DPath = (survey: DeviationSurveyStation[]): { points: THREE.Vector3[], maxMD: number } => {
    if (!survey || survey.length === 0) {
        return { points: [new THREE.Vector3(0, 0, 0)], maxMD: 0 };
    }

    const points: THREE.Vector3[] = [];
    let prevStation = { md: 0, incl: 0, azim: 0, n: 0, e: 0, tvd: 0 };

    // Ensure start at origin
    if (survey[0]?.md !== 0) {
        points.push(new THREE.Vector3(0, 0, 0));
    }

    let currentMaxMD = 0;

    // Sort survey by MD just in case
    const sortedSurvey = [...survey].sort((a, b) => a.md - b.md);

    for (const currStation of sortedSurvey) {
        const incl1_rad = prevStation.incl * (Math.PI / 180);
        const azim1_rad = prevStation.azim * (Math.PI / 180);
        const incl2_rad = currStation.incl * (Math.PI / 180);
        const azim2_rad = currStation.azim * (Math.PI / 180);
        const dMD = currStation.md - prevStation.md;

        if (dMD <= 0) continue;

        const cos_beta = Math.cos(incl2_rad - incl1_rad) - (Math.sin(incl1_rad) * Math.sin(incl2_rad) * (1 - Math.cos(azim2_rad - azim1_rad)));
        const beta = Math.acos(Math.max(-1, Math.min(1, cos_beta)));
        
        const RF = beta < 1e-6 ? 1 : (2 / beta) * Math.tan(beta / 2);
        
        const dN = (dMD / 2) * (Math.sin(incl1_rad) * Math.cos(azim1_rad) + Math.sin(incl2_rad) * Math.cos(azim2_rad)) * RF;
        const dE = (dMD / 2) * (Math.sin(incl1_rad) * Math.sin(azim1_rad) + Math.sin(incl2_rad) * Math.sin(azim2_rad)) * RF;
        const dTVD = (dMD / 2) * (Math.cos(incl1_rad) + Math.cos(incl2_rad)) * RF;

        const nextPoint = {
            md: currStation.md,
            incl: currStation.incl,
            azim: currStation.azim,
            n: prevStation.n + dN,
            e: prevStation.e + dE,
            tvd: prevStation.tvd + dTVD
        };
        
        // Map: North -> -Z (or Z), East -> X, TVD -> -Y
        // Standard Engineering: Z is Up.
        // Three.js: Y is Up.
        // Let's map: TVD -> -Y. East -> X. North -> -Z.
        points.push(new THREE.Vector3(nextPoint.e, -nextPoint.tvd, -nextPoint.n));
        
        prevStation = nextPoint;
        currentMaxMD = currStation.md;
    }

    return { points, maxMD: currentMaxMD };
};

/**
 * A React component that renders an interactive 3D view of a wellbore path.
 */
const Wellbore3DViewer: React.FC<Wellbore3DViewerProps> = ({ program }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const meshesGroupRef = useRef<THREE.Group | null>(null);
    const gridHelperRef = useRef<THREE.GridHelper | null>(null);
    const axesHelperRef = useRef<THREE.AxesHelper | null>(null);

    const [isGridVisible, setIsGridVisible] = useState(true);
    const [diameterScale, setDiameterScale] = useState(10); // Exaggeration factor

    // --- EFFECT 1: Scene Setup ---
    useEffect(() => {
        if (!mountRef.current) return;
        const currentMount = mountRef.current;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0f172a); // Slate-900
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(60, currentMount.clientWidth / currentMount.clientHeight, 1, 100000);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        rendererRef.current = renderer;
        currentMount.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controlsRef.current = controls;

        // Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(500, 1000, 500);
        scene.add(mainLight);
        const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
        backLight.position.set(-500, -200, -500);
        scene.add(backLight);
        
        // Helpers
        axesHelperRef.current = new THREE.AxesHelper(500);
        scene.add(axesHelperRef.current);
        gridHelperRef.current = new THREE.GridHelper(5000, 50, 0x475569, 0x1e293b); // Slate colors
        scene.add(gridHelperRef.current);

        // Group for well meshes
        const group = new THREE.Group();
        scene.add(group);
        meshesGroupRef.current = group;

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (currentMount && renderer.domElement) {
                camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            currentMount.removeChild(renderer.domElement);
            renderer.dispose();
        };
    }, []);

    // --- EFFECT 2: Render Geometry ---
    useEffect(() => {
        if (!sceneRef.current || !meshesGroupRef.current || !program.deviationSurvey.length) return;
        
        const group = meshesGroupRef.current;
        // Clear existing meshes
        while(group.children.length > 0){ 
            const obj = group.children[0] as THREE.Mesh;
            if(obj.geometry) obj.geometry.dispose();
            if(Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else (obj.material as THREE.Material).dispose();
            group.remove(obj); 
        }

        const { points, maxMD } = calculate3DPath(program.deviationSurvey);
        if (points.length < 2) return;

        const mainCurve = new THREE.CatmullRomCurve3(points);

        // Helper to create a sub-curve for a specific depth interval
        const getSubCurve = (endMD: number) => {
            // Limit endMD to maxMD to prevent errors
            const safeEndMD = Math.min(endMD, maxMD);
            const tEnd = safeEndMD / maxMD;
            
            // Sample points along the main curve up to tEnd
            // 100 samples is usually enough for visualization smoothness
            const sampleCount = 100; 
            const subPoints = [];
            for (let i = 0; i <= sampleCount; i++) {
                subPoints.push(mainCurve.getPointAt((i / sampleCount) * tEnd));
            }
            return new THREE.CatmullRomCurve3(subPoints);
        };

        // 1. Render Casing Strings
        // Sort largest to smallest so inner ones render inside
        const sortedCasings = [...program.casingSchema].sort((a, b) => parseFloat(b.size) - parseFloat(a.size));
        
        sortedCasings.forEach((casing, index) => {
            const shoeMD = parseFloat(casing.shoeDepthMD);
            if (isNaN(shoeMD) || shoeMD <= 0) return;

            const curve = getSubCurve(shoeMD);
            const radiusInFeet = (parseFloat(casing.size) / 12) / 2; // Radius in feet
            const displayRadius = radiusInFeet * diameterScale;
            
            // TubeGeometry: curve, tubularSegments, radius, radialSegments, closed
            const geometry = new THREE.TubeGeometry(curve, 128, displayRadius, 16, false);
            
            // Metallic / Glassy look
            const material = new THREE.MeshPhysicalMaterial({
                color: 0xcbd5e1, // slate-300
                metalness: 0.6,
                roughness: 0.2,
                transparent: true,
                opacity: 0.4, // Semi-transparent to see inner strings
                side: THREE.DoubleSide,
                depthWrite: false, // Important for nested transparency
            });

            const mesh = new THREE.Mesh(geometry, material);
            // Render order helps with nested transparency
            mesh.renderOrder = index; 
            group.add(mesh);
        });

        // 2. Render Tubing
        if (program.tubingSchema.settingDepth) {
            const depth = parseFloat(program.tubingSchema.settingDepth);
            const size = parseFloat(program.tubingSchema.size) || 4.5;
            if (depth > 0) {
                const curve = getSubCurve(depth);
                const radiusInFeet = (size / 12) / 2;
                const displayRadius = radiusInFeet * diameterScale;
                
                const geometry = new THREE.TubeGeometry(curve, 128, displayRadius, 12, false);
                const material = new THREE.MeshStandardMaterial({
                    color: 0xf59e0b, // Amber/Gold
                    roughness: 0.4,
                    metalness: 0.3,
                });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.renderOrder = 100; // On top (inside)
                group.add(mesh);
            }
        }

        // 3. Render Open Hole (Extension beyond last casing if survey goes deeper)
        // Find deepest casing
        let deepestShoe = 0;
        sortedCasings.forEach(c => deepestShoe = Math.max(deepestShoe, parseFloat(c.shoeDepthMD)));
        
        if (maxMD > deepestShoe + 10) {
             // Render open hole
             // Curve from deepestShoe to maxMD
             const tStart = deepestShoe / maxMD;
             const sampleCount = 50;
             const openHolePoints = [];
             for (let i = 0; i <= sampleCount; i++) {
                 const t = tStart + (i/sampleCount) * (1 - tStart);
                 openHolePoints.push(mainCurve.getPointAt(t));
             }
             if (openHolePoints.length > 1) {
                 const ohCurve = new THREE.CatmullRomCurve3(openHolePoints);
                 // Assume open hole is roughly same size as last casing or 8.5"
                 const radius = ((parseFloat(sortedCasings[sortedCasings.length-1]?.size) || 8.5) / 12) / 2;
                 const geometry = new THREE.TubeGeometry(ohCurve, 64, radius * diameterScale, 12, false);
                 const material = new THREE.MeshStandardMaterial({ color: 0x5d4037, wireframe: false }); // Brownish
                 group.add(new THREE.Mesh(geometry, material));
             }
        }


        // Auto-Fit Camera
        // Get bounding box of the whole group
        const box = new THREE.Box3().setFromObject(group);
        if (!box.isEmpty() && cameraRef.current && controlsRef.current) {
            const center = new THREE.Vector3();
            box.getCenter(center);
            const size = new THREE.Vector3();
            box.getSize(size);
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = cameraRef.current.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            cameraZ *= 1.5; // Zoom out a bit

            cameraRef.current.position.set(center.x + cameraZ, center.y + cameraZ/2, center.z + cameraZ);
            cameraRef.current.lookAt(center);
            controlsRef.current.target.copy(center);
            controlsRef.current.update();
        }

    }, [program, diameterScale]); // Re-render when program or scale changes

    // --- EFFECT 3: Helper Visibility ---
    useEffect(() => {
        if (gridHelperRef.current) gridHelperRef.current.visible = isGridVisible;
        if (axesHelperRef.current) axesHelperRef.current.visible = isGridVisible;
    }, [isGridVisible]);

    return (
        <div className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
            <div ref={mountRef} className="absolute inset-0" />
            
            {/* Controls Overlay */}
            <div className="absolute top-4 right-4 bg-slate-800/90 p-4 rounded-lg shadow-lg border border-slate-600 backdrop-blur-sm w-64">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">3D View Settings</h4>
                
                <label className="flex items-center justify-between mb-3 cursor-pointer">
                    <span className="text-sm text-gray-200">Show Grid & Axes</span>
                    <input 
                        type="checkbox" 
                        checked={isGridVisible} 
                        onChange={() => setIsGridVisible(!isGridVisible)} 
                        className="rounded border-slate-500 text-blue-500 bg-slate-700 focus:ring-offset-0"
                    />
                </label>
                
                <div className="space-y-1">
                    <div className="flex justify-between text-sm text-gray-200">
                        <span>Diameter Scale</span>
                        <span className="font-mono text-blue-400">x{diameterScale}</span>
                    </div>
                    <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={diameterScale} 
                        onChange={(e) => setDiameterScale(Number(e.target.value))}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">Exaggerates pipe width for visibility.</p>
                </div>
            </div>
            
            {/* Legend Overlay */}
            <div className="absolute bottom-4 left-4 bg-slate-800/80 p-2 rounded border border-slate-600 backdrop-blur-sm pointer-events-none">
                <div className="flex items-center space-x-2 mb-1">
                    <div className="w-3 h-3 bg-slate-400 rounded-full opacity-50"></div>
                    <span className="text-xs text-gray-300">Casing (Transparent)</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="text-xs text-gray-300">Tubing (Solid)</span>
                </div>
            </div>
        </div>
    );
};

export default Wellbore3DViewer;
