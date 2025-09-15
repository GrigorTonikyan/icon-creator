import cn from "classnames";
import { useEditor } from "../../contexts/EditorContext";
import { type ToolType } from "../../types/editor";
import { Button } from "../ui/Button/Button";
import "./toolbar.css";

interface ToolbarProps {
    className?: string;
}

interface ToolDefinition {
    type: ToolType;
    name: string;
    icon: string;
    shortcut: string;
    ariaLabel: string;
}

const tools: ToolDefinition[] = [
    {
        type: "select",
        name: "Select",
        icon: "⚡",
        shortcut: "V",
        ariaLabel: "Select tool (V)",
    },
    {
        type: "rectangle",
        name: "Rectangle",
        icon: "▭",
        shortcut: "R",
        ariaLabel: "Rectangle tool (R)",
    },
    {
        type: "circle",
        name: "Circle",
        icon: "○",
        shortcut: "C",
        ariaLabel: "Circle tool (C)",
    },
    {
        type: "hand",
        name: "Hand",
        icon: "✋",
        shortcut: "H",
        ariaLabel: "Hand tool for panning (H)",
    },
];

export const Toolbar: React.FC<ToolbarProps> = ({ className }) => {
    const { state, setTool } = useEditor();
    const { selectedTool } = state;

    const toolbarCn = cn("Toolbar", className);

    const handleToolSelect = (tool: ToolType) => {
        setTool(tool);
    };

    return (
        <div className={toolbarCn} role="toolbar" aria-label="Drawing tools">
            <div className="toolbar-group">
                <h3 className="toolbar-group-title">Tools</h3>
                <div className="toolbar-tools">
                    {tools.map((tool) => (
                        <Button
                            key={tool.type}
                            className={cn("toolbar-tool", {
                                "toolbar-tool--active": selectedTool === tool.type,
                            })}
                            variant={selectedTool === tool.type ? "primary" : "secondary"}
                            onClick={() => handleToolSelect(tool.type)}
                            aria-label={tool.ariaLabel}
                            aria-pressed={selectedTool === tool.type}
                            title={`${tool.name} (${tool.shortcut})`}>
                            <span className="toolbar-tool-icon" aria-hidden="true">
                                {tool.icon}
                            </span>
                            <span className="toolbar-tool-name">{tool.name}</span>
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
};
