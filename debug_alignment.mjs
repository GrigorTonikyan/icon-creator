import { alignLeft, getObjectBounds } from "./src/utils/alignmentUtils.js";

const mockRect1 = {
    id: "rect1",
    type: "rectangle",
    name: "Rectangle 1",
    transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
    visible: true,
    locked: false,
    opacity: 1,
    zIndex: 1,
    layerId: "layer1",
    width: 50,
    height: 30,
    style: { fill: "#ff0000" }
};

const mockRect2 = {
    id: "rect2",
    type: "rectangle",
    name: "Rectangle 2",
    transform: { x: 200, y: 150, rotation: 0, scaleX: 1, scaleY: 1 },
    visible: true,
    locked: false,
    opacity: 1,
    zIndex: 2,
    layerId: "layer1",
    width: 40,
    height: 20,
    style: { fill: "#00ff00" }
};

const objects = [mockRect1, mockRect2];
console.log("Original positions:", objects.map(o => o.transform.x));

const aligned = alignLeft(objects);
console.log("Aligned positions:", aligned.map(o => o.transform.x));
console.log("Bounds after alignment:", aligned.map(o => getObjectBounds(o).x));
