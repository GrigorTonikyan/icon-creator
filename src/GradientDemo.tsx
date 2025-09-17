import React, { useEffect } from "react";
import { EditorProvider, useEditor } from "./contexts/EditorContext";
import { Canvas } from "./components/Canvas/Canvas";
import type { RectangleObject, CircleObject, LinearGradient, RadialGradient } from "./types/editor";
import "./app.css";

const GradientDemoContent: React.FC = () => {
    const { addObject } = useEditor();

    useEffect(() => {
        // Create linear gradient
        const linearGradient: LinearGradient = {
            type: "linear",
            id: "demo-linear",
            x1: 0,
            y1: 0,
            x2: 100,
            y2: 0,
            stops: [
                { offset: 0, color: "#ff6b6b" },
                { offset: 0.5, color: "#4ecdc4" },
                { offset: 1, color: "#45b7d1" },
            ],
        };

        // Create radial gradient
        const radialGradient: RadialGradient = {
            type: "radial",
            id: "demo-radial",
            cx: 50,
            cy: 50,
            r: 50,
            stops: [
                { offset: 0, color: "#ffd93d" },
                { offset: 0.7, color: "#ff6b6b" },
                { offset: 1, color: "#8b5cf6" },
            ],
        };

        // Create rectangle with linear gradient
        const gradientRect: RectangleObject = {
            id: "gradient-rect",
            type: "rectangle",
            name: "Linear Gradient Rectangle",
            transform: { x: 50, y: 50, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 1,
            layerId: "default",
            width: 150,
            height: 80,
            style: {
                fill: linearGradient,
                stroke: "#333",
                strokeWidth: 2,
            },
        };

        // Create circle with radial gradient
        const gradientCircle: CircleObject = {
            id: "gradient-circle",
            type: "circle",
            name: "Radial Gradient Circle",
            transform: { x: 250, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 2,
            layerId: "default",
            radius: 60,
            style: {
                fill: radialGradient,
                stroke: "#333",
                strokeWidth: 2,
            },
        };

        // Create solid color rectangle for comparison
        const solidRect: RectangleObject = {
            id: "solid-rect",
            type: "rectangle",
            name: "Solid Color Rectangle",
            transform: { x: 50, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 3,
            layerId: "default",
            width: 100,
            height: 60,
            style: {
                fill: "#10b981",
                stroke: "#333",
                strokeWidth: 2,
            },
        };

        // Add objects to canvas
        addObject(gradientRect);
        addObject(gradientCircle);
        addObject(solidRect);
    }, [addObject]);

    return (
        <div style={{ width: "100vw", height: "100vh", background: "#f5f5f5" }}>
            <div style={{ padding: "20px", textAlign: "center" }}>
                <h1>Gradient System Demo</h1>
                <p>This demo shows the working gradient system with Canvas integration</p>
                <div style={{ border: "2px solid #ddd", borderRadius: "8px", display: "inline-block" }}>
                    <Canvas />
                </div>
                <div style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
                    <p>✅ Linear gradient rectangle (red → teal → blue)</p>
                    <p>✅ Radial gradient circle (yellow → red → purple)</p>
                    <p>✅ Solid color rectangle (green) for comparison</p>
                </div>
            </div>
        </div>
    );
};

const GradientDemo: React.FC = () => {
    return (
        <EditorProvider>
            <GradientDemoContent />
        </EditorProvider>
    );
};

export default GradientDemo;
