import { Canvas, Toolbar } from "../../components";
import { AccessibilityProvider } from "../../components/AccessibilityProvider";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

import cn from "classnames";
import "./visualEditor.css";

interface VisualEditorProps {
    className?: string;
}

/**
 * VisualEditor Component
 *
 * Complete visual editor interface that integrates:
 * - Canvas for object manipulation and rendering
 * - Toolbar for tool selection and shape creation
 * - LayerPanel for layer management (left sidebar)
 * - PropertyPanel for object property editing (right sidebar)
 * - Keyboard shortcuts for productivity
 *
 * This component is designed to work within the app's Layout system
 * and renders its panels in the main content area.
 *
 * Note: EditorProvider is handled by the parent App component
 * when visual-editor section is active.
 */
export function VisualEditor({ className }: VisualEditorProps) {
    // Initialize keyboard shortcuts
    useKeyboardShortcuts({ enabled: true });

    const visualEditorCn = cn("visual-editor", className);

    return (
        <AccessibilityProvider className={visualEditorCn}>
            {/* Main content area with canvas and toolbar */}
            <div className="visual-editor__main">
                <Toolbar className="visual-editor__toolbar" />
                <Canvas className="visual-editor__canvas" />
            </div>
        </AccessibilityProvider>
    );
}
