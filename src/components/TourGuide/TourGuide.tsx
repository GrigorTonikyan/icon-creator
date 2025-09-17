import React, { useEffect, useRef, useState } from "react";
import { OnboardingManager, type OnboardingStep, type OnboardingEvent } from "../../utils/onboarding";
import { Button } from "../ui/Button/Button";
import cn from "classnames";
import "./tourGuide.css";

interface TourGuideProps {
    className?: string;
    onTourComplete?: (tourId: string) => void;
    onTourSkip?: (tourId: string) => void;
}

interface TourStepProps {
    step: OnboardingStep;
    stepIndex: number;
    totalSteps: number;
    onNext: () => void;
    onPrevious: () => void;
    onSkip: () => void;
    onComplete: () => void;
    targetElement: HTMLElement | null;
}

function TourStep({
    step,
    stepIndex,
    totalSteps,
    onNext,
    onPrevious,
    onSkip,
    onComplete,
    targetElement,
}: TourStepProps) {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = React.useState({ top: 0, left: 0 });

    useEffect(() => {
        if (targetElement && tooltipRef.current) {
            const targetRect = targetElement.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let top = 0;
            let left = 0;

            switch (step.placement) {
                case "top":
                    top = targetRect.top - tooltipRect.height - 10;
                    left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                    break;
                case "bottom":
                    top = targetRect.bottom + 10;
                    left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                    break;
                case "left":
                    top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                    left = targetRect.left - tooltipRect.width - 10;
                    break;
                case "right":
                    top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                    left = targetRect.right + 10;
                    break;
            }

            // Keep tooltip within viewport bounds
            if (left < 10) left = 10;
            if (left + tooltipRect.width > viewportWidth - 10) {
                left = viewportWidth - tooltipRect.width - 10;
            }
            if (top < 10) top = 10;
            if (top + tooltipRect.height > viewportHeight - 10) {
                top = viewportHeight - tooltipRect.height - 10;
            }

            setPosition({ top, left });
        }
    }, [targetElement, step.placement]);

    const isLastStep = stepIndex === totalSteps - 1;
    const showPrevious = step.showPrevious !== false && stepIndex > 0;

    return (
        <>
            {/* Backdrop overlay */}
            <div className="tour-overlay" />

            {/* Target highlight */}
            {targetElement && (
                <div
                    className="tour-highlight"
                    style={{
                        top: targetElement.offsetTop - 4,
                        left: targetElement.offsetLeft - 4,
                        width: targetElement.offsetWidth + 8,
                        height: targetElement.offsetHeight + 8,
                    }}
                />
            )}

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                className={cn("tour-tooltip", `tour-tooltip--${step.placement}`)}
                style={{
                    position: "fixed",
                    top: position.top,
                    left: position.left,
                    zIndex: 10001,
                }}
                role="dialog"
                aria-labelledby="tour-title"
                aria-describedby="tour-description">
                <div className="tour-tooltip__header">
                    <h3 id="tour-title" className="tour-tooltip__title">
                        {step.title}
                    </h3>
                    <div className="tour-tooltip__progress">
                        <span className="tour-tooltip__step-count">
                            {stepIndex + 1} of {totalSteps}
                        </span>
                        <div className="tour-tooltip__progress-bar">
                            <div
                                className="tour-tooltip__progress-fill"
                                style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="tour-tooltip__content">
                    <p id="tour-description" className="tour-tooltip__description">
                        {step.description}
                    </p>
                    {step.content && <div className="tour-tooltip__extra-content">{step.content}</div>}
                </div>

                <div className="tour-tooltip__actions">
                    {step.allowSkip !== false && (
                        <Button variant="secondary" size="sm" onClick={onSkip} className="tour-tooltip__skip">
                            Skip Tour
                        </Button>
                    )}

                    <div className="tour-tooltip__navigation">
                        {showPrevious && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onPrevious}
                                className="tour-tooltip__previous">
                                Previous
                            </Button>
                        )}

                        <Button
                            variant="primary"
                            size="sm"
                            onClick={isLastStep ? onComplete : onNext}
                            className="tour-tooltip__next">
                            {isLastStep ? "Finish" : "Next"}
                        </Button>
                    </div>
                </div>

                {/* Arrow */}
                <div className={cn("tour-tooltip__arrow", `tour-tooltip__arrow--${step.placement}`)} />
            </div>
        </>
    );
}

/**
 * TourGuide component provides interactive guided tours for user onboarding
 */
export const TourGuide: React.FC<TourGuideProps> = ({ className, onTourComplete, onTourSkip }) => {
    const [currentStep, setCurrentStep] = React.useState<OnboardingStep | null>(null);
    const [stepIndex, setStepIndex] = React.useState(0);
    const [totalSteps, setTotalSteps] = React.useState(0);
    const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(null);
    const managerRef = useRef<OnboardingManager | null>(null);

    useEffect(() => {
        managerRef.current = OnboardingManager.getInstance();

        const handleOnboardingEvent = (event: OnboardingEvent) => {
            switch (event.type) {
                case "step-shown":
                    setCurrentStep(event.step);
                    setStepIndex(event.stepIndex);

                    // Get tour progress
                    const manager = managerRef.current;
                    if (manager) {
                        const progress = manager.getTourProgress();
                        setTotalSteps(progress.total);
                    }

                    // Find target element
                    const element = document.querySelector(event.step.target) as HTMLElement;
                    setTargetElement(element);

                    // Scroll target into view
                    if (element) {
                        element.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                            inline: "center",
                        });

                        // Add highlight class
                        element.classList.add("tour-target-highlight");
                    }
                    break;

                case "tour-ended":
                case "tour-completed":
                case "tour-skipped":
                    setCurrentStep(null);
                    setTargetElement(null);

                    // Remove highlight from all elements
                    document.querySelectorAll(".tour-target-highlight").forEach((el) => {
                        el.classList.remove("tour-target-highlight");
                    });

                    if (event.type === "tour-completed" && onTourComplete) {
                        onTourComplete(event.tourId);
                    } else if (event.type === "tour-skipped" && onTourSkip) {
                        onTourSkip(event.tourId);
                    }
                    break;
            }
        };

        if (managerRef.current) {
            managerRef.current.addListener(handleOnboardingEvent);
        }

        return () => {
            if (managerRef.current) {
                managerRef.current.removeListener(handleOnboardingEvent);
            }
        };
    }, [onTourComplete, onTourSkip]);

    const handleNext = () => {
        managerRef.current?.nextStep();
    };

    const handlePrevious = () => {
        managerRef.current?.previousStep();
    };

    const handleSkip = () => {
        managerRef.current?.skipTour();
    };

    const handleComplete = () => {
        managerRef.current?.completeTour();
    };

    if (!currentStep) {
        return null;
    }

    return (
        <div className={cn("TourGuide", className)}>
            <TourStep
                step={currentStep}
                stepIndex={stepIndex}
                totalSteps={totalSteps}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onSkip={handleSkip}
                onComplete={handleComplete}
                targetElement={targetElement}
            />
        </div>
    );
};
