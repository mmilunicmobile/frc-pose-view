// @ts-nocheck


(function () {
    const vscode = acquireVsCodeApi();

    /** @type {HTMLElement} */
    const robot = document.getElementById('robot');
    /** @type {HTMLElement} */
    const ghostRobot = document.getElementById('ghost-robot');
    /** @type {HTMLElement} */
    const fieldImage = document.getElementById('field-image');
    /** @type {HTMLElement} */
    const fieldContainer = document.getElementById('field-container');

    // Field Dimensions (FRC 2024 approx)
    const FIELD_WIDTH_M = 16.54;
    const FIELD_HEIGHT_M = 8.21;

    let currentPose = { x: 0, y: 0, rotation: 0 };
    let isDragging = false;

    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'updatePose':
                currentPose = { x: message.x, y: message.y, rotation: message.rotation };
                updateRobot(ghostRobot, currentPose);
                if (!isDragging) {
                    updateRobot(robot, currentPose);
                }
                break;
        }
    });

    function updateRobot(element, pose) {
        if (!fieldImage.complete || fieldImage.naturalWidth === 0) {
            // Wait for image to load to get dimensions
            return;
        }

        const containerWidth = fieldContainer.clientWidth;
        const containerHeight = fieldContainer.clientHeight;

        // Scale factors (px per meter)
        // Ensure we fit the field within the container (image width)
        // Image behaves as width: 100%
        const pxPerMeterX = containerWidth / FIELD_WIDTH_M;
        // Assume aspect ratio is preserved
        const pxPerMeter = pxPerMeterX;

        // Field coordinate system: 
        // (0,0) is usually bottom-left or center, but standard FRC is Bottom-Left.
        // Web is Top-Left.
        // We need to map (x, y) meters to (left, top) pixels.

        // Map X: 0 -> 0px, WIDTH -> containerWidth
        const left = pose.x * pxPerMeter;

        // Map Y: 0 -> containerHeight, HEIGHT -> 0px (Standard FRC Y is up, Web Y is down)
        // We need to know the displayed height of the image
        const displayedHeight = fieldImage.clientHeight;
        const top = displayedHeight - (pose.y * pxPerMeter);

        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
        element.style.transform = `rotate(${-pose.rotation}deg)`; // FRC is CCW positive, CSS is CW positive
    }

    // Handle Dragging
    fieldContainer.addEventListener('mousedown', (e) => {
        // Simple drag logic (click anywhere to move robot? or only drag robot?)
        // Let's implement click-to-place and drag-robot
        moveRobotTo(e.clientX, e.clientY);
        isDragging = true;
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            moveRobotTo(e.clientX, e.clientY);
        }
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            // Finalize?
        }
    });

    function moveRobotTo(clientX, clientY) {
        const rect = fieldContainer.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        const containerWidth = fieldContainer.clientWidth;
        const pxPerMeter = containerWidth / FIELD_WIDTH_M;
        const displayedHeight = fieldImage.clientHeight;

        // Convert px to meters
        let x = mouseX / pxPerMeter;
        let y = (displayedHeight - mouseY) / pxPerMeter;

        // Clamp
        x = Math.max(0, Math.min(FIELD_WIDTH_M, x));
        y = Math.max(0, Math.min(FIELD_HEIGHT_M, y));

        // Start with current rotation (or implement rotation logic later)
        const rotation = currentPose.rotation;

        // Update local generic robot
        updateRobot(robot, { x, y, rotation });

        // Send back to extension
        vscode.postMessage({
            command: 'updatePose',
            x: x,
            y: y,
            rotation: rotation
        });
    }

    // Redraw on resize
    window.addEventListener('resize', () => {
        updateRobot(ghostRobot, currentPose);
        if (!isDragging) updateRobot(robot, currentPose);
    });

    // Initial draw check
    fieldImage.onload = () => {
        updateRobot(ghostRobot, currentPose);
        updateRobot(robot, currentPose);
    };

}());
