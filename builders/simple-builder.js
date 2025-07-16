const fs = require('fs');
const path = require('path');

/**
 * Simple AI Builder for low complexity panels (complexity <= 3)
 * Uses the existing OpenAI API approach
 */
class SimpleBuilder {
  constructor(config) {
    this.config = config;
  }

  /**
   * Build a panel using the simple OpenAI approach
   * @param {Object} metadata - Panel metadata from thinker
   * @param {string} request - Original user request
   * @param {BrowserWindow} panelWindow - The panel window to stream to
   * @param {Function} savePanel - Function to save panel content
   * @param {Function} tryPrependWithSystemFile - Function to add system prompts
   * @returns {Promise<void>}
   */
  async build(metadata, request, panelWindow, savePanel, tryPrependWithSystemFile) {
    try {
      // Check if HTML file already exists
      const htmlPath = path.join(process.env.STDLIB_PATH || path.join(require('electron').app.getPath('userData'), 'stdlib'), metadata.id, 'index.html');
      
      if (fs.existsSync(htmlPath)) {
        console.log(`Panel ${metadata.id} already has HTML content, loading existing file`);
        panelWindow.loadFile(htmlPath);
        panelWindow.webContents.send('stream-end');
        return;
      }

      const response = await fetch(process.env.OPENAI_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          'User-Agent': 'NeutromeLabs/AiGateway',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_RENDERER_FAST,
          messages: tryPrependWithSystemFile(process.env.OPENAI_RENDERER_FAST_PROMPT, [
            { role: 'user', content: request },
            { role: 'user', content: metadata.alpha },
          ]),
          stream: true
        })
      });

      if (!response.ok) {
        console.error('Error fetching from renderer API:', await response.text());
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let content = '';
      for await (const chunk of response.body) {
        const lines = new TextDecoder().decode(chunk).split('\n');
        const filtered = lines.filter(line => line.trim().startsWith('data: '));
        for (const line of filtered) {
          const data = line.replace(/^data: /, '');
          if (data.trim() === '[DONE]') {
            // Save HTML content to file and navigate to it
            savePanel(metadata.id, metadata, content);
            panelWindow.loadFile(htmlPath);
            panelWindow.webContents.send('stream-end');
            return;
          }
          try {
            const { choices } = JSON.parse(data);
            if (choices[0]?.delta?.content) {
              content += choices[0].delta.content;
              panelWindow.webContents.send('stream-data', choices[0].delta.content);
            }
          } catch (error) {
            // ignore json parse errors
          }
        }
      }
    } catch (error) {
      console.error('Error in simple builder:', error);
      throw error;
    }
  }
}

module.exports = SimpleBuilder;
