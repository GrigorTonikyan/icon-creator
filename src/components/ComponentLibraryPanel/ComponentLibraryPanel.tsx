import React, { useCallback, useMemo } from "react";
import { useEditor } from "../../contexts/EditorContext";
import { ComponentLibrary } from "../ComponentLibrary";
import type { ComponentSaveOptions, ComponentTemplate } from "../../types/editor";
import { ComponentLibraryUtils } from "../../utils/componentLibraryUtils";

interface ComponentLibraryPanelProps {
    className?: string;
}

export const ComponentLibraryPanel: React.FC<ComponentLibraryPanelProps> = ({ className }) => {
    const {
        state,
        saveComponent,
        instantiateComponent,
        loadComponentLibrary,
        setActiveComponentLibrary,
        setComponentLibrarySearch,
        setComponentLibraryCategory,
        toggleComponentLibraryPanel,
    } = useEditor();

    const {
        componentLibrary: { libraries, activeLibraryId, searchQuery, selectedCategoryId, isLibraryPanelOpen },
        selection: { objectIds: selectedObjectIds },
    } = state;

    // Handle template selection for instantiation
    const handleTemplateSelect = useCallback(
        (template: ComponentTemplate) => {
            // Find center of viewport for placement
            const { viewport } = state;
            const centerX = viewport.canvasWidth / 2;
            const centerY = viewport.canvasHeight / 2;

            instantiateComponent(template.id, { x: centerX, y: centerY });
        },
        [instantiateComponent, state]
    );

    // Handle drag start for template
    const handleTemplateDragStart = useCallback((template: ComponentTemplate, event: React.DragEvent) => {
        // Store template data for drop handling
        event.dataTransfer.setData(
            "application/json",
            JSON.stringify({
                type: "component-template",
                templateId: template.id,
            })
        );
        event.dataTransfer.effectAllowed = "copy";
    }, []);

    // Handle component creation from selection
    const handleCreateComponent = useCallback(
        (options: ComponentSaveOptions) => {
            if (selectedObjectIds.length === 0) {
                console.warn("No objects selected for component creation");
                return;
            }

            saveComponent(selectedObjectIds, options);
        },
        [selectedObjectIds, saveComponent]
    );

    // Handle library import
    const handleImportLibrary = useCallback(async () => {
        try {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json";
            input.onchange = async (event) => {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (!file) return;

                const text = await file.text();
                const library = ComponentLibraryUtils.importLibrary(text);
                loadComponentLibrary(library);
            };
            input.click();
        } catch (error) {
            console.error("Failed to import library:", error);
        }
    }, [loadComponentLibrary]);

    // Handle library export
    const handleExportLibrary = useCallback(async () => {
        try {
            const activeLibrary = libraries.find((lib) => lib.id === activeLibraryId);
            if (!activeLibrary) {
                console.warn("No active library to export");
                return;
            }

            const jsonData = ComponentLibraryUtils.exportLibrary(activeLibrary);
            const blob = new Blob([jsonData], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${activeLibrary.name}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export library:", error);
        }
    }, [libraries, activeLibraryId]);

    // Load default library if none exist
    React.useEffect(() => {
        if (libraries.length === 0) {
            const defaultLibrary = ComponentLibraryUtils.createDefaultLibrary();
            loadComponentLibrary(defaultLibrary);
        }
    }, [libraries.length, loadComponentLibrary]);

    // Component library props
    const componentLibraryProps = useMemo(
        () => ({
            className,
            libraries,
            activeLibraryId,
            searchQuery,
            selectedCategoryId,
            isOpen: isLibraryPanelOpen,
            onLibraryChange: setActiveComponentLibrary,
            onSearchChange: setComponentLibrarySearch,
            onCategorySelect: setComponentLibraryCategory,
            onTemplateSelect: handleTemplateSelect,
            onTemplateDragStart: handleTemplateDragStart,
            onCreateComponent: handleCreateComponent,
            onImportLibrary: handleImportLibrary,
            onExportLibrary: handleExportLibrary,
        }),
        [
            className,
            libraries,
            activeLibraryId,
            searchQuery,
            selectedCategoryId,
            isLibraryPanelOpen,
            setActiveComponentLibrary,
            setComponentLibrarySearch,
            setComponentLibraryCategory,
            handleTemplateSelect,
            handleTemplateDragStart,
            handleCreateComponent,
            handleImportLibrary,
            handleExportLibrary,
        ]
    );

    return <ComponentLibrary {...componentLibraryProps} />;
};
