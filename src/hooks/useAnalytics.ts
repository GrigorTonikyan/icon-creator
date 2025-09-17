import { useEffect, useRef, useCallback } from "react";
import {
    analytics,
    trackFeatureUsage,
    trackUserInteraction,
    trackTiming,
    measurePerformance,
} from "../utils/analytics";

/**
 * React hook for analytics integration
 * Provides easy-to-use analytics functions for React components
 */
export function useAnalytics() {
    const componentMountTime = useRef<number>(Date.now());

    // Track component mount/unmount
    useEffect(() => {
        const mountTime = componentMountTime.current;

        return () => {
            // Track component lifetime when unmounting
            const lifetime = Date.now() - mountTime;
            analytics.trackPerformance("component_lifetime", lifetime);
        };
    }, []);

    // Track feature usage
    const trackFeature = useCallback((feature: string, action: string, properties?: Record<string, any>) => {
        trackFeatureUsage(feature, action, properties);
    }, []);

    // Track user interactions
    const trackInteraction = useCallback((element: string, action: string, properties?: Record<string, any>) => {
        trackUserInteraction(element, action, properties);
    }, []);

    // Track timing events
    const trackTime = useCallback((name: string, startTime: number, endTime?: number) => {
        trackTiming(name, startTime, endTime);
    }, []);

    // Track page/component view
    const trackView = useCallback((viewName: string, properties?: Record<string, any>) => {
        analytics.trackEvent("page_view", "navigation", {
            view: viewName,
            ...properties,
        });
    }, []);

    // Track errors
    const trackError = useCallback((error: Error | string, context?: Record<string, any>) => {
        analytics.trackError(error, context);
    }, []);

    // Performance measurement wrapper
    const measureFunc = useCallback(<T>(name: string, fn: () => T): T => {
        return measurePerformance(name, fn);
    }, []);

    return {
        trackFeature,
        trackInteraction,
        trackTime,
        trackView,
        trackError,
        measureFunc,
        analytics,
    };
}

/**
 * Hook for tracking component performance
 * Automatically tracks render time and provides manual measurement functions
 */
export function usePerformanceTracking(componentName: string) {
    const renderStartTime = useRef<number>(performance.now());
    const isFirstRender = useRef<boolean>(true);

    useEffect(() => {
        if (isFirstRender.current) {
            const renderTime = performance.now() - renderStartTime.current;
            analytics.trackPerformance(`${componentName}_initial_render`, renderTime);
            isFirstRender.current = false;
        } else {
            const renderTime = performance.now() - renderStartTime.current;
            analytics.trackPerformance(`${componentName}_rerender`, renderTime);
        }

        // Reset for next render
        renderStartTime.current = performance.now();
    });

    const measureOperation = useCallback(
        (operationName: string, operation: () => any) => {
            return measurePerformance(`${componentName}_${operationName}`, operation);
        },
        [componentName]
    );

    const measureAsyncOperation = useCallback(
        async (operationName: string, operation: () => Promise<any>) => {
            const start = performance.now();
            try {
                const result = await operation();
                const end = performance.now();
                analytics.trackPerformance(`${componentName}_${operationName}`, end - start);
                return result;
            } catch (error) {
                const end = performance.now();
                analytics.trackPerformance(`${componentName}_${operationName}`, end - start);
                analytics.trackError(error instanceof Error ? error : new Error(String(error)), {
                    component: componentName,
                    operation: operationName,
                });
                throw error;
            }
        },
        [componentName]
    );

    return {
        measureOperation,
        measureAsyncOperation,
    };
}

/**
 * Hook for tracking user engagement
 * Tracks time spent on component, focus/blur events, and interactions
 */
export function useEngagementTracking(componentName: string) {
    const { trackInteraction } = useAnalytics();
    const engagementStartTime = useRef<number>(Date.now());
    const isVisible = useRef<boolean>(true);
    const interactionCount = useRef<number>(0);

    useEffect(() => {
        const startTime = engagementStartTime.current;

        // Track visibility changes
        const handleVisibilityChange = () => {
            if (document.hidden && isVisible.current) {
                // Component became hidden
                const engagementTime = Date.now() - startTime;
                analytics.trackPerformance(`${componentName}_engagement_time`, engagementTime);
                trackInteraction(componentName, "visibility_hidden", {
                    engagementTime,
                    interactions: interactionCount.current,
                });
                isVisible.current = false;
            } else if (!document.hidden && !isVisible.current) {
                // Component became visible again
                trackInteraction(componentName, "visibility_visible");
                engagementStartTime.current = Date.now();
                isVisible.current = true;
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);

            // Track final engagement time
            if (isVisible.current) {
                const totalEngagementTime = Date.now() - startTime;
                analytics.trackPerformance(`${componentName}_total_engagement`, totalEngagementTime);
                trackInteraction(componentName, "component_unmount", {
                    totalEngagement: totalEngagementTime,
                    totalInteractions: interactionCount.current,
                });
            }
        };
    }, [componentName, trackInteraction]);

    const trackEngagement = useCallback(
        (action: string, properties?: Record<string, any>) => {
            interactionCount.current++;
            trackInteraction(componentName, action, {
                interactionNumber: interactionCount.current,
                ...properties,
            });
        },
        [componentName, trackInteraction]
    );

    return {
        trackEngagement,
    };
}

/**
 * Hook for tracking form interactions
 * Provides specialized tracking for form fields and submissions
 */
export function useFormTracking(formName: string) {
    const { trackInteraction } = useAnalytics();
    const formStartTime = useRef<number | null>(null);
    const fieldInteractions = useRef<Record<string, number>>({});

    const trackFormStart = useCallback(() => {
        formStartTime.current = Date.now();
        trackInteraction(formName, "form_start");
    }, [formName, trackInteraction]);

    const trackFieldInteraction = useCallback(
        (fieldName: string, action: string, value?: any) => {
            if (!fieldInteractions.current[fieldName]) {
                fieldInteractions.current[fieldName] = 0;
            }
            fieldInteractions.current[fieldName]++;

            trackInteraction(formName, `field_${action}`, {
                field: fieldName,
                interactionCount: fieldInteractions.current[fieldName],
                hasValue: value !== undefined && value !== null && value !== "",
            });
        },
        [formName, trackInteraction]
    );

    const trackFormSubmit = useCallback(
        (success: boolean, errors?: string[]) => {
            const completionTime = formStartTime.current ? Date.now() - formStartTime.current : 0;

            trackInteraction(formName, "form_submit", {
                success,
                completionTime,
                fieldInteractions: { ...fieldInteractions.current },
                errorCount: errors?.length || 0,
                errors: errors?.slice(0, 5), // Limit to first 5 errors for privacy
            });

            // Reset form tracking
            formStartTime.current = null;
            fieldInteractions.current = {};
        },
        [formName, trackInteraction]
    );

    const trackFormAbandon = useCallback(
        (reason?: string) => {
            const partialTime = formStartTime.current ? Date.now() - formStartTime.current : 0;

            trackInteraction(formName, "form_abandon", {
                partialTime,
                fieldInteractions: { ...fieldInteractions.current },
                reason,
            });

            // Reset form tracking
            formStartTime.current = null;
            fieldInteractions.current = {};
        },
        [formName, trackInteraction]
    );

    return {
        trackFormStart,
        trackFieldInteraction,
        trackFormSubmit,
        trackFormAbandon,
    };
}

/**
 * Hook for tracking A/B tests or feature flags
 * Provides consistent tracking for experiments
 */
export function useExperimentTracking() {
    const { trackFeature } = useAnalytics();

    const trackExperiment = useCallback(
        (experimentName: string, variant: string, properties?: Record<string, any>) => {
            trackFeature("experiment", "variant_shown", {
                experiment: experimentName,
                variant,
                ...properties,
            });
        },
        [trackFeature]
    );

    const trackExperimentAction = useCallback(
        (experimentName: string, variant: string, action: string, properties?: Record<string, any>) => {
            trackFeature("experiment", "variant_action", {
                experiment: experimentName,
                variant,
                action,
                ...properties,
            });
        },
        [trackFeature]
    );

    return {
        trackExperiment,
        trackExperimentAction,
    };
}

export default useAnalytics;
