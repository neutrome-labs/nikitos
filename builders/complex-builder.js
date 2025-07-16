const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { app } = require('electron');

/**
 * Complex AI Builder for high complexity panels (complexity > 3)
 * Uses Docker with Claude Code OpenAI wrapper
 */
class ComplexBuilder {
  constructor(config) {
    this.config = config;
    this.activeContainers = new Map(); // Track active containers
  }

  /**
   * Enhance existing panel content using Docker with Claude Code
   * @param {Object} metadata - Panel metadata
   * @param {string} userInput - User enhancement instructions only
   * @param {BrowserWindow} panelWindow - The panel window to stream to
   * @param {Function} tryPrependWithSystemFile - Function to add system prompts
   * @returns {Promise<void>}
   */
  async enhance(metadata, userInput, panelWindow, tryPrependWithSystemFile) {
    const containerId = `claude-code-enhance-${metadata.id}`;
    const stdlibPath = path.join(app.getPath('userData'), 'stdlib');
    const panelDir = path.join(stdlibPath, metadata.id);

    try {
      // Ensure panel directory exists
      if (!fs.existsSync(panelDir)) {
        fs.mkdirSync(panelDir, { recursive: true });
      }

      // Start Docker container with Claude Code
      const containerPort = await this.startClaudeCodeContainer(containerId, panelDir);
      
      // Wait for container to be ready
      await this.waitForContainer(containerPort);

      // Send enhancement request to Claude Code via OpenAI-like API
      await this.sendEnhancementRequestToClaudeCode(
        containerPort, 
        metadata, 
        userInput, 
        panelWindow, 
        tryPrependWithSystemFile
      );

    } catch (error) {
      console.error('Error in complex builder enhance:', error);
      // Clean up container on error
      await this.stopContainer(containerId);
      throw error;
    }
  }

  /**
   * Build a panel using Docker with Claude Code
   * @param {Object} metadata - Panel metadata from thinker
   * @param {string} request - Original user request
   * @param {BrowserWindow} panelWindow - The panel window to stream to
   * @param {Function} tryPrependWithSystemFile - Function to add system prompts
   * @returns {Promise<void>}
   */
  async build(metadata, request, panelWindow, tryPrependWithSystemFile) {
    const containerId = `claude-code-${metadata.id}`;
    const stdlibPath = path.join(app.getPath('userData'), 'stdlib');
    const panelDir = path.join(stdlibPath, metadata.id);
    const htmlPath = path.join(panelDir, 'index.html');

    try {
      // Check if HTML file already exists
      if (fs.existsSync(htmlPath)) {
        console.log(`Panel ${metadata.id} already has HTML content, loading existing file`);
        panelWindow.loadFile(htmlPath);
        panelWindow.webContents.send('stream-end');
        return;
      }

      // Ensure panel directory exists
      if (!fs.existsSync(panelDir)) {
        fs.mkdirSync(panelDir, { recursive: true });
      }

      // Start Docker container with Claude Code
      const containerPort = await this.startClaudeCodeContainer(containerId, panelDir);
      
      // Wait for container to be ready
      await this.waitForContainer(containerPort);

      // Send request to Claude Code via OpenAI-like API
      await this.sendRequestToClaudeCode(
        containerPort, 
        metadata, 
        request, 
        panelWindow, 
        tryPrependWithSystemFile
      );

    } catch (error) {
      console.error('Error in complex builder:', error);
      // Clean up container on error
      await this.stopContainer(containerId);
      throw error;
    }
  }

  /**
   * Start Claude Code Docker container
   * @param {string} containerId - Unique container identifier
   * @param {string} panelDir - Panel directory to mount
   * @returns {Promise<number>} - Port number the container is running on
   */
  async startClaudeCodeContainer(containerId, panelDir) {
    return new Promise((resolve, reject) => {
      // Find available port
      const port = 3000 + Math.floor(Math.random() * 1000);
      
      // Docker run command
      const dockerArgs = [
        'run',
        '--rm', // Remove container when it stops
        '--name', containerId,
        '-p', `${port}:8000`, // Map container port 3000 to host port
        '-v', `${panelDir}:/app/workspace`, // Mount panel directory
        '-e', 'DEBUG_MODE=true',
        '-e', 'MAX_TIMEOUT=6000000',
        '-e', 'CLAUDE_CWD=/app/workspace',
        '-e', `ANTHROPIC_API_KEY=${process.env.ANTHROPIC_AUTH_TOKEN}`,
        '-e', `ANTHROPIC_BASE_URL=${process.env.ANTHROPIC_BASE_URL}`,
        '-d', // Run in detached mode
        process.env.COMPLEX_RENDERER_DOCKER_IMAGE
      ];

      console.log('Starting Docker container:', 'docker', dockerArgs.join(' '));

      const dockerProcess = spawn('docker', dockerArgs);
      
      let output = '';
      let errorOutput = '';

      dockerProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      dockerProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      dockerProcess.on('close', (code) => {
        if (code === 0) {
          const containerIdFromOutput = output.trim();
          this.activeContainers.set(containerId, { port, containerIdFromOutput });
          console.log(`Container ${containerId} started on port ${port}`);
          resolve(port);
        } else {
          console.error('Docker container failed to start:', errorOutput);
          reject(new Error(`Docker container failed to start: ${errorOutput}`));
        }
      });

      dockerProcess.on('error', (error) => {
        console.error('Failed to start Docker process:', error);
        reject(error);
      });
    });
  }

  /**
   * Wait for container to be ready to accept requests
   * @param {number} port - Port to check
   * @returns {Promise<void>}
   */
  async waitForContainer(port) {
    const maxAttempts = 60; // 30 seconds timeout
    const delay = 1000; // 1 second between attempts

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`http://localhost:${port}/health`, {
          method: 'GET',
          timeout: 2000
        });
        
        if (response.ok) {
          console.log(`Container ready on port ${port}`);
          return;
        }
      } catch (error) {
        // Container not ready yet, continue waiting
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }

    throw new Error(`Container failed to become ready on port ${port} after ${maxAttempts} seconds`);
  }

  /**
   * Send enhancement request to Claude Code container
   * @param {number} port - Container port
   * @param {Object} metadata - Panel metadata
   * @param {string} userInput - User enhancement instructions only
   * @param {BrowserWindow} panelWindow - Panel window
   * @param {Function} tryPrependWithSystemFile - System prompt function
   * @returns {Promise<void>}
   */
  async sendEnhancementRequestToClaudeCode(port, metadata, userInput, panelWindow, tryPrependWithSystemFile) {
    try {
      const response = await fetch(`http://localhost:${port}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.COMPLEX_RENDERER_MODEL,
          messages: tryPrependWithSystemFile(process.env.CLAUDE_CODE_SYSTEM_PROMPT, [
            { role: 'user', content: userInput }
          ]),
          enable_tools: true,
          stream: true
        }),
        signal: AbortSignal.timeout(1 * 60 * 60 * 1000) // 1 hour timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error from Claude Code API:', errorText);
        throw new Error(`Claude Code API error: ${response.status} - ${errorText}`);
      }

      // Stream the response
      let content = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            const data = line.replace(/^data: /, '');
            if (data.trim() === '[DONE]') {
              // Finalize enhancement and reload panel
              await this.finalizeEnhancement(metadata, content, panelWindow);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                const deltaContent = parsed.choices[0].delta.content;
                content += deltaContent;
                panelWindow.webContents.send('stream-data', deltaContent);
              }
            } catch (error) {
              // Ignore JSON parse errors
            }
          }
        }
      }

      // If we reach here without [DONE], finalize anyway
      await this.finalizeEnhancement(metadata, content, panelWindow);

    } catch (error) {
      console.error('Error communicating with Claude Code for enhancement:', error);
      throw error;
    }
  }

  /**
   * Send request to Claude Code container
   * @param {number} port - Container port
   * @param {Object} metadata - Panel metadata
   * @param {string} request - Original user request
   * @param {BrowserWindow} panelWindow - Panel window
   * @param {Function} tryPrependWithSystemFile - System prompt function
   * @returns {Promise<void>}
   */
  async sendRequestToClaudeCode(port, metadata, request, panelWindow, tryPrependWithSystemFile) {
    try {
      const response = await fetch(`http://localhost:${port}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.COMPLEX_RENDERER_MODEL,
          messages: tryPrependWithSystemFile(process.env.CLAUDE_CODE_SYSTEM_PROMPT, [
            { role: 'user', content: metadata.alpha },
            { role: 'user', content: request },
          ]),
          enable_tools: true,
          stream: true
        }),
        signal: AbortSignal.timeout(1 * 60 * 60 * 1000) // 1 hour timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error from Claude Code API:', errorText);
        throw new Error(`Claude Code API error: ${response.status} - ${errorText}`);
      }

      // Stream the response
      let content = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            const data = line.replace(/^data: /, '');
            if (data.trim() === '[DONE]') {
              // Finalize panel and reload
              await this.finalizePanel(metadata, content, panelWindow);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                const deltaContent = parsed.choices[0].delta.content;
                content += deltaContent;
                panelWindow.webContents.send('stream-data', deltaContent);
              }
            } catch (error) {
              // Ignore JSON parse errors
            }
          }
        }
      }

      // If we reach here without [DONE], finalize anyway
      await this.finalizePanel(metadata, content, panelWindow);

    } catch (error) {
      console.error('Error communicating with Claude Code:', error);
      throw error;
    }
  }

  /**
   * Finalize panel enhancement
   * @param {Object} metadata - Panel metadata
   * @param {string} content - Enhanced content
   * @param {BrowserWindow} panelWindow - Panel window
   * @returns {Promise<void>}
   */
  async finalizeEnhancement(metadata, content, panelWindow) {
    try {
      // Load the panel
      const stdlibPath = path.join(app.getPath('userData'), 'stdlib');
      const htmlPath = path.join(stdlibPath, metadata.id, 'index.html');

      // For complex builder, files are edited directly via Docker mount
      // No need to save content as AI has already modified files
      
      // Load the entry point HTML file
      panelWindow.loadFile(htmlPath);

      // Notify that streaming is done
      panelWindow.webContents.send('stream-end');
      
      // Clean up container after successful completion
      await this.stopContainer(`claude-code-enhance-${metadata.id}`);
      
    } catch (error) {
      console.error('Error finalizing enhancement:', error);
      throw error;
    }
  }

  /**
   * Finalize panel creation
   * @param {Object} metadata - Panel metadata
   * @param {string} content - Generated content
   * @param {BrowserWindow} panelWindow - Panel window
   * @returns {Promise<void>}
   */
  async finalizePanel(metadata, content, panelWindow) {
    try {
      // Load the panel
      const stdlibPath = path.join(app.getPath('userData'), 'stdlib');
      const htmlPath = path.join(stdlibPath, metadata.id, 'index.html');

      // For complex builder, files are created directly via Docker mount
      // No need to save content as AI has already created files
      
      // Load the entry point HTML file
      panelWindow.loadFile(htmlPath);

      // Notify that streaming is done
      panelWindow.webContents.send('stream-end');
      
      // Clean up container after successful completion
      await this.stopContainer(`claude-code-${metadata.id}`);
      
    } catch (error) {
      console.error('Error finalizing panel:', error);
      throw error;
    }
  }

  /**
   * Stop and remove Docker container
   * @param {string} containerId - Container identifier
   * @returns {Promise<void>}
   */
  async stopContainer(containerId) {
    return new Promise((resolve) => {
      if (!this.activeContainers.has(containerId)) {
        resolve();
        return;
      }

      const containerInfo = this.activeContainers.get(containerId);
      const dockerArgs = ['stop', containerId];

      console.log('Stopping Docker container:', containerId);

      const dockerProcess = spawn('docker', dockerArgs);
      
      dockerProcess.on('close', (code) => {
        this.activeContainers.delete(containerId);
        console.log(`Container ${containerId} stopped`);
        resolve();
      });

      dockerProcess.on('error', (error) => {
        console.error('Error stopping container:', error);
        this.activeContainers.delete(containerId);
        resolve(); // Don't reject, just log the error
      });
    });
  }

  /**
   * Clean up all active containers (called on app exit)
   * @returns {Promise<void>}
   */
  async cleanup() {
    const cleanupPromises = Array.from(this.activeContainers.keys()).map(
      containerId => this.stopContainer(containerId)
    );
    
    await Promise.all(cleanupPromises);
    console.log('All Claude Code containers cleaned up');
  }
}

module.exports = ComplexBuilder;
