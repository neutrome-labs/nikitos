# NikitOS

**Build what you need, when you need it.**

Tired of juggling apps? NikitOS changes how you use your computer. Instead of being stuck with pre-built software, you just describe what you want to do. The system then generates a custom "panel"—anything from a simple tool to a complex app—tailored to your task.

It’s a fluid, adaptive workspace that molds to you, not the other way around.

## How It Works

*   **Speak Your Mind:** Use plain English to describe the tool you need (e.g., "a simple pomodoro timer" or "a kanban board for my project").
*   **Instant Tools:** AI generates a custom interface (a "panel") on the fly. No more hunting for the right app.
*   **Always Improving:** The system learns from you. You can also ask the AI to tweak or add features to any panel you've made.
*   **Connected Workspace:** Your panels can work together, sharing information to create a seamless workflow.

## Features

| Feature | Description | Status |
| :--- | :--- | :--- |
| **Core System** | Lightweight tray app to create, manage, and organize your panels. | ✅ Available |
| **Web Panels** | Turn any website into a clean, native-like panel. | ✅ Available |
| **AI-Built Panels**| Describe an interface and watch AI build it instantly with HTML/CSS/JS. | ✅ Available |
| **Native Flutter Panels**| Generate high-performance, native apps from a description. | 🚧 In Progress |
| **Marketplace** | Share your panels and browse tools made by the community. | 🚧 In Progress |

## Installation

**Prerequisites:**
*   Node.js 18+ (or Bun)
*   An OpenAI API key

**Setup:**
```bash
# Clone the repo
git clone https://github.com/theuargb/nikitos.git
cd nikitos

# Install dependencies
bun install  # or npm install

# Set up your environment
cp .env.example .env # Then add your OpenAI API key to the .env file

# Run the app
bun run dev # or npm run dev
```

## Getting Started

1.  **Open NikitOS** from your system tray.
2.  **Describe your tool.** Type something like "a todo list with a dark theme" and choose "Build Panel".
3.  **Watch it build.** The AI will generate your interface in seconds.
4.  **Use and enhance.** Use your new tool. To change it, open the Edit menu and select "Enhance," then describe your update.

## Roadmap

| Timeline | Goal |
| :--- | :--- |
| **Q3 2025** | Flutter/Native panel generation |
| **Q4 2025** | Community marketplace launch |
| **Q2 2026** | Enterprise features and team collaboration |

## Our Vision

We believe AI should be a creative partner, not a replacement for human ingenuity. NikitOS is our first step toward a future where your computer understands your intent and builds the perfect tool for the job, making technology feel truly personal.

---

**NikitOS: Your ideas, instantly interactive.**
