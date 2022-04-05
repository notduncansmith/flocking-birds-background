Object.defineProperty(exports, '__esModule', { value: true });

var jsxRuntime = require('react/jsx-runtime');
var react = require('react');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

var Zone;
(function (Zone) {
    Zone[Zone["TopLeft"] = 0] = "TopLeft";
    Zone[Zone["Top"] = 1] = "Top";
    Zone[Zone["TopRight"] = 2] = "TopRight";
    Zone[Zone["Left"] = 3] = "Left";
    Zone[Zone["Centre"] = 4] = "Centre";
    Zone[Zone["Right"] = 5] = "Right";
    Zone[Zone["BottomLeft"] = 6] = "BottomLeft";
    Zone[Zone["Bottom"] = 7] = "Bottom";
    Zone[Zone["BottomRight"] = 8] = "BottomRight";
})(Zone || (Zone = {}));

// Debug
var ENABLE_VISION_DEBUG = true;
// Boid behaviour
var ALIGNMENT_WITH_OTHERS_COUNT = 7;
var PROJECTION_SECTOR_COUNT = 360;
var SHADOW_SIZE = 20;
var COLLISION_LOOKAHEAD = 30;
var VISION_RANGE = 100;
var BOX_VISION_RANGE = 25;
var MOUSE_VISION_RANGE = 400;
var MAX_TURN_ANGLE = (Math.PI / 180.0) * 10;
var BOUNDARY_PADDING = 15;
var BOID_SPEED = 2.2;
// Animation
var TURN_ANIMATION_THRESHOLD_ANGLE = MAX_TURN_ANGLE * 0.3;
var ANIMATION_FRAME_HOLD = 8;
var MIN_TURN_FRAMES_FOR_ANIMATION_CHANGE = 5;
// Overall
var INITIAL_BOID_COUNT = 150;

// Add the occluded region caused from a bounding box to a boids vision list
var addOcclusionFromBoundingbox = function (position, box, vision) {
    var zone = getZone(position, box);
    // If the boid cannot see the box, there is no occlusion
    if (getDistanceToBox(box, position, zone) > BOX_VISION_RANGE)
        return undefined;
    // If a boid is inside a box, no occlusion is added
    if (zone === Zone.Centre)
        return undefined;
    var shadowCorners = getShadowCorners(box, zone);
    var angles = [];
    for (var _i = 0, shadowCorners_1 = shadowCorners; _i < shadowCorners_1.length; _i++) {
        var shadowCorner = shadowCorners_1[_i];
        var directionToBoid = shadowCorner.difference(position);
        angles.push(directionToBoid.getAngleFromPosX());
    }
    vision.addOccludedRegion(angles[0], angles[1]);
};
// Add the occluded region caused from another boid to a boids vision list
var addOcclusionFromBoid = function (position, boidPosition, boidDistance, vision) {
    var angleCovered = 2 * Math.atan2(1, 2 * boidDistance) * SHADOW_SIZE;
    var directionToBoid = boidPosition.difference(position);
    var angleToBoid = directionToBoid.getAngleFromPosX();
    vision.addOccludedRegion(angleToBoid - angleCovered * 0.5, angleToBoid + angleCovered * 0.5);
};
// Returns the zone relative to a bounding box, which a boid is in, i.e top-left, centre, bottom etc.
var getZone = function (boidPos, boundingBox) {
    // Return the zone depending on columns (once row has been decided)
    var getXZone = function (leftZone, midZone, rightZone) {
        if (boidPos.x < boundingBox.left) {
            return leftZone;
        }
        else if (boidPos.x < boundingBox.right) {
            return midZone;
        }
        else {
            return rightZone;
        }
    };
    // Return the zone depending on each row
    if (boidPos.y < boundingBox.top) {
        return getXZone(Zone.TopLeft, Zone.Top, Zone.TopRight);
    }
    else if (boidPos.y < boundingBox.bottom) {
        return getXZone(Zone.Left, Zone.Centre, Zone.Right);
    }
    else {
        return getXZone(Zone.BottomLeft, Zone.Bottom, Zone.BottomRight);
    }
};
var getShadowCorners = function (box, currentZone) {
    switch (currentZone) {
        case Zone.TopLeft:
            return [new Vector(box.left, box.bottom), new Vector(box.right, box.top)];
        case Zone.Top:
            return [new Vector(box.left, box.top), new Vector(box.right, box.top)];
        case Zone.TopRight:
            return [new Vector(box.left, box.top), new Vector(box.right, box.bottom)];
        case Zone.Left:
            return [new Vector(box.left, box.bottom), new Vector(box.left, box.top)];
        case Zone.Centre:
            return [];
        case Zone.Right:
            return [new Vector(box.right, box.top), new Vector(box.right, box.bottom)];
        case Zone.BottomLeft:
            return [new Vector(box.right, box.bottom), new Vector(box.left, box.top)];
        case Zone.Bottom:
            return [new Vector(box.right, box.bottom), new Vector(box.left, box.bottom)];
        case Zone.BottomRight:
            return [new Vector(box.right, box.top), new Vector(box.left, box.bottom)];
    }
};
var getDistanceToBox = function (box, boidPos, currentZone) {
    switch (currentZone) {
        case Zone.TopLeft:
            return boidPos.difference(new Vector(box.left, box.top)).length();
        case Zone.Top:
            return box.top - boidPos.y;
        case Zone.TopRight:
            return boidPos.difference(new Vector(box.right, box.top)).length();
        case Zone.Left:
            return box.left - boidPos.x;
        case Zone.Centre:
            return 0;
        case Zone.Right:
            return boidPos.x - box.right;
        case Zone.BottomLeft:
            return boidPos.difference(new Vector(box.left, box.bottom)).length();
        case Zone.Bottom:
            return boidPos.y - box.bottom;
        case Zone.BottomRight:
            return boidPos.difference(new Vector(box.right, box.bottom)).length();
    }
};

var Boid = /** @class */ (function () {
    function Boid(_a) {
        var debug = _a.debug, x = _a.x, y = _a.y, speed = _a.speed;
        this.debug = debug;
        this.position = new Vector(x, y);
        this.speed = speed;
        this.velocity = Vector.random();
        this.turnAngle = 0;
        this.turnCount = 0;
        this.animationFrame = 0;
        this.animationFrameHold = 0;
        this.animationIsTurning = false;
    }
    Boid.prototype.update = function (boids, mousePos, elementBounds) {
        var distanceList = this.getAllDistances(boids);
        // Get all directional influences 
        var alignment = this.getAlignment(distanceList);
        var projection = this.getProjection(distanceList, elementBounds);
        var attraction = this.getAttraction(mousePos);
        var collision = this.getCollision(elementBounds);
        var noise = Vector.random();
        // Take a weighted sum of all the influences and normalize.
        var direction = Vector.sum(alignment.multiply(0.75), projection.multiply(0.2), attraction.multiply(0.1), noise.multiply(0.05), collision.multiply(0.5)).normalize();
        // Ensure boid is not turning more than the maximum turn angle
        var angleBetween = Vector.angleBetween(this.velocity, direction);
        if (angleBetween > MAX_TURN_ANGLE && angleBetween < (Math.PI * 2) - MAX_TURN_ANGLE) {
            this.turnAngle = MAX_TURN_ANGLE;
            direction = this.velocity.normalize().rotateByAngle(MAX_TURN_ANGLE * Math.sign(angleBetween - Math.PI));
        }
        else {
            this.turnAngle = Math.min((Math.PI * 2) - angleBetween, angleBetween);
        }
        // Update the boid
        this.velocity = direction.multiply(this.speed);
        this.position = this.position.add(this.velocity);
        return this;
    };
    Boid.prototype.getAllDistances = function (boids) {
        var _this = this;
        return boids
            .map(function (b) { return ({
            boid: b,
            distance: _this.position.distanceTo(b.position)
        }); })
            .filter(function (b) { return b.distance !== 0 && b.distance < VISION_RANGE; })
            .sort(function (a, b) { return a.distance - b.distance; });
    };
    Boid.prototype.getAttraction = function (mousePos) {
        if (mousePos) {
            var distanceToMouse = mousePos.distanceTo(this.position);
            if (distanceToMouse < MOUSE_VISION_RANGE && distanceToMouse > 100) {
                return mousePos.difference(this.position).normalize();
            }
        }
        return new Vector(0, 0);
    };
    Boid.prototype.getAlignment = function (distanceList) {
        return distanceList
            .slice(0, ALIGNMENT_WITH_OTHERS_COUNT) // Consider only closest X neighbours
            .reduce(function (acc, cur) { return acc.add(cur.boid.velocity); }, new Vector(0, 0)) // Sum velocity
            .normalize();
    };
    Boid.prototype.getProjection = function (distanceList, elementBounds) {
        if (elementBounds === void 0) { elementBounds = []; }
        var vision = new BoidVision();
        // Add occulsion contributed by web elements
        for (var _i = 0, elementBounds_1 = elementBounds; _i < elementBounds_1.length; _i++) {
            var box = elementBounds_1[_i];
            addOcclusionFromBoundingbox(this.position, box, vision);
        }
        // Add occlusion contributed by other boids
        for (var _a = 0, distanceList_1 = distanceList; _a < distanceList_1.length; _a++) {
            var boidDist = distanceList_1[_a];
            addOcclusionFromBoid(this.position, boidDist.boid.position, boidDist.distance, vision);
        }
        // Calculate indices of boundaries (transitions from light to dark)
        var boundaries = [];
        for (var i = 0; i < PROJECTION_SECTOR_COUNT; i++) {
            // Ensure we wrap around at the first index
            var previousIndex = i === 0 ? PROJECTION_SECTOR_COUNT - 1 : i - 1;
            if (vision.occludedSectors[i] !== vision.occludedSectors[previousIndex]) {
                boundaries.push(i);
            }
        }
        // Calculate projection influence by summing direction to all boundaries
        var summedVector = boundaries.reduce(function (sum, boundaryIndex) {
            var angle = BoidVision.getAngleFromIndex(boundaryIndex);
            var vectorToBoundary = Vector.fromAngle(angle);
            return sum.add(vectorToBoundary);
        }, new Vector(0, 0));
        return summedVector.normalize();
    };
    Boid.prototype.getCollision = function (boxes) {
        var _this = this;
        if (boxes === void 0) { boxes = []; }
        // Init repulsion vector
        var totalRepulsion = new Vector(0, 0);
        // This is the position of the boid if it continued travelling at this velocity
        // in COLLISION_LOOKAHEAD timesteps
        var lookAheadPoint = this.position.add(this.velocity.multiply(COLLISION_LOOKAHEAD));
        // Function for scaling the repulsion force
        var repulsionForce = function (dist) { return Math.abs(dist / BOUNDARY_PADDING); };
        boxes.forEach(function (box) {
            var zone = getZone(_this.position, box);
            var boxCentre = new Vector((box.right + box.left) / 2, (box.top + box.bottom) / 2);
            var directionFromCentre = _this.position.difference(boxCentre);
            // X & Y positions when coords are mapped to a square
            var xNorm = directionFromCentre.x / (box.right - box.left);
            var yNorm = directionFromCentre.y / (box.bottom - box.top);
            var halfBoxHeight = (box.bottom - box.top) / 2;
            var halfBoxWidth = (box.right - box.left) / 2;
            var isWithinYBoundary = Math.abs(directionFromCentre.y) - halfBoxHeight < BOUNDARY_PADDING;
            var isWithinXBoundary = Math.abs(directionFromCentre.x) - halfBoxWidth < BOUNDARY_PADDING;
            // Add repulsion if inside box
            if (zone === Zone.Centre) {
                if (Math.abs(xNorm) >= Math.abs(yNorm)) {
                    totalRepulsion.x += Math.sign(xNorm);
                }
                else {
                    totalRepulsion.y += Math.sign(yNorm);
                }
            }
            // Add repulsion if within proximity of box (vertically)
            if (isWithinYBoundary) {
                var distanceFromBoundaryX = (halfBoxWidth + BOUNDARY_PADDING) - Math.abs(directionFromCentre.x);
                if (distanceFromBoundaryX > 0 && distanceFromBoundaryX < BOUNDARY_PADDING) {
                    totalRepulsion.x += Math.sign(directionFromCentre.x) * repulsionForce(distanceFromBoundaryX);
                }
            }
            // Add repulsion if within proximity of box (horizontally)
            if (isWithinXBoundary) {
                var distanceFromBoundaryY = (halfBoxHeight + BOUNDARY_PADDING) - Math.abs(directionFromCentre.y);
                if (distanceFromBoundaryY > 0 && distanceFromBoundaryY < BOUNDARY_PADDING) {
                    totalRepulsion.y += Math.sign(directionFromCentre.y) * repulsionForce(distanceFromBoundaryY);
                }
            }
            // Add repulsion if look ahead is within the box
            if (getZone(lookAheadPoint, box) === Zone.Centre) {
                var lookAheadDirectionFromCentre = lookAheadPoint.difference(boxCentre);
                // Force is scaled by how deep the look ahead is into the box
                var lookAheadInsideX = halfBoxWidth - Math.abs(lookAheadDirectionFromCentre.x);
                var lookAheadInsideY = halfBoxHeight - Math.abs(lookAheadDirectionFromCentre.y);
                if (Math.abs(xNorm) >= Math.abs(yNorm)) {
                    totalRepulsion.x += (Math.sign(xNorm) * lookAheadInsideX) / (COLLISION_LOOKAHEAD * _this.speed);
                }
                else {
                    totalRepulsion.y += (Math.sign(yNorm) * lookAheadInsideY) / (COLLISION_LOOKAHEAD * _this.speed);
                }
            }
        });
        return totalRepulsion;
    };
    return Boid;
}());

var Vector = /** @class */ (function () {
    function Vector(x, y) {
        this.x = x;
        this.y = y;
    }
    Vector.prototype.add = function (other) {
        return new Vector(other.x + this.x, other.y + this.y);
    };
    Vector.prototype.difference = function (other) {
        return new Vector(this.x - other.x, this.y - other.y);
    };
    Vector.prototype.multiply = function (multiple) {
        return new Vector(this.x * multiple, this.y * multiple);
    };
    Vector.prototype.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    Vector.prototype.normalize = function () {
        var length = this.length();
        if (length === 0) {
            return new Vector(0, 0);
        }
        return new Vector(this.x / length, this.y / length);
    };
    Vector.prototype.distanceTo = function (other) {
        return this.difference(other).length();
    };
    Vector.prototype.getAngleFromPosX = function () {
        return Vector.angleBetween(new Vector(1, 0), this);
    };
    Vector.prototype.rotateByAngle = function (angle) {
        return new Vector(Math.cos(angle) * this.x - Math.sin(angle) * this.y, Math.sin(angle) * this.x + Math.cos(angle) * this.y);
    };
    // Sets vector to have random direction and magnitude of 1.
    Vector.random = function () {
        var angle = Math.random() * 2 * Math.PI;
        return new Vector(Math.cos(angle), Math.sin(angle));
    };
    // Returns angle [0,PI] between the two vectors 
    Vector.angleBetween = function (a, b) {
        var angle = Math.atan2(-b.y, b.x) - Math.atan2(-a.y, a.x);
        return angle < 0 ? angle + (Math.PI * 2) : angle;
    };
    Vector.sum = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return new Vector(args.reduce(function (acc, cur) { return acc + ((cur === null || cur === void 0 ? void 0 : cur.x) || 0); }, 0), args.reduce(function (acc, cur) { return acc + ((cur === null || cur === void 0 ? void 0 : cur.y) || 0); }, 0));
    };
    Vector.fromAngle = function (angle) {
        return new Vector(Math.cos(angle), -Math.sin(angle));
    };
    return Vector;
}());

var twoPi = 2 * Math.PI;
var BoidVision = /** @class */ (function () {
    function BoidVision() {
        this.occludedSectors = new Array(PROJECTION_SECTOR_COUNT).fill(false);
    }
    BoidVision.prototype.addOccludedRegion = function (initialAngle, finalAngle) {
        var _this = this;
        // A function to map an angle in radians to the range [0, PROJECTION_SECTOR_COUNT]
        var mapAngleToSectorRange = function (angle) {
            angle = (angle + twoPi) % twoPi;
            return (angle * PROJECTION_SECTOR_COUNT) / twoPi;
        };
        var initialSectorIndex = Math.floor(mapAngleToSectorRange(initialAngle));
        var finalSectorIndex = Math.ceil(mapAngleToSectorRange(finalAngle));
        var setOccludedBetweenIndices = function (startIndex, endIndex) {
            for (var i = startIndex; i < endIndex; i++) {
                _this.occludedSectors[i] = true;
            }
        };
        if (initialSectorIndex > finalSectorIndex) {
            // Handle case where shadow overlaps the 0 (2PI) radians
            setOccludedBetweenIndices(initialSectorIndex, PROJECTION_SECTOR_COUNT);
            setOccludedBetweenIndices(0, finalSectorIndex);
        }
        else {
            setOccludedBetweenIndices(initialSectorIndex, finalSectorIndex);
        }
    };
    BoidVision.getAngleFromIndex = function (sectorIndex) {
        return (sectorIndex * 2 * Math.PI) / PROJECTION_SECTOR_COUNT;
    };
    return BoidVision;
}());

// Returns an updated set of window properties whenever the window is resized.
var useWindowProperties = function () {
    var _a = react.useState(document.body.clientWidth), width = _a[0], setWidth = _a[1];
    var _b = react.useState(document.documentElement.scrollHeight), height = _b[0], setHeight = _b[1];
    var _c = react.useState([]), elementBounds = _c[0], setElementBounds = _c[1];
    var updateWidthAndHeight = function () {
        setWidth(document.body.clientWidth);
        setHeight(document.documentElement.scrollHeight);
    };
    var getElementBounds = function (el) { return ({
        top: el['offsetTop'],
        bottom: el['offsetTop'] + el['offsetHeight'],
        right: el['offsetLeft'] + el['offsetWidth'],
        left: el['offsetLeft']
    }); };
    // Handle resize events
    react.useEffect(function () {
        // Get all elements with className: avoider and get their bounds
        setElementBounds(Array.from(document.querySelectorAll('.avoider'))
            .map(getElementBounds));
        // Handle adding/removing the window resize listener.
        window.addEventListener("resize", updateWidthAndHeight);
        return function () {
            window.removeEventListener("resize", updateWidthAndHeight);
        };
    }, [width, height]);
    return { windowSize: new Vector(width, height), elementBounds: elementBounds };
};

if (typeof Path2D === "undefined") {
    Path2D = function () { };
}
var openSprite = new Path2D("M5 4C5 4 3 14 3 15 4 15 3 32 2 32 2 33 1 25 0 25 0 25-1 34-2 33-3 30-4 14-4 14-4 14-7 5-7 5-12-3-37 15-39 19-44 15-25-4-15-9-13-10-5-10-6-9-6-12-4-16-2-17-1-18 1-18 0-17L3-10C10-15 37 5 37 14 31 7 17 2 8 2");
var semiOpenSprite = new Path2D("M4 5C4 5 2 15 2 16 3 16 2 33 1 33 1 34 0 26-1 26-1 26-2 35-3 34-4 31-5 15-5 15-5 15-8 6-8 6-12-1-22 12-26 20-23 0-14-9-7-8-7-11-5-15-3-16-2-17 0-17-1-16L2-9C9-14 28 7 24 21 20 9 16 3 7 3");
var semiClosedSprite = new Path2D("M6 3C3 3 3 12 3 13 4 13 3 30 2 30 2 31 1 23 0 23 0 23-1 32-2 31-3 28-4 12-4 12-4 12-7 3-7 3-12 1-15 5-14 23-22 12-21-1-14-8-12-10-5-12-6-11-6-14-4-18-2-19-1-20 1-20 0-19L3-12C15-10 24 3 9 23 12 10 11 1 6 3");
var closedSprite = new Path2D("M4 4C3 4 3 13 3 14 4 14 3 31 0 33 0 33 1 24 0 24 0 24-1 33-5 32-3 29-4 13-4 13-4 13-7 4-7 4-9 4-7 15-5 27-11 10-12-2-10-7-9-10-5-11-6-10-6-13-4-16-2-18-1-19 1-19 0-18L3-11C10-7 11 8 4 26 5 15 7 6 4 4");
// Sprites which are cycled between when the boid is travelling straight
var straightSprites = [openSprite, semiOpenSprite];
// Sprites which are cycled between when the boid is turning
var turningSprites = [closedSprite, semiClosedSprite];

var drawVisionWidgets = function (ctx, boid) {
    if (boid.debug && ENABLE_VISION_DEBUG) {
        // Draw box vision radius
        ctx.fillStyle = "#ff000011";
        ctx.beginPath();
        ctx.arc(boid.position.x, boid.position.y, BOX_VISION_RANGE, 0, 2 * Math.PI);
        ctx.fill();
        // Draw boid vision radius
        ctx.fillStyle = "#ff000022";
        ctx.beginPath();
        ctx.arc(boid.position.x, boid.position.y, VISION_RANGE, 0, 2 * Math.PI);
        ctx.fill();
    }
};
var drawBoid = function (ctx, boid, spriteToDraw) {
    // Draw debug boids as green
    ctx.fillStyle = boid.debug ? "#00ff00" : "#FFFFFFF0";
    ctx.translate(boid.position.x, boid.position.y);
    ctx.scale(0.2, 0.2);
    ctx.rotate(-1 * boid.velocity.getAngleFromPosX() + Math.PI / 2);
    ctx.fill(spriteToDraw);
    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
};
var getNextSprite = function (boid) {
    // Advance the boids animation frame hold
    boid.animationFrameHold =
        (boid.animationFrameHold + 1) % ANIMATION_FRAME_HOLD;
    // If the boid is turning, increment the turn count, else reset it
    if (boid.turnAngle >= TURN_ANIMATION_THRESHOLD_ANGLE) {
        boid.turnCount++;
    }
    else {
        boid.turnCount = 0;
    }
    // Check if the boid meets the criteria to enter a turning state
    var isTurning = boid.turnCount > MIN_TURN_FRAMES_FOR_ANIMATION_CHANGE;
    // If the frame hold has reset to 0, update the frame and the turning flag
    if (boid.animationFrameHold === 0) {
        if (boid.animationIsTurning !== isTurning) {
            // If switched turning state, choose a random frame to start from.
            boid.animationFrame = isTurning
                ? Math.floor(Math.random() * turningSprites.length)
                : Math.floor(Math.random() * straightSprites.length);
        }
        else {
            // Else increment from the last frame
            boid.animationFrame = isTurning
                ? (boid.animationFrame + 1) % turningSprites.length
                : (boid.animationFrame + 1) % straightSprites.length;
        }
        // Update the turning flag
        boid.animationIsTurning = isTurning;
    }
    return boid.animationIsTurning
        ? turningSprites[boid.animationFrame]
        : straightSprites[boid.animationFrame];
};

var useAnimateBoids = function (initialBoidCount) {
    // Subscribe to updates to window properties
    var _a = useWindowProperties(), windowSize = _a.windowSize, elementBounds = _a.elementBounds;
    // Setup refs
    var canvasRef = react.useRef(null);
    var animReqId = react.useRef(0);
    // Handle initial particles to persist positions on re-renders
    var _b = react.useState(createInitialBoids(initialBoidCount, windowSize)), initialBoids = _b[0], setInitialBoids = _b[1];
    var drawFunction = draw(windowSize);
    react.useEffect(function () {
        var boids = initialBoids;
        var mousePosition;
        var canvas = canvasRef.current;
        var updateMousePos = function (e) {
            mousePosition = new Vector(e.x + document.documentElement.scrollLeft, e.y + document.documentElement.scrollTop);
        };
        var nullMousePos = function () {
            mousePosition = undefined;
        };
        // Setup the canvas
        if (canvas) {
            canvas.width = windowSize.x;
            canvas.height = windowSize.y;
            canvas.addEventListener('mousemove', updateMousePos);
            canvas.addEventListener('mouseout', nullMousePos);
        }
        // Create the tick function, which updates the boids and draws a new frame.
        var tick = function () {
            drawFunction(canvasRef, boids);
            var boundingBoxes = calculateBoundingBoxes(elementBounds);
            boids.forEach(function (b) { return b.update(boids, mousePosition, boundingBoxes); });
            animReqId.current = requestAnimationFrame(tick);
        };
        // Initiate ticks
        tick();
        return function () {
            // Set initial boids, so on re-render all boids are in the same place.
            setInitialBoids(boids);
            cancelAnimationFrame(animReqId.current);
            // Remove mouse position listeners
            if (canvas) {
                canvas.removeEventListener('mousemove', updateMousePos);
                canvas.removeEventListener('mouseout', nullMousePos);
            }
        };
    }, [drawFunction, elementBounds, initialBoids, windowSize]);
    return canvasRef;
};
var draw = function (windowSize) {
    return function (canvasRef, boids) {
        if (!canvasRef)
            return;
        var canvas = canvasRef.current;
        if (!canvas)
            return;
        var ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        // clear the previous frame
        ctx.clearRect(0, 0, windowSize.x, windowSize.y);
        boids.forEach(function (boid) {
            // Calculate the next sprite to draw
            var spriteToDraw = getNextSprite(boid);
            // Draw the boid
            drawBoid(ctx, boid, spriteToDraw);
            // Draw debug widgets
            drawVisionWidgets(ctx, boid);
        });
    };
};
var createInitialBoids = function (initialBoidCount, windowSize) {
    var boids = [];
    for (var i = 0; i < initialBoidCount; ++i) {
        boids.push(new Boid({
            debug:  false,
            x: Math.random() * windowSize.x,
            y: Math.random() * windowSize.y,
            speed: BOID_SPEED
        }));
    }
    return boids;
};
var calculateBoundingBoxes = function (elementBounds) {
    var screenTop = document.documentElement.scrollTop;
    var screenBottom = screenTop + window.innerHeight;
    var screenLeft = document.documentElement.scrollLeft;
    var screenRight = screenLeft + window.innerWidth;
    // Screen bounds are made by adding large bounding boxes surrounding the visible window
    var offscreenBoxes = [
        { top: screenTop - 5000, bottom: screenTop, left: screenLeft - 5000, right: screenRight + 5000 },
        { top: screenTop - 5000, bottom: screenBottom + 5000, left: screenRight, right: screenRight + 5000 },
        { top: screenBottom, bottom: screenBottom + 5000, left: screenLeft - 5000, right: screenRight + 5000 },
        { top: screenTop - 5000, bottom: screenBottom + 5000, left: screenLeft - 5000, right: screenLeft },
    ];
    return __spreadArrays(elementBounds, offscreenBoxes);
};

var FlockingBirdsBackground = function (_a) {
    var _b = _a.initialBirdCount, initialBirdCount = _b === void 0 ? INITIAL_BOID_COUNT : _b;
    // Animate the canvas
    var canvasRef = useAnimateBoids(initialBirdCount);
    // Dispatch a resize event after 10ms to ensure the true scroll height is read once
    // all page elements have loaded.
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 10);
    return (jsxRuntime.jsx("div", __assign({ style: { position: 'absolute', overflow: 'hidden' } }, { children: jsxRuntime.jsx("canvas", { ref: canvasRef, style: { display: "block" } }, void 0) }), void 0));
};

exports.FlockingBirdsBackground = FlockingBirdsBackground;
//# sourceMappingURL=index.js.map
