// --- Face recognition engine (browser-only, face-api.js) ---
// Nothing here ever leaves the browser except the final 128-number
// "descriptor" array, which is what gets sent to the backend (for
// enrollment) or compared against descriptors the backend already has
// (for live matching). No image or video frame is ever uploaded.
var FaceEngine = (function () {
    var modelsLoaded = false;
    var loadingPromise = null;

    function loadModels() {
        if (modelsLoaded) return Promise.resolve();
        if (loadingPromise) return loadingPromise;

        loadingPromise = Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODEL_URL)
        ]).then(function () {
            modelsLoaded = true;
        });

        return loadingPromise;
    }

    // Runs detection + landmarks + descriptor extraction on the current
    // video frame. Returns a plain 128-length number array, or null if no
    // face (or more than one face) was found in the frame.
    function getDescriptor(videoEl) {
        var options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
        return faceapi
            .detectSingleFace(videoEl, options)
            .withFaceLandmarks()
            .withFaceDescriptor()
            .then(function (result) {
                if (!result) return null;
                return Array.from(result.descriptor);
            });
    }

    // known = [{ rollNumber, name, descriptor }, ...]
    // Returns { match: {rollNumber,name}, distance } or null if nothing is
    // within FACE_MATCH_THRESHOLD.
    function bestMatch(descriptor, known, threshold) {
        threshold = threshold || FACE_MATCH_THRESHOLD;
        var best = null;
        var bestDist = Infinity;
        known.forEach(function (k) {
            var dist = faceapi.euclideanDistance(descriptor, k.descriptor);
            if (dist < bestDist) {
                bestDist = dist;
                best = k;
            }
        });
        if (best && bestDist <= threshold) {
            return { match: best, distance: bestDist };
        }
        return null;
    }

    // --- Liveness Detection Helpers ---
    function landmarkDist(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }

    // Eye Aspect Ratio — drops below ~0.21 when eyes are closed
    function eyeAR(eyePoints) {
        var A = landmarkDist(eyePoints[1], eyePoints[5]);
        var B = landmarkDist(eyePoints[2], eyePoints[4]);
        var C = landmarkDist(eyePoints[0], eyePoints[3]);
        return (A + B) / (2.0 * C);
    }

    function detectBlink(landmarks) {
        var p = landmarks.positions;
        var leftEye  = [p[36], p[37], p[38], p[39], p[40], p[41]];
        var rightEye = [p[42], p[43], p[44], p[45], p[46], p[47]];
        var avgEAR = (eyeAR(leftEye) + eyeAR(rightEye)) / 2.0;
        return avgEAR < 0.25;
    }

    // NOTE: The video is CSS-mirrored (scaleX(-1)) for selfie view, but
    // face-api.js reads the raw (un-mirrored) video frame. So when the user
    // turns their head LEFT on screen, face-api sees it as RIGHT, and vice versa.
    // We swap the thresholds here so directions match what the user sees.
    function detectHeadTurn(landmarks, direction) {
        var p = landmarks.positions;
        var noseTip   = p[30];
        var leftJaw   = p[0];
        var rightJaw  = p[16];
        var noseToLeft  = landmarkDist(noseTip, leftJaw);
        var noseToRight = landmarkDist(noseTip, rightJaw);
        var ratio = noseToLeft / noseToRight;
        // Swapped: user sees "turn left" but face-api sees right, and vice versa
        if (direction === 'left')  return ratio > 1.35;
        if (direction === 'right') return ratio < 0.74;
        return false;
    }

    function detectLookUp(landmarks) {
        var p = landmarks.positions;
        var noseBridge = p[27];
        var noseTip    = p[30];
        var chin       = p[8];
        var noseLen = landmarkDist(noseBridge, noseTip);
        var chinLen = landmarkDist(noseTip, chin);
        return (noseLen / chinLen) > 0.70;
    }

    // Full detection pass: returns { landmarks, descriptor? } or null
    function detectWithLandmarks(videoEl) {
        var options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
        return faceapi
            .detectSingleFace(videoEl, options)
            .withFaceLandmarks()
            .then(function (result) {
                if (!result) return null;
                return result;
            });
    }

    return {
        loadModels: loadModels,
        getDescriptor: getDescriptor,
        bestMatch: bestMatch,
        detectBlink: detectBlink,
        detectHeadTurn: detectHeadTurn,
        detectLookUp: detectLookUp,
        detectWithLandmarks: detectWithLandmarks
    };
})();
