
/**
 * @what Defines the visual dimensions for nodes on the canvas.
 * @why Using constants makes it easy to maintain a consistent UI and adjust dimensions globally.
 */
export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 120;

/**
 * @what Defines the total size of the flowchart canvas.
 * @why This provides a large, scrollable area for users to build complex flows.
 */
export const CANVAS_WIDTH = 3000;
export const CANVAS_HEIGHT = 2000;

/**
 * @what Specifies the Gemini model to be used for text generation tasks.
 * @why Using a constant ensures that all API calls use the same model consistently.
 * 'gemini-2.5-flash' is chosen for its balance of speed and capability.
 */
export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash';
