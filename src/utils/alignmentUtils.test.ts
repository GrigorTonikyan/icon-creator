import { describe, test, expect } from 'vitest';import { describe, test, expect } from 'vitest';import { describe, test, expect } from 'vitest';

import type { DrawableObject } from '../types/editor';

import { getObjectBounds, alignLeft, alignTop } from './alignmentUtils';import type { DrawableObject } from '../types/editor';import type { DrawableObject } from '../types/editor';



describe('Alignment Utilities', () => {import { import { getObjectBounds, alignLeft, alignTop } from './alignmentUtils';

    const createRectangle = (x: number, y: number, width: number, height: number): DrawableObject => ({

        id: Math.random().toString(),    getObjectBounds, 

        type: 'rectangle',

        x,    alignLeft, describe('Alignment Utilities', () => {

        y,

        width,    alignTop, 

        height,

        opacity: 1,    alignRight,   test('should calculate bounds for rectangle', () => {

        rotation: 0,

        scaleX: 1,    alignBottom, 

        scaleY: 1,

        skewX: 0,    alignCenterHorizontal,     const rect: DrawableObject = {

        skewY: 0,

        visible: true,    alignCenterVertical,

        locked: false,

        selected: false,    distributeHorizontally,      id: '1',

        layerId: 'default'

    });    distributeVertically



    describe('getObjectBounds', () => {} from './alignmentUtils';      type: 'rectangle',describe('Alignment Utilities', () => {import type { DrawableObject } from '../types/editor';import type { CanvasObject } from '../types/editor';

        test('should calculate bounds for rectangle', () => {

            const rect = createRectangle(10, 20, 30, 40);

            const bounds = getObjectBounds(rect);

describe('Alignment Utilities', () => {      x: 10,

            expect(bounds).toEqual({

                x: 10,    const createRectangle = (x: number, y: number, width: number, height: number): DrawableObject => ({

                y: 20,

                width: 30,        id: Math.random().toString(),      y: 20,  test('should calculate bounds for rectangle', () => {

                height: 40

            });        type: 'rectangle',

        });

    });        x,      width: 50,



    describe('alignLeft', () => {        y,

        test('should align objects to the leftmost position', () => {

            const objects = [        width,      height: 30,    const rect: DrawableObject = {

                createRectangle(10, 20, 30, 40),

                createRectangle(50, 60, 20, 30),        height,

                createRectangle(5, 80, 25, 35)

            ];        opacity: 1,      fill: '#000000',



            const aligned = alignLeft(objects);        rotation: 0,



            aligned.forEach(obj => {        scaleX: 1,      stroke: '#ffffff',      id: '1',

                expect(obj.x).toBe(5); // leftmost x position

            });        scaleY: 1,

        });

    });        skewX: 0,      strokeWidth: 1,



    describe('alignTop', () => {        skewY: 0,

        test('should align objects to the topmost position', () => {

            const objects = [        visible: true,      opacity: 1,      type: 'rectangle',describe('Alignment Utilities', () => {import { getObjectBounds, alignLeft, alignTop } from "./alignmentUtils";import type { CanvasObject } from '../types/editor';import type { CanvasObject } from "../types/editor";

                createRectangle(10, 20, 30, 40),

                createRectangle(50, 5, 20, 30),        locked: false,

                createRectangle(80, 15, 25, 35)

            ];        selected: false,      rotation: 0,



            const aligned = alignTop(objects);        layerId: 'default'



            aligned.forEach(obj => {    });      scaleX: 1,      x: 10,

                expect(obj.y).toBe(5); // topmost y position

            });

        });

    });    const createCircle = (x: number, y: number, radius: number): DrawableObject => ({      scaleY: 1,

});
        id: Math.random().toString(),

        type: 'circle',      skewX: 0,      y: 20,  test('should calculate bounds for rectangle', () => {

        x,

        y,      skewY: 0,

        radius,

        opacity: 1,      visible: true,      width: 30,

        rotation: 0,

        scaleX: 1,      locked: false,

        scaleY: 1,

        skewX: 0,      selected: false,      height: 40,    const rect: DrawableObject = {

        skewY: 0,

        visible: true,      layer: 0,

        locked: false,

        selected: false,      z: 0      rotation: 0,

        layerId: 'default'

    });    };



    describe('getObjectBounds', () => {      fill: '#000000',      id: '1',

        test('should calculate bounds for rectangle', () => {

            const rect = createRectangle(10, 20, 30, 40);    const bounds = getObjectBounds(rect);

            const bounds = getObjectBounds(rect);

          opacity: 1

            expect(bounds).toEqual({

                x: 10,    expect(bounds).toEqual({

                y: 20,

                width: 30,      x: 10,    };      type: 'rectangle',describe("Alignment Utilities", () => {import {import {

                height: 40

            });      y: 20,

        });

      width: 50,

        test('should calculate bounds for circle', () => {

            const circle = createCircle(50, 60, 25);      height: 30

            const bounds = getObjectBounds(circle);

    });    const bounds = getObjectBounds(rect);      x: 10,

            expect(bounds).toEqual({

                x: 25, // center.x - radius  });

                y: 35, // center.y - radius

                width: 50, // diameter});    expect(bounds).toEqual({

                height: 50 // diameter

            });      x: 10,      y: 20,    // Simple mock objects

        });

      y: 20,

        test('should handle path objects', () => {

            const path: DrawableObject = {      width: 30,      width: 30,

                id: '1',

                type: 'path',      height: 40

                x: 0,

                y: 0,    });      height: 40,    const rect1: CanvasObject = {    getObjectBounds,    getObjectBounds,

                d: 'M 10 20 L 50 60',

                opacity: 1,  });

                rotation: 0,

                scaleX: 1,});      rotation: 0,

                scaleY: 1,

                skewX: 0,      fill: '#000000',        id: "rect1",

                skewY: 0,

                visible: true,      opacity: 1

                locked: false,

                selected: false,    };        type: "rectangle",    getSelectionBounds,    getSelectionBounds,

                layerId: 'default'

            };



            const bounds = getObjectBounds(path);    const bounds = getObjectBounds(rect);        name: "Rectangle 1",

            

            expect(bounds).toEqual({    expect(bounds).toEqual({

                x: 10,

                y: 20,      x: 10,        transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },    alignLeft,    alignLeft,

                width: 40,

                height: 40      y: 20,

            });

        });      width: 30,        visible: true,



        test('should handle text objects', () => {      height: 40

            const text: DrawableObject = {

                id: '1',    });        locked: false,    alignRight,    alignRight,

                type: 'text',

                x: 100,  });

                y: 200,

                text: 'Hello World',        opacity: 1,

                fontSize: 16,

                fontFamily: 'Arial',  test('should align objects to left edge', () => {

                opacity: 1,

                rotation: 0,    const objects: DrawableObject[] = [        zIndex: 1,    alignTop,    alignTop,

                scaleX: 1,

                scaleY: 1,      {

                skewX: 0,

                skewY: 0,        id: '1',        layerId: "layer1",

                visible: true,

                locked: false,        type: 'rectangle',

                selected: false,

                layerId: 'default'        x: 100,        width: 50,    alignBottom,    alignBottom,

            };

        y: 20,

            const bounds = getObjectBounds(text);

                    width: 30,        height: 30,

            expect(bounds.x).toBe(100);

            expect(bounds.y).toBe(200);        height: 40,

            expect(bounds.width).toBeGreaterThan(0);

            expect(bounds.height).toBeGreaterThan(0);        rotation: 0,        style: { fill: "#ff0000" }    alignCenterHorizontal,    alignCenterHorizontal,

        });

    });        fill: '#000000',



    describe('alignLeft', () => {        opacity: 1    };

        test('should align objects to the leftmost position', () => {

            const objects = [      },

                createRectangle(10, 20, 30, 40),

                createRectangle(50, 60, 20, 30),      {    alignCenterVertical,    alignCenterVertical,

                createRectangle(5, 80, 25, 35)

            ];        id: '2',



            const aligned = alignLeft(objects);        type: 'rectangle',    const rect2: CanvasObject = {



            aligned.forEach(obj => {        x: 200,

                expect(obj.x).toBe(5); // leftmost x position

            });        y: 50,        id: "rect2",    distributeHorizontal,    distributeHorizontal,

        });

        width: 25,

        test('should handle empty array', () => {

            const aligned = alignLeft([]);        height: 35,        type: "rectangle",

            expect(aligned).toEqual([]);

        });        rotation: 0,



        test('should handle single object', () => {        fill: '#000000',        name: "Rectangle 2",    distributeVertical,    distributeVertical,

            const obj = createRectangle(10, 20, 30, 40);

            const aligned = alignLeft([obj]);        opacity: 1

            

            expect(aligned).toHaveLength(1);      }        transform: { x: 200, y: 150, rotation: 0, scaleX: 1, scaleY: 1 },

            expect(aligned[0].x).toBe(10);

        });    ];

    });

        visible: true,    type AlignmentOptions,    type AlignmentOptions,

    describe('alignTop', () => {

        test('should align objects to the topmost position', () => {    const aligned = alignLeft(objects);

            const objects = [

                createRectangle(10, 20, 30, 40),    expect(aligned[0].x).toBe(100);        locked: false,

                createRectangle(50, 5, 20, 30),

                createRectangle(80, 15, 25, 35)    expect(aligned[1].x).toBe(100);

            ];

  });        opacity: 1,    type DistributionOptions,    type DistributionOptions,

            const aligned = alignTop(objects);



            aligned.forEach(obj => {

                expect(obj.y).toBe(5); // topmost y position  test('should align objects to top edge', () => {        zIndex: 2,

            });

        });    const objects: DrawableObject[] = [

    });

      {        layerId: "layer1",} from "./alignmentUtils";} from "./alignmentUtils";

    describe('alignRight', () => {

        test('should align objects to the rightmost position', () => {        id: '1',

            const objects = [

                createRectangle(10, 20, 30, 40), // right edge at 40        type: 'rectangle',        width: 40,

                createRectangle(50, 60, 20, 30), // right edge at 70

                createRectangle(5, 80, 25, 35)   // right edge at 30        x: 100,

            ];

        y: 20,        height: 20,

            const aligned = alignRight(objects);

        width: 30,

            aligned.forEach(obj => {

                const bounds = getObjectBounds(obj);        height: 40,        style: { fill: "#00ff00" }

                expect(bounds.x + bounds.width).toBe(70); // rightmost edge

            });        rotation: 0,

        });

    });        fill: '#000000',    };describe("Alignment Utilities", () => {describe("Alignment Utilities", () => {



    describe('alignBottom', () => {        opacity: 1

        test('should align objects to the bottommost position', () => {

            const objects = [      },

                createRectangle(10, 20, 30, 40), // bottom edge at 60

                createRectangle(50, 5, 20, 30),  // bottom edge at 35      {

                createRectangle(80, 15, 25, 70)  // bottom edge at 85

            ];        id: '2',    const circle: CanvasObject = {    // Mock canvas objects for testing    // Mock canvas objects for testing



            const aligned = alignBottom(objects);        type: 'rectangle',



            aligned.forEach(obj => {        x: 200,        id: "circle1",

                const bounds = getObjectBounds(obj);

                expect(bounds.y + bounds.height).toBe(85); // bottommost edge        y: 50,

            });

        });        width: 25,        type: "circle",    const mockRect1: CanvasObject = {    const mockRect1: CanvasObject = {

    });

        height: 35,

    describe('alignCenterHorizontal', () => {

        test('should align objects to horizontal center', () => {        rotation: 0,        name: "Circle 1",

            const objects = [

                createRectangle(10, 20, 30, 40),        fill: '#000000',

                createRectangle(50, 60, 20, 30),

                createRectangle(5, 80, 40, 35)        opacity: 1        transform: { x: 300, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },        id: "rect1",        id: "rect1",

            ];

      }

            const aligned = alignCenterHorizontal(objects);

    ];        visible: true,

            // Calculate expected center

            const allBounds = objects.map(getObjectBounds);

            const minX = Math.min(...allBounds.map(b => b.x));

            const maxX = Math.max(...allBounds.map(b => b.x + b.width));    const aligned = alignTop(objects);        locked: false,        type: "rectangle",        type: "rectangle",

            const centerX = (minX + maxX) / 2;

    expect(aligned[0].y).toBe(20);

            aligned.forEach((obj, index) => {

                const bounds = getObjectBounds(obj);    expect(aligned[1].y).toBe(20);        opacity: 1,

                const objCenterX = bounds.x + bounds.width / 2;

                expect(objCenterX).toBeCloseTo(centerX, 2);  });

            });

        });        zIndex: 3,        name: "Rectangle 1",        name: "Rectangle 1",

    });

  test('should handle empty array', () => {

    describe('alignCenterVertical', () => {

        test('should align objects to vertical center', () => {    const result = alignLeft([]);        layerId: "layer1",

            const objects = [

                createRectangle(10, 20, 30, 40),    expect(result).toEqual([]);

                createRectangle(50, 60, 20, 30),

                createRectangle(80, 5, 25, 70)  });        radius: 25,        transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },        transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },

            ];



            const aligned = alignCenterVertical(objects);

  test('should handle single object', () => {        style: { fill: "#0000ff" }

            // Calculate expected center

            const allBounds = objects.map(getObjectBounds);    const objects: DrawableObject[] = [

            const minY = Math.min(...allBounds.map(b => b.y));

            const maxY = Math.max(...allBounds.map(b => b.y + b.height));      {    };        visible: true,        visible: true,

            const centerY = (minY + maxY) / 2;

        id: '1',

            aligned.forEach((obj, index) => {

                const bounds = getObjectBounds(obj);        type: 'rectangle',

                const objCenterY = bounds.y + bounds.height / 2;

                expect(objCenterY).toBeCloseTo(centerY, 2);        x: 100,

            });

        });        y: 20,    test("should calculate bounds for rectangle", () => {        locked: false,        locked: false,

    });

        width: 30,

    describe('distributeHorizontally', () => {

        test('should distribute objects evenly horizontally', () => {        height: 40,        const bounds = getObjectBounds(rect1);

            const objects = [

                createRectangle(10, 20, 20, 30),        rotation: 0,

                createRectangle(100, 20, 20, 30),

                createRectangle(200, 20, 20, 30)        fill: '#000000',        expect(bounds.x).toBe(100);        opacity: 1,        opacity: 1,

            ];

        opacity: 1

            const distributed = distributeHorizontally(objects);

      }        expect(bounds.y).toBe(100);

            // Objects should be evenly spaced

            expect(distributed).toHaveLength(3);    ];

            

            // First and last objects should maintain their positions        expect(bounds.width).toBe(50);        zIndex: 1,        zIndex: 1,

            expect(distributed[0].x).toBe(10);

            expect(distributed[2].x).toBe(200);    const aligned = alignLeft(objects);

            

            // Middle object should be centered    expect(aligned[0].x).toBe(100);        expect(bounds.height).toBe(30);

            const expectedMiddleX = (10 + 200) / 2;

            expect(distributed[1].x).toBeCloseTo(expectedMiddleX, 2);  });

        });

});    });        layerId: "layer1",        layerId: "layer1",

        test('should handle fewer than 3 objects', () => {

            const objects = [

                createRectangle(10, 20, 20, 30),

                createRectangle(100, 20, 20, 30)    test("should calculate bounds for circle", () => {        width: 50,        width: 50,

            ];

        const bounds = getObjectBounds(circle);

            const distributed = distributeHorizontally(objects);

            expect(distributed).toEqual(objects); // No change        expect(bounds.x).toBe(275); // 300 - 25        height: 30,        height: 30,

        });

    });        expect(bounds.y).toBe(175); // 200 - 25



    describe('distributeVertically', () => {        expect(bounds.width).toBe(50); // radius * 2        style: { fill: "#ff0000" }        style: { fill: "#ff0000" },

        test('should distribute objects evenly vertically', () => {

            const objects = [        expect(bounds.height).toBe(50); // radius * 2

                createRectangle(20, 10, 30, 20),

                createRectangle(20, 100, 30, 20),    });    };    };

                createRectangle(20, 200, 30, 20)

            ];



            const distributed = distributeVertically(objects);    test("should align objects to left", () => {



            // Objects should be evenly spaced        const objects = [rect1, rect2];

            expect(distributed).toHaveLength(3);

                    const aligned = alignLeft(objects);    const mockRect2: CanvasObject = {    const mockRect2: CanvasObject = {

            // First and last objects should maintain their positions

            expect(distributed[0].y).toBe(10);        

            expect(distributed[2].y).toBe(200);

                    expect(aligned.length).toBe(2);        id: "rect2",        id: "rect2",

            // Middle object should be centered

            const expectedMiddleY = (10 + 200) / 2;        

            expect(distributed[1].y).toBeCloseTo(expectedMiddleY, 2);

        });        // Check that both objects have the same left bound        type: "rectangle",        type: "rectangle",

    });

        const bounds1 = getObjectBounds(aligned[0]!);

    describe('edge cases', () => {

        test('should handle objects with zero dimensions', () => {        const bounds2 = getObjectBounds(aligned[1]!);        name: "Rectangle 2",        name: "Rectangle 2",

            const obj = createRectangle(10, 20, 0, 0);

            const bounds = getObjectBounds(obj);        expect(bounds1.x).toBe(bounds2.x);

            

            expect(bounds).toEqual({    });        transform: { x: 200, y: 150, rotation: 0, scaleX: 1, scaleY: 1 },        transform: { x: 200, y: 150, rotation: 0, scaleX: 1, scaleY: 1 },

                x: 10,

                y: 20,

                width: 0,

                height: 0    test("should align objects to top", () => {        visible: true,        visible: true,

            });

        });        const objects = [rect1, rect2];



        test('should handle negative positions', () => {        const aligned = alignTop(objects);        locked: false,        locked: false,

            const obj = createRectangle(-10, -20, 30, 40);

            const bounds = getObjectBounds(obj);        

            

            expect(bounds).toEqual({        expect(aligned.length).toBe(2);        opacity: 1,        opacity: 1,

                x: -10,

                y: -20,        

                width: 30,

                height: 40        // Check that both objects have the same top bound        zIndex: 2,        zIndex: 2,

            });

        });        const bounds1 = getObjectBounds(aligned[0]!);



        test('should handle rotated objects', () => {        const bounds2 = getObjectBounds(aligned[1]!);        layerId: "layer1",        layerId: "layer1",

            const obj = createRectangle(10, 20, 30, 40);

            obj.rotation = 45;        expect(bounds1.y).toBe(bounds2.y);

            

            const bounds = getObjectBounds(obj);    });        width: 40,        width: 40,

            

            // For rotated objects, bounds should encompass the rotated shape

            expect(bounds.x).toBeLessThanOrEqual(10);

            expect(bounds.y).toBeLessThanOrEqual(20);    test("should handle empty array", () => {        height: 20,        height: 20,

            expect(bounds.width).toBeGreaterThanOrEqual(30);

            expect(bounds.height).toBeGreaterThanOrEqual(40);        const aligned = alignLeft([]);

        });

        expect(aligned).toEqual([]);        style: { fill: "#00ff00" }        style: { fill: "#00ff00" },

        test('should handle scaled objects', () => {

            const obj = createRectangle(10, 20, 30, 40);    });

            obj.scaleX = 2;

            obj.scaleY = 1.5;    };    };

            

            const bounds = getObjectBounds(obj);    test("should handle single object", () => {

            

            expect(bounds.width).toBe(60); // 30 * 2        const aligned = alignLeft([rect1]);

            expect(bounds.height).toBe(60); // 40 * 1.5

        });        expect(aligned.length).toBe(1);

    });

});        expect(aligned[0]).toEqual(rect1);    const mockCircle: CanvasObject = {    const mockCircle: CanvasObject = {

    });

});        id: "circle1",        id: "circle1",

        type: "circle",        type: "circle",

        name: "Circle 1",        name: "Circle 1",

        transform: { x: 300, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },        transform: { x: 300, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },

        visible: true,        visible: true,

        locked: false,        locked: false,

        opacity: 1,        opacity: 1,

        zIndex: 3,        zIndex: 3,

        layerId: "layer1",        layerId: "layer1",

        radius: 25,        radius: 25,

        style: { fill: "#0000ff" }        style: { fill: "#0000ff" },

    };    };



    const mockObjects = [mockRect1, mockRect2, mockCircle];    const mockObjects = [mockRect1, mockRect2, mockCircle];



    describe("Object Bounds Calculation", () => {    describe("Object Bounds Calculation", () => {

        test("should calculate bounds for rectangle", () => {        test("should calculate bounds for rectangle", () => {

            const bounds = getObjectBounds(mockRect1);            const bounds = getObjectBounds(mockRect1);



            expect(bounds.x).toBe(100);            expect(bounds.x).toBe(100);

            expect(bounds.y).toBe(100);            expect(bounds.y).toBe(100);

            expect(bounds.width).toBe(50);            expect(bounds.width).toBe(50);

            expect(bounds.height).toBe(30);            expect(bounds.height).toBe(30);

        });        });



        test("should calculate bounds for circle", () => {        test("should calculate bounds for circle", () => {

            const bounds = getObjectBounds(mockCircle);            const bounds = getObjectBounds(mockCircle);



            expect(bounds.x).toBe(275); // 300 - 25 (radius)            expect(bounds.x).toBe(275); // 300 - 25 (radius)

            expect(bounds.y).toBe(175); // 200 - 25 (radius)            expect(bounds.y).toBe(175); // 200 - 25 (radius)

            expect(bounds.width).toBe(50); // radius * 2            expect(bounds.width).toBe(50); // radius * 2

            expect(bounds.height).toBe(50); // radius * 2            expect(bounds.height).toBe(50); // radius * 2

        });        });

    });

        test("should handle different object types", () => {

    describe("Selection Bounds", () => {            const rectBounds = getObjectBounds(mockRect1);

        test("should calculate bounds for multiple objects", () => {            const circleBounds = getObjectBounds(mockCircle);

            const bounds = getSelectionBounds(mockObjects);

            expect(rectBounds).toBeDefined();

            expect(bounds.x).toBe(100); // Leftmost object            expect(circleBounds).toBeDefined();

            expect(bounds.y).toBe(100); // Topmost object            expect(rectBounds.width).toBeGreaterThan(0);

            expect(bounds.width).toBeGreaterThan(0);            expect(circleBounds.width).toBeGreaterThan(0);

            expect(bounds.height).toBeGreaterThan(0);        });

        });    });



        test("should handle empty array", () => {    describe("Selection Bounds", () => {

            const bounds = getSelectionBounds([]);        test("should calculate bounds for multiple objects", () => {

            const bounds = getSelectionBounds(mockObjects);

            expect(bounds.x).toBe(0);

            expect(bounds.y).toBe(0);            expect(bounds.x).toBe(100); // Leftmost object

            expect(bounds.width).toBe(0);            expect(bounds.y).toBe(100); // Topmost object

            expect(bounds.height).toBe(0);            expect(bounds.width).toBeGreaterThan(0);

        });            expect(bounds.height).toBeGreaterThan(0);

    });

            // Should encompass all objects

    describe("Horizontal Alignment", () => {            expect(bounds.x + bounds.width).toBeGreaterThanOrEqual(325); // Circle's right edge

        test("should align objects to left edge", () => {            expect(bounds.y + bounds.height).toBeGreaterThanOrEqual(225); // Circle's bottom edge

            const aligned = alignLeft(mockObjects);        });



            expect(aligned.length).toBe(3);        test("should handle single object", () => {

                        const bounds = getSelectionBounds([mockRect1]);

            // All objects should have same left bounds

            const leftEdges = aligned.map(obj => getObjectBounds(obj).x);            const objBounds = getObjectBounds(mockRect1);

            const leftmost = leftEdges[0]!;            expect(bounds.x).toBe(objBounds.x);

            expect(leftEdges.every(x => x === leftmost)).toBe(true);            expect(bounds.y).toBe(objBounds.y);

        });            expect(bounds.width).toBe(objBounds.width);

            expect(bounds.height).toBe(objBounds.height);

        test("should align objects to right edge", () => {        });

            const aligned = alignRight(mockObjects);

        test("should handle empty array", () => {

            expect(aligned.length).toBe(3);            const bounds = getSelectionBounds([]);

            

            // All objects should have same right bounds            expect(bounds.x).toBe(0);

            const rightEdges = aligned.map(obj => {            expect(bounds.y).toBe(0);

                const bounds = getObjectBounds(obj);            expect(bounds.width).toBe(0);

                return bounds.x + bounds.width;            expect(bounds.height).toBe(0);

            });        });

            const rightmost = rightEdges[0]!;    });

            expect(rightEdges.every(edge => Math.abs(edge - rightmost) < 0.01)).toBe(true);

        });    describe("Horizontal Alignment", () => {

        test("should align objects to left edge", () => {

        test("should align objects to horizontal center", () => {            const aligned = alignLeft(mockObjects);

            const aligned = alignCenterHorizontal(mockObjects);

            expect(aligned.length).toBe(3);

            expect(aligned.length).toBe(3);

                        // All objects should have same left edge (bounds x position)

            // All objects should have same center X            const leftEdges = aligned.map((obj) => getObjectBounds(obj).x);

            const centerXs = aligned.map(obj => {            const expectedLeft = Math.min(...mockObjects.map((obj) => getObjectBounds(obj).x));

                const bounds = getObjectBounds(obj);            expect(leftEdges.every((x) => x === expectedLeft)).toBe(true);

                return bounds.x + bounds.width / 2;        });

            });

            const centerX = centerXs[0]!;        test("should align objects to right edge", () => {

            expect(centerXs.every(x => Math.abs(x - centerX) < 0.01)).toBe(true);            const aligned = alignRight(mockObjects);

        });

    });            expect(aligned.length).toBe(3);



    describe("Vertical Alignment", () => {            // All objects should align their right edges

        test("should align objects to top edge", () => {            const rightEdges = aligned.map((obj) => {

            const aligned = alignTop(mockObjects);                const bounds = getObjectBounds(obj);

                return bounds.x + bounds.width;

            expect(aligned.length).toBe(3);            });

            

            // All objects should have same top bounds            // All right edges should be the same

            const topEdges = aligned.map(obj => getObjectBounds(obj).y);            const firstRightEdge = rightEdges[0];

            const topmost = topEdges[0]!;            expect(rightEdges.every((edge) => Math.abs(edge - firstRightEdge) < 0.01)).toBe(true);

            expect(topEdges.every(y => y === topmost)).toBe(true);        });

        });

        test("should align objects to horizontal center", () => {

        test("should align objects to bottom edge", () => {            const aligned = alignCenterHorizontal(mockObjects);

            const aligned = alignBottom(mockObjects);

            expect(aligned.length).toBe(3);

            expect(aligned.length).toBe(3);

                        // All objects should have same center X coordinate

            // All objects should have same bottom bounds            const centerXs = aligned.map((obj) => {

            const bottomEdges = aligned.map(obj => {                const bounds = getObjectBounds(obj);

                const bounds = getObjectBounds(obj);                return bounds.x + bounds.width / 2;

                return bounds.y + bounds.height;            });

            });            const firstCenterX = centerXs[0];

            const bottommost = bottomEdges[0]!;            expect(centerXs.every((x) => Math.abs(x - firstCenterX) < 0.01)).toBe(true);

            expect(bottomEdges.every(edge => Math.abs(edge - bottommost) < 0.01)).toBe(true);        });

        });

        test("should respect canvas alignment options", () => {

        test("should align objects to vertical center", () => {            const options: AlignmentOptions = {

            const aligned = alignCenterVertical(mockObjects);                alignToCanvas: true,

                canvasWidth: 800,

            expect(aligned.length).toBe(3);            };

            

            // All objects should have same center Y            const aligned = alignRight(mockObjects, options);

            const centerYs = aligned.map(obj => {

                const bounds = getObjectBounds(obj);            expect(aligned.length).toBe(3);

                return bounds.y + bounds.height / 2;

            });            // All objects should align to right edge of canvas

            const centerY = centerYs[0]!;            const rightEdges = aligned.map((obj) => {

            expect(centerYs.every(y => Math.abs(y - centerY) < 0.01)).toBe(true);                const bounds = getObjectBounds(obj);

        });                return bounds.x + bounds.width;

    });            });



    describe("Object Distribution", () => {            expect(rightEdges.every((edge) => edge === 800)).toBe(true);

        test("should distribute objects horizontally", () => {        });

            const distributed = distributeHorizontal(mockObjects);    });



            expect(distributed.length).toBe(3);    describe("Vertical Alignment", () => {

                    test("should align objects to top edge", () => {

            // Should return same objects if successful            const aligned = alignTop(mockObjects);

            expect(distributed.every((obj, i) => obj.id === mockObjects[i]!.id)).toBe(true);

        });            expect(aligned.length).toBe(3);

            

        test("should distribute objects vertically", () => {            // All objects should have same top edge (bounds y position)

            const distributed = distributeVertical(mockObjects);            const topEdges = aligned.map((obj) => getObjectBounds(obj).y);

            const expectedTop = Math.min(...mockObjects.map((obj) => getObjectBounds(obj).y));

            expect(distributed.length).toBe(3);            expect(topEdges.every((y) => y === expectedTop)).toBe(true);

                    });        test("should align objects to bottom edge", () => {

            // Should return same objects if successful            const aligned = alignBottom(mockObjects);

            expect(distributed.every((obj, i) => obj.id === mockObjects[i]!.id)).toBe(true);

        });            expect(aligned.length).toBe(3);

    });

            // All objects should align their bottom edges

    describe("Edge Cases", () => {            const bottomEdges = aligned.map((obj) => {

        test("should handle empty object array", () => {                const bounds = getObjectBounds(obj);

            const aligned = alignLeft([]);                return bounds.y + bounds.height;

            expect(aligned).toEqual([]);            });

        });

            // All bottom edges should be the same

        test("should handle single object", () => {            const firstBottomEdge = bottomEdges[0];

            const aligned = alignLeft([mockRect1]);            expect(bottomEdges.every((edge) => Math.abs(edge - firstBottomEdge) < 0.01)).toBe(true);

            expect(aligned.length).toBe(1);        });

        });

        test("should align objects to vertical center", () => {

        test("should handle distribution with insufficient objects", () => {            const aligned = alignCenterVertical(mockObjects);

            const distributed = distributeHorizontal([mockRect1]);

            expect(distributed.length).toBe(1);            expect(aligned.length).toBe(3);

        });

            // All objects should have same center Y coordinate

        test("should preserve object properties during alignment", () => {            const centerYs = aligned.map((obj) => {

            const aligned = alignLeft(mockObjects);                const bounds = getObjectBounds(obj);

                return bounds.y + bounds.height / 2;

            aligned.forEach((alignedObj, index) => {            });

                const originalObj = mockObjects[index]!;            const firstCenterY = centerYs[0];

                            expect(centerYs.every((y) => Math.abs(y - firstCenterY) < 0.01)).toBe(true);

                expect(alignedObj.id).toBe(originalObj.id);        });

                expect(alignedObj.type).toBe(originalObj.type);

                expect(alignedObj.visible).toBe(originalObj.visible);        test("should respect canvas alignment options", () => {

                expect(alignedObj.locked).toBe(originalObj.locked);            const options: AlignmentOptions = {

                expect(alignedObj.opacity).toBe(originalObj.opacity);                alignToCanvas: true,

            });                canvasHeight: 600,

        });            };

    });

            const aligned = alignBottom(mockObjects, options);

    describe("Alignment Options", () => {

        test("should respect canvas alignment options", () => {            expect(aligned.length).toBe(3);

            const options: AlignmentOptions = {

                alignToCanvas: true,            // All objects should align to bottom edge of canvas

                canvasWidth: 800            const bottomEdges = aligned.map((obj) => {

            };                const bounds = getObjectBounds(obj);

                return bounds.y + bounds.height;

            const aligned = alignRight(mockObjects, options);            });



            expect(aligned.length).toBe(3);            expect(bottomEdges.every((edge) => edge === 600)).toBe(true);

                    });

            // All objects should align to right edge of canvas    });

            const rightEdges = aligned.map(obj => {

                const bounds = getObjectBounds(obj);    describe("Object Distribution", () => {

                return bounds.x + bounds.width;        test("should distribute objects horizontally", () => {

            });            const distributed = distributeHorizontal(mockObjects);

            

            expect(rightEdges.every(edge => edge === 800)).toBe(true);            expect(distributed.length).toBe(3);

        });

            // Objects should be evenly spaced

        test("should respect target object alignment", () => {            const sortedObjects = distributed.sort((a, b) => a.transform.x - b.transform.x);

            const options: AlignmentOptions = {

                target: mockRect1            if (sortedObjects.length >= 3) {

            };                const centers = sortedObjects.map((obj) => {

                    const bounds = getObjectBounds(obj);

            const aligned = alignLeft([mockRect2, mockCircle], options);                    return bounds.x + bounds.width / 2;

                });

            expect(aligned.length).toBe(2);

                            const spacing1 = centers[1] - centers[0];

            // Both objects should align to mockRect1's left edge                const spacing2 = centers[2] - centers[1];

            const leftEdges = aligned.map(obj => getObjectBounds(obj).x);                expect(Math.abs(spacing1 - spacing2)).toBeLessThan(0.01);

            const targetLeft = getObjectBounds(mockRect1).x;            }

            expect(leftEdges.every(x => x === targetLeft)).toBe(true);        });

        });

    });        test("should distribute objects vertically", () => {

});            const distributed = distributeVertical(mockObjects);

            expect(distributed.length).toBe(3);

            // Objects should be evenly spaced
            const sortedObjects = distributed.sort((a, b) => a.transform.y - b.transform.y);

            if (sortedObjects.length >= 3) {
                const centers = sortedObjects.map((obj) => {
                    const bounds = getObjectBounds(obj);
                    return bounds.y + bounds.height / 2;
                });

                const spacing1 = centers[1] - centers[0];
                const spacing2 = centers[2] - centers[1];
                expect(Math.abs(spacing1 - spacing2)).toBeLessThan(0.01);
            }
        });

        test("should respect spacing options", () => {
            const options: DistributionOptions = {
                spacing: 50,
                useCenter: true,
            };

            const distributed = distributeHorizontal(mockObjects, options);

            expect(distributed.length).toBe(3);

            const sortedObjects = distributed.sort((a, b) => a.transform.x - b.transform.x);

            if (sortedObjects.length >= 3 && options.spacing) {
                const centers = sortedObjects.map((obj) => {
                    const bounds = getObjectBounds(obj);
                    return bounds.x + bounds.width / 2;
                });

                const spacing1 = centers[1] - centers[0];
                const spacing2 = centers[2] - centers[1];
                expect(Math.abs(spacing1 - options.spacing)).toBeLessThan(0.01);
                expect(Math.abs(spacing2 - options.spacing)).toBeLessThan(0.01);
            }
        });
    });

    describe("Edge Cases", () => {
        test("should handle empty object array", () => {
            const aligned = alignLeft([]);
            expect(aligned).toEqual([]);
        });

        test("should handle single object", () => {
            const aligned = alignLeft([mockRect1]);
            expect(aligned.length).toBe(1);
            expect(aligned[0]).toEqual(mockRect1); // Should be unchanged
        });

        test("should handle objects with same position", () => {
            const samePositionObjects = [mockRect1, { ...mockRect2, transform: { ...mockRect1.transform } }];

            const aligned = alignLeft(samePositionObjects);

            expect(aligned.length).toBe(2);
            // Both objects should maintain the same X position
            expect(aligned[0].transform.x).toBe(aligned[1].transform.x);
        });

        test("should handle distribution with insufficient objects", () => {
            const distributed = distributeHorizontal([mockRect1]);
            expect(distributed.length).toBe(1);
            expect(distributed[0]).toEqual(mockRect1); // Should be unchanged
        });

        test("should handle objects with zero dimensions", () => {
            const pointObject: CanvasObject = {
                ...mockRect1,
                id: "point",
                width: 0,
                height: 0,
            };

            const aligned = alignLeft([pointObject, mockRect2]);

            expect(aligned.length).toBe(2);
        });

        test("should preserve object properties during alignment", () => {
            const aligned = alignLeft(mockObjects);

            aligned.forEach((alignedObj, index) => {
                const originalObj = mockObjects[index];

                // All properties except transform should be preserved
                expect(alignedObj.id).toBe(originalObj.id);
                expect(alignedObj.type).toBe(originalObj.type);
                expect(alignedObj.visible).toBe(originalObj.visible);
                expect(alignedObj.locked).toBe(originalObj.locked);
                expect(alignedObj.opacity).toBe(originalObj.opacity);

                // Only x position should change
                expect(alignedObj.transform.y).toBe(originalObj.transform.y);
                expect(alignedObj.transform.rotation).toBe(originalObj.transform.rotation);
                expect(alignedObj.transform.scaleX).toBe(originalObj.transform.scaleX);
                expect(alignedObj.transform.scaleY).toBe(originalObj.transform.scaleY);
            });
        });

        test("should handle target object alignment", () => {
            const options: AlignmentOptions = {
                target: mockRect1,
            };

            const aligned = alignLeft([mockRect2, mockCircle], options);

            expect(aligned.length).toBe(2);

            // Both objects should align to mockRect1's left edge
            const leftEdges = aligned.map((obj) => obj.transform.x);
            expect(leftEdges.every((x) => x === mockRect1.transform.x)).toBe(true);
        });
    });
});
