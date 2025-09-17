import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import cn from "classnames";
import type {
    ComponentTemplate,
    ComponentCategory,
    ComponentLibrary as ComponentLibraryType,
    ComponentSaveOptions,
} from "../../types/editor";
import { ComponentLibraryUtils } from "../../utils/componentLibraryUtils";
import { Icon } from "../ui";
import "./componentLibrary.css";

export interface ComponentLibraryProps {
    className?: string;
    libraries: ComponentLibraryType[];
    activeLibraryId?: string;
    searchQuery: string;
    selectedCategoryId?: string;
    isOpen: boolean;
    onLibraryChange: (libraryId: string) => void;
    onSearchChange: (query: string) => void;
    onCategorySelect: (categoryId?: string) => void;
    onTemplateSelect: (template: ComponentTemplate) => void;
    onTemplateDragStart: (template: ComponentTemplate, event: React.DragEvent) => void;
    onCreateComponent: (options: ComponentSaveOptions) => void;
    onImportLibrary: () => void;
    onExportLibrary: () => void;
}

interface DragState {
    isDragging: boolean;
    dragTemplate: ComponentTemplate | null;
    dragOffset: { x: number; y: number };
}

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
    className,
    libraries,
    activeLibraryId,
    searchQuery,
    selectedCategoryId,
    isOpen,
    onLibraryChange,
    onSearchChange,
    onCategorySelect,
    onTemplateSelect,
    onTemplateDragStart,
    onCreateComponent,
    onImportLibrary,
    onExportLibrary,
}) => {
    const [dragState, setDragState] = useState<DragState>({
        isDragging: false,
        dragTemplate: null,
        dragOffset: { x: 0, y: 0 },
    });
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Get current library
    const currentLibrary = useMemo(
        () => libraries.find((lib) => lib.id === activeLibraryId) || libraries[0],
        [libraries, activeLibraryId]
    );

    // Filter and sort templates
    const filteredTemplates = useMemo(() => {
        if (!currentLibrary) return [];

        return ComponentLibraryUtils.searchTemplates(currentLibrary.templates, searchQuery, selectedCategoryId);
    }, [currentLibrary, searchQuery, selectedCategoryId]);

    // Get categories with template counts
    const categoriesWithCounts = useMemo(() => {
        if (!currentLibrary) return [];

        return currentLibrary.categories.map((category) => ({
            ...category,
            count: currentLibrary.templates.filter((template) => template.category === category.id).length,
        }));
    }, [currentLibrary]);

    // Handle search input change
    const handleSearchChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onSearchChange(event.target.value);
        },
        [onSearchChange]
    );

    // Handle category selection
    const handleCategoryClick = useCallback(
        (categoryId: string) => {
            const newCategoryId = selectedCategoryId === categoryId ? undefined : categoryId;
            onCategorySelect(newCategoryId);
        },
        [selectedCategoryId, onCategorySelect]
    );

    // Handle template click
    const handleTemplateClick = useCallback(
        (template: ComponentTemplate) => {
            onTemplateSelect(template);
        },
        [onTemplateSelect]
    );

    // Handle drag start
    const handleDragStart = useCallback(
        (template: ComponentTemplate, event: React.DragEvent) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const offsetX = event.clientX - rect.left;
            const offsetY = event.clientY - rect.top;

            setDragState({
                isDragging: true,
                dragTemplate: template,
                dragOffset: { x: offsetX, y: offsetY },
            });

            // Set drag data for external drop handlers
            event.dataTransfer.setData(
                "application/json",
                JSON.stringify({
                    type: "component-template",
                    templateId: template.id,
                })
            );

            onTemplateDragStart(template, event);
        },
        [onTemplateDragStart]
    );

    // Handle drag end
    const handleDragEnd = useCallback(() => {
        setDragState({
            isDragging: false,
            dragTemplate: null,
            dragOffset: { x: 0, y: 0 },
        });
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === "Escape") {
                onCategorySelect(undefined);
                onSearchChange("");
            }
        },
        [onCategorySelect, onSearchChange]
    );

    // Focus search input when opening
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className={cn("component-library", className, {
                "component-library--entering": isOpen,
            })}
            onKeyDown={handleKeyDown}>
            {/* Header */}
            <div className="component-library__header">
                <h3 className="component-library__title">Component Library</h3>

                {/* Search */}
                <div className="component-library__search">
                    <Icon name="settings" className="component-library__search-icon" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Search components..."
                        className="component-library__search-input"
                        aria-label="Search components"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange("")}
                            className="component-library__search-clear"
                            title="Clear search"
                            aria-label="Clear search">
                            ×
                        </button>
                    )}
                </div>

                {/* Toolbar */}
                <div className="component-library__toolbar">
                    <button
                        onClick={() => setShowCreateDialog(true)}
                        className="component-library__toolbar-button"
                        title="Create component from selection"
                        aria-label="Create component from selection">
                        <Icon name="plus" />
                    </button>
                    <button
                        onClick={onImportLibrary}
                        className="component-library__toolbar-button"
                        title="Import library"
                        aria-label="Import library">
                        <Icon name="folder" />
                    </button>
                    <button
                        onClick={onExportLibrary}
                        className="component-library__toolbar-button"
                        title="Export library"
                        aria-label="Export library">
                        <Icon name="copy" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="component-library__content">
                {/* Categories */}
                <div className="component-library__categories">
                    <div className="component-library__category">
                        <div
                            className={cn("component-library__category-header", {
                                "component-library__category-header--active": !selectedCategoryId,
                            })}
                            onClick={() => onCategorySelect(undefined)}
                            role="button"
                            tabIndex={0}
                            aria-label="All categories">
                            <Icon name="layer" className="component-library__category-icon" />
                            <span className="component-library__category-name">All</span>
                            <span className="component-library__category-count">
                                {currentLibrary?.templates.length || 0}
                            </span>
                        </div>
                    </div>

                    {categoriesWithCounts.map((category) => (
                        <div key={category.id} className="component-library__category">
                            <div
                                className={cn("component-library__category-header", {
                                    "component-library__category-header--active": selectedCategoryId === category.id,
                                })}
                                onClick={() => handleCategoryClick(category.id)}
                                role="button"
                                tabIndex={0}
                                aria-label={`${category.name} category`}>
                                <Icon name="folder" className="component-library__category-icon" />
                                <span className="component-library__category-name">{category.name}</span>
                                <span className="component-library__category-count">{category.count}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Templates */}
                {filteredTemplates.length > 0 ? (
                    <div className="component-library__templates">
                        {filteredTemplates.map((template) => (
                            <div
                                key={template.id}
                                className={cn("component-library__template", {
                                    "component-library__template--dragging":
                                        dragState.isDragging && dragState.dragTemplate?.id === template.id,
                                })}
                                onClick={() => handleTemplateClick(template)}
                                onDragStart={(event) => handleDragStart(template, event)}
                                onDragEnd={handleDragEnd}
                                draggable
                                role="button"
                                tabIndex={0}
                                aria-label={`${template.name} component`}>
                                {/* Thumbnail */}
                                <div className="component-library__template-thumbnail">
                                    {template.thumbnail ? (
                                        <img src={template.thumbnail} alt={template.name} loading="lazy" />
                                    ) : (
                                        <div className="component-library__template-placeholder">
                                            <Icon name="circle" />
                                            <div className="component-library__template-placeholder-text">
                                                {template.objects.length}{" "}
                                                {template.objects.length === 1 ? "object" : "objects"}
                                            </div>
                                        </div>
                                    )}

                                    {/* Template actions overlay */}
                                    <div className="component-library__template-actions">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleTemplateClick(template);
                                            }}
                                            className="component-library__template-action"
                                            title="Insert component"
                                            aria-label={`Insert ${template.name} component`}>
                                            <Icon name="plus" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle template preview/edit
                                            }}
                                            className="component-library__template-action"
                                            title="Preview component"
                                            aria-label={`Preview ${template.name} component`}>
                                            <Icon name="eye" />
                                        </button>
                                    </div>
                                </div>

                                {/* Name and Metadata */}
                                <div className="component-library__template-info">
                                    <div className="component-library__template-name" title={template.name}>
                                        {template.name}
                                    </div>

                                    {template.description && (
                                        <div
                                            className="component-library__template-description"
                                            title={template.description}>
                                            {template.description}
                                        </div>
                                    )}

                                    <div className="component-library__template-metadata">
                                        <span className="component-library__template-dimensions">
                                            {Math.round(template.metadata.bounds.width)} ×{" "}
                                            {Math.round(template.metadata.bounds.height)}
                                        </span>
                                        <span className="component-library__template-objects">
                                            {template.objects.length} obj{template.objects.length !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                </div>

                                {/* Tags */}
                                {template.tags.length > 0 && (
                                    <div className="component-library__template-tags">
                                        {template.tags.slice(0, 3).map((tag, index) => (
                                            <span key={index} className="component-library__template-tag">
                                                {tag}
                                            </span>
                                        ))}
                                        {template.tags.length > 3 && (
                                            <span className="component-library__template-tag">
                                                +{template.tags.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="component-library__empty">
                        <Icon name="circle" className="component-library__empty-icon" />
                        <div className="component-library__empty-title">
                            {searchQuery || selectedCategoryId ? "No components found" : "No components yet"}
                        </div>
                        <div className="component-library__empty-description">
                            {searchQuery || selectedCategoryId
                                ? "Try adjusting your search or category filter"
                                : "Create your first component by selecting objects and clicking the + button"}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Component Dialog */}
            {showCreateDialog && (
                <CreateComponentDialog
                    onClose={() => setShowCreateDialog(false)}
                    onSubmit={(options) => {
                        onCreateComponent(options);
                        setShowCreateDialog(false);
                    }}
                    categories={currentLibrary?.categories || []}
                />
            )}
        </div>
    );
};

// Create Component Dialog Component
interface CreateComponentDialogProps {
    onClose: () => void;
    onSubmit: (options: ComponentSaveOptions) => void;
    categories: ComponentCategory[];
}

const CreateComponentDialog: React.FC<CreateComponentDialogProps> = ({ onClose, onSubmit, categories }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState(categories[0]?.id || "");
    const [tags, setTags] = useState("");

    const handleSubmit = useCallback(
        (event: React.FormEvent) => {
            event.preventDefault();

            if (!name.trim()) return;

            onSubmit({
                name: name.trim(),
                description: description.trim() || undefined,
                category,
                tags: tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                generateThumbnail: true,
            });
        },
        [name, description, category, tags, onSubmit]
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Create Component</h3>
                    <button onClick={onClose} className="modal-close">
                        <Icon name="x" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-field">
                        <label htmlFor="component-name">Name *</label>
                        <input
                            id="component-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Component name"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="component-description">Description</label>
                        <textarea
                            id="component-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                            rows={3}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="component-category">Category</label>
                        <select id="component-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label htmlFor="component-tags">Tags</label>
                        <input
                            id="component-tags"
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="tag1, tag2, tag3"
                        />
                        <div className="form-help">Separate tags with commas</div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="button button--secondary">
                            Cancel
                        </button>
                        <button type="submit" className="button button--primary" disabled={!name.trim()}>
                            Create Component
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
