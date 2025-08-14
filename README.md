# 🤖 AI Agent Flowchart

**Visually design, build, and run complex AI workflows with the power of Google Gemini.**

![AI Agent Flowchart Demo](https://storage.googleapis.com/project-av/misc/ai-agent-flowchart-demo.gif)

---

AI Agent Flowchart is a web-based tool that allows you to move beyond single prompts and create sophisticated, multi-step AI systems. By connecting different AI "agents" in a visual flowchart, you can define complex logic, conditional paths, and workflows that process information sequentially, enabling you to tackle more advanced tasks.

## ✨ Features

-   **Visual Editor**: A simple, intuitive drag-and-drop canvas to build and organize your agent flows.
-   **Customizable Agents**: Define agents with specific roles, instructions, and personalities.
-   **Conditional Logic**: Use "Conditional Agents" to dynamically route the flow based on the AI's output, creating intelligent decision trees.
-   **Gemini-Powered**: Leverages the fast and capable `gemini-2.5-flash` model for all agent processing.
-   **Internet Search**: Empower any agent to access real-time, up-to-date information from the web to ground its responses.
-   **Real-Time Monitoring**: Watch your workflow execute step-by-step with a detailed processing log.
-   **Interactive Debugging**: Select nodes to see their specific inputs, outputs, and any errors that occurred.
-   **Markdown Output**: The final result is rendered in clean, readable markdown, perfect for reports, summaries, or structured data.

## 🚀 Getting Started

Running your own instance of AI Agent Flowchart is easy.

### Prerequisites

-   A modern web browser.
-   A **Google Gemini API Key**. You can get one for free from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Running the App

This project is set up as a client-side application with no build step required.

1.  **Clone the Repository**
    ```bash
    git clone <repository_url>
    cd ai-agent-flowchart
    ```

2.  **Set Up Your API Key**
    The application is securely designed to read your API key from the `process.env.API_KEY` variable provided by the hosting environment. You **must** configure this environment variable where you deploy the application. For local testing with tools like `vite`, you can create a `.env.local` file in the root directory:
    ```
    API_KEY=YOUR_GEMINI_API_KEY_HERE
    ```
    **Important**: Never commit your `.env` file or hardcode your API key in the source code.

3.  **Serve the Application**
    You can use any simple static file server. If you have Node.js, you can use `serve`:
    ```bash
    # Install serve globally if you haven't already
    npm install -g serve

    # Run the server from the project root
    serve
    ```
    Now, open your browser and navigate to the local address provided by the server (e.g., `http://localhost:3000`).

## 🔧 How It Works

The application is built with a modern, clean tech stack:

-   **React**: For building the user interface.
-   **TypeScript**: For type safety and better developer experience.
-   **Tailwind CSS**: For rapid, utility-first styling.
-   **@google/genai**: The official Google GenAI SDK for interacting with the Gemini API.

The core logic revolves around a state machine that processes a "flow" of nodes and edges. When you start the flow, it begins at the `START` node and traverses the graph, passing the output of one node as the input to the next. `AGENT` nodes call the Gemini API to process the input based on their unique instructions.

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.
