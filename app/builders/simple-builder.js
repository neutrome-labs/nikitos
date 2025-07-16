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
   * Enhance existing panel content using the simple OpenAI approach
   * @param {Object} metadata - Panel metadata
   * @param {string} userInput - User enhancement instructions
   * @param {Function} tryPrependWithSystemFile - Function to add system prompts
   * @returns {Promise<void>}
   */
  async enhance(metadata, userInput, tryPrependWithSystemFile) {
    // Read current HTML content
    const htmlPath = path.join(process.env.STDLIB_PATH || path.join(require('electron').app.getPath('userData'), 'stdlib'), metadata.id, 'index.html');
    
    if (!fs.existsSync(htmlPath)) {
      throw new Error('Panel HTML file not found');
    }
    
    const currentContent = fs.readFileSync(htmlPath, 'utf8');
    const enhancementRequest = `Current content:\n${currentContent}\n\nEnhancement request:\n${userInput}`;
    
    try {
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
            { role: 'user', content: enhancementRequest }
          ])
        })
      });

      if (!response.ok) {
        console.error('Error fetching from renderer API:', await response.text());
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const enhancedContent = data.choices[0].message.content;
      
      // Save enhanced content directly to file
      fs.writeFileSync(htmlPath, enhancedContent);
      console.log('Enhanced content saved for panel:', metadata.id);
      
    } catch (error) {
      console.error('Error in simple builder enhance:', error);
      throw error;
    }
  }

  /**
   * Build a panel using the simple OpenAI approach
   * @param {Object} metadata - Panel metadata from thinker
   * @param {string} request - Original user request
   * @param {BrowserWindow} panelWindow - The panel window to stream to
   * @param {Function} tryPrependWithSystemFile - Function to add system prompts
   * @returns {Promise<void>}
   */
  async build(metadata, request, panelWindow, tryPrependWithSystemFile) {
    try {
      const stdlibPath = process.env.STDLIB_PATH || path.join(require('electron').app.getPath('userData'), 'stdlib');
      const panelDir = path.join(stdlibPath, metadata.id);
      const htmlPath = path.join(panelDir, 'index.html');
      
      // Ensure panel directory exists
      if (!fs.existsSync(panelDir)) {
        fs.mkdirSync(panelDir, { recursive: true });
      }
      
      // Check if HTML file already exists
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
            // Save HTML content directly to file
            fs.writeFileSync(htmlPath, content);
            console.log('Panel HTML content saved:', metadata.id);
            
            // Load the file in the panel window
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
