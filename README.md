# NikitOS

**AI-First Operating System for Hyperpersonalized Computing**

NikitOS reimagines how humans interact with computers by breaking free from traditional app-centric paradigms. Instead of being restricted by predefined applications, users work with AI-generated, usecase-based interfaces that adapt to their specific needs in real-time.

## Overview

NikitOS is a revolutionary operating system that puts artificial intelligence at the core of the user experience. Rather than launching separate applications for different tasks, users simply describe what they want to accomplish, and the system generates personalized interfaces on-demand. This creates a fluid, adaptive computing environment where the interface molds itself to the user's workflow, not the other way around.

The system operates through intelligent "panels" - dynamic interface components that can be anything from simple tools to complex applications, all generated and customized by AI based on natural language descriptions.

## Core Concepts

### AI-First Architecture
- **Natural Language Interface**: Users interact with the system using plain English descriptions
- **Dynamic Panel Generation**: AI creates custom interfaces based on user intent
- **Adaptive Learning**: The system learns from user behavior to improve future interactions
- **Context Awareness**: Panels understand and adapt to the current working context

### Panel-Based Computing
- **Usecase-Driven**: Each panel is designed for a specific task or workflow
- **Hyperpersonalized**: Interfaces are tailored to individual user preferences and needs
- **Persistent**: Panels maintain state and can be enhanced over time
- **Interconnected**: Panels can communicate and share data seamlessly

### Intelligent Enhancement
- **Real-time Improvement**: Users can enhance existing panels with natural language feedback
- **AI-Powered Iteration**: The system continuously refines interfaces based on usage patterns
- **Collaborative Intelligence**: Human creativity combined with AI capabilities

## Features

### ✅ Core System
- **Tray-based Interface**: Lightweight, always-accessible system tray integration
- **Panel Management**: Create, organize, and manage dynamic interface panels
- **Persistent Storage**: All panels and customizations are saved between sessions
- **Window Management**: Intelligent window sizing and positioning with memory
- **Dark Theme**: Beautiful, eye-friendly interface design

### ✅ Web Panels
- **URL Integration**: Transform any web service into a native panel
- **Responsive Design**: Web content adapts to panel dimensions
- **Bookmark Evolution**: Traditional bookmarks become interactive panels
- **Cross-Platform Compatibility**: Access web services with native-like experience

### ✅ HTML Build Panels
- **AI-Generated Interfaces**: Create custom HTML/CSS/JavaScript interfaces from descriptions
- **Real-time Streaming**: Watch as AI builds your interface in real-time
- **Enhancement System**: Improve existing panels with natural language feedback
- **Full Customization**: Complete control over appearance and functionality
- **Persistent Content**: All generated code is saved and can be modified

### 🚧 Flutter/Native Build Panels (In Progress)
- **Native Performance**: Generate true native applications using Flutter
- **Cross-Platform**: Single description creates apps for multiple platforms
- **Advanced UI Components**: Access to native widgets and animations
- **System Integration**: Deep integration with operating system features

### 🚧 Marketplace (In Progress)
- **Panel Sharing**: Share your custom panels with the community
- **Template Library**: Browse and use panels created by other users
- **Collaborative Development**: Community-driven panel improvement
- **Monetization**: Support creators through panel marketplace

## Installation

### Prerequisites
- Node.js 18+ or Bun runtime
- OpenAI API key for AI functionality

### Setup

1. Clone the repository:
```bash
git clone https://github.com/theuargb/nikitos.git
cd nikitos
```

2. Install dependencies:
```bash
bun install
# or
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your OpenAI API credentials
```

4. Run the development version:
```bash
bun run dev
# or
npm run dev
```

## Usage

### Creating Your First Panel

1. **Launch NikitOS**: Click the system tray icon to open the panel manager
2. **Describe Your Need**: Type what you want to create (e.g., "todo list with dark theme")
3. **Watch AI Build**: The system generates your custom interface in real-time
4. **Use and Enhance**: Interact with your panel and enhance it using the Edit menu

### Panel Types

- **Web Panels**: Enter any URL to create a web-based panel
- **Build Panels**: Describe an interface and let AI create it from scratch
- **Enhanced Panels**: Improve existing panels with natural language feedback

### Enhancement Workflow

1. Open any build panel
2. Go to Edit → Enhance in the menu bar
3. Describe your desired improvements
4. Watch as AI updates your interface in real-time

## Architecture

NikitOS is built on modern web technologies with AI integration:

- **Frontend**: React with inline styling for maximum flexibility
- **Backend**: Electron for cross-platform desktop integration
- **AI Engine**: OpenAI GPT models for interface generation and enhancement
- **Storage**: Local JSON-based persistence with automatic backups
- **IPC**: Secure inter-process communication between main and renderer processes

## Development

### Project Structure
```
nikitos/
├── main.js              # Electron main process
├── preload.js           # IPC bridge
├── src/
│   ├── App.jsx          # Main React application
│   └── components/      # Reusable components
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

### Contributing

We welcome contributions to NikitOS! Please see our contributing guidelines and join our community of developers building the future of human-computer interaction.

## Author

**Neutrome Labs** - Pioneering AI-first computing experiences

NikitOS represents our vision of a future where artificial intelligence doesn't replace human creativity but amplifies it, creating computing experiences that are truly personal and infinitely adaptable.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Roadmap

- **Q1 2025**: Flutter/Native panel generation
- **Q2 2025**: Community marketplace launch
- **Q3 2025**: Advanced AI models and multi-modal interfaces
- **Q4 2025**: Enterprise features and team collaboration

---

*NikitOS - Where AI meets human creativity to redefine computing*
