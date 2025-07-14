const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let mainWindow;
let tray;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    show: false, // Start hidden
    frame: false, // Remove window frame
    resizable: false,
    alwaysOnTop: true, // Keep on top
    skipTaskbar: true, // Don't show in taskbar
    transparent: true, // Allow transparency
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools for debugging
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Hide window instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Hide window when it loses focus (click outside)
  mainWindow.on('blur', () => {
    mainWindow.hide();
  });
}

function showWindowNearTray() {
  const trayBounds = tray.getBounds();
  const windowBounds = mainWindow.getBounds();
  
  // Calculate position above tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
  const y = Math.round(trayBounds.y - windowBounds.height - 10); // 10px gap
  
  mainWindow.setPosition(x, y);
  mainWindow.show();
  mainWindow.focus();
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'tray.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide',
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          showWindowNearTray();
        }
      }
    },
    {
      label: 'Exit',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Nikitos');
  tray.setContextMenu(contextMenu);
  
  // Click to toggle window
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      showWindowNearTray();
    }
  });
}

app.whenReady().then(() => {
  loadPanels(); // Load panels from disk on startup
  createWindow();
  createTray();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  // Don't quit the app when all windows are closed, keep it running in tray
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
});

// Data persistence
const dataPath = path.join(app.getPath('userData'), 'panels.json');
console.log('Data path:', dataPath);

// Load panels from disk
function loadPanels() {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      const loadedPanels = JSON.parse(data);
      Object.assign(panels, loadedPanels);
      console.log('Panels loaded from disk:', Object.keys(panels).length);
    }
  } catch (error) {
    console.error('Error loading panels:', error);
  }
}

// Save panels to disk
function savePanels() {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(panels, null, 2));
    console.log('Panels saved to disk');
  } catch (error) {
    console.error('Error saving panels:', error);
  }
}

let systemPromptCache = {};
function tryPrependWithSystemFile(systemPromptFile, messages) {
  if (!systemPromptCache[systemPromptFile]) {
    try {
      const systemPromptPath = path.join(__dirname, systemPromptFile);
      if (fs.existsSync(systemPromptPath)) {
        const systemPromptContent = fs.readFileSync(systemPromptPath, 'utf8');
        systemPromptCache[systemPromptFile] = { role: 'system', content: systemPromptContent };
      } else {
        console.info(`System prompt file not found: ${systemPromptPath}`);
        systemPromptCache[systemPromptFile] = null;
      }
    } catch (error) {
      console.error('Error reading system prompt file:', error);
      systemPromptCache[systemPromptFile] = null;
    }
  }
  
  return systemPromptCache[systemPromptFile]
    ? [systemPromptCache[systemPromptFile], ...messages]
    : messages;
}

// Create enhancement window
function createEnhanceWindow(panelId, currentContent) {
  const enhanceWindow = new BrowserWindow({
    width: 500,
    height: 400,
    title: 'Enhance Panel',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  const enhanceHTML = `
    <!DOCTYPE html>
    <html style="height: 100%; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <head>
        <title>Enhance Panel</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            height: calc(100vh - 40px);
            background: #1a1a1a;
            color: #ffffff;
            display: flex;
            flex-direction: column;
          }
          .header {
            margin-bottom: 20px;
          }
          .header h2 {
            margin: 0 0 10px 0;
            color: #ffffff;
            font-size: 18px;
          }
          .header p {
            margin: 0;
            color: #9ca3af;
            font-size: 14px;
          }
          .input-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            margin-bottom: 20px;
          }
          textarea {
            flex: 1;
            background: #2d2d2d;
            border: 1px solid #404040;
            border-radius: 8px;
            color: #ffffff;
            padding: 15px;
            font-size: 14px;
            font-family: inherit;
            resize: none;
            outline: none;
          }
          textarea:focus {
            border-color: #2563eb;
          }
          textarea::placeholder {
            color: #9ca3af;
          }
          .button-container {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
          }
          button {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            font-family: inherit;
          }
          .cancel-btn {
            background: #374151;
            color: #ffffff;
          }
          .cancel-btn:hover {
            background: #4b5563;
          }
          .enhance-btn {
            background: #2563eb;
            color: #ffffff;
          }
          .enhance-btn:hover {
            background: #1d4ed8;
          }
          .enhance-btn:disabled {
            background: #374151;
            cursor: not-allowed;
          }
          .loading {
            display: none;
            align-items: center;
            gap: 10px;
            color: #9ca3af;
            font-size: 14px;
          }
          .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid #374151;
            border-top: 2px solid #2563eb;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Enhance Panel</h2>
          <p>Describe how you want to improve the current panel content</p>
        </div>
        
        <div class="input-container">
          <textarea 
            id="enhanceInput" 
            placeholder="Enter your enhancement instructions here..."
            autofocus
          ></textarea>
        </div>
        
        <div class="loading" id="loadingIndicator">
          <div class="spinner"></div>
          <span>Enhancing panel...</span>
        </div>
        
        <div class="button-container">
          <button class="cancel-btn" onclick="window.close()">Cancel</button>
          <button class="enhance-btn" id="enhanceBtn" onclick="enhancePanel()">Enhance</button>
        </div>

        <script>
          const panelId = '${panelId}';
          
          function enhancePanel() {
            const input = document.getElementById('enhanceInput');
            const enhanceBtn = document.getElementById('enhanceBtn');
            const loadingIndicator = document.getElementById('loadingIndicator');
            
            if (!input.value.trim()) return;
            
            enhanceBtn.disabled = true;
            loadingIndicator.style.display = 'flex';
            
            window.electronAPI.enhancePanel(panelId, input.value.trim())
              .then(() => {
                window.close();
              })
              .catch((error) => {
                console.error('Enhancement failed:', error);
                enhanceBtn.disabled = false;
                loadingIndicator.style.display = 'none';
                alert('Enhancement failed. Please try again.');
              });
          }
          
          // Allow Enter+Ctrl to submit
          document.getElementById('enhanceInput').addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
              enhancePanel();
            }
          });
        </script>
      </body>
    </html>
  `;

  enhanceWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(enhanceHTML)}`);
}

const panels = {};

// Handle getting all panels
ipcMain.handle('get-panels', () => {
  const panelValues = Object.values(panels);
  // Also send panels-updated event to ensure UI is synchronized
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('panels-updated', panelValues);
  }
  return panelValues;
});

// Handle creating a new panel with just a name
ipcMain.handle('create-panel', async (event, name) => {
  const panelId = Date.now().toString();
  const colors = [
    '#10b981', '#ef4444', '#eab308', '#a855f7',
    '#6b7280', '#f97316', '#3b82f6', '#6366f1',
    '#ec4899', '#14b8a6', '#06b6d4', '#10b981'
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  
  const newPanel = {
    id: panelId,
    name: name,
    color: randomColor
  };
  panels[panelId] = newPanel;
  savePanels(); // Save to disk
  
    // Notify only the main window about the update
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('panels-updated', Object.values(panels));
    }
  
  return newPanel;
});

ipcMain.handle('add-panel', async (event, request) => {
  try {
    const thinkerResponse = await fetch(process.env.OPENAI_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'User-Agent': 'NeutromeLabs/AiGateway',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_THINKER,
        messages: tryPrependWithSystemFile(process.env.OPENAI_THINKER_PROMPT, [
          { role: 'user', content: request },
        ])
      })
    });

    if (!thinkerResponse.ok) {
      console.error('Error fetching from thinker API:', await thinkerResponse.text());
      throw new Error(`HTTP error! status: ${thinkerResponse.status}`);
    }

    const thinkerData = await thinkerResponse.json();
    let content = thinkerData.choices[0].message.content;
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
    
    const metadata = JSON.parse(content);
    // Add color to metadata for consistency
    const colors = [
      '#10b981', '#ef4444', '#eab308', '#a855f7',
      '#6b7280', '#f97316', '#3b82f6', '#6366f1',
      '#ec4899', '#14b8a6', '#06b6d4', '#10b981'
    ];
    metadata.color = colors[Math.floor(Math.random() * colors.length)];
    panels[metadata.id] = metadata;
    savePanels(); // Save to disk
    
    // Notify only the main window about the update
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('panels-updated', Object.values(panels));
    }

    const panelWindow = new BrowserWindow({
      width: metadata.initialWidth + 40,
      height: metadata.initialHeight + 60,
      title: metadata.title,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    // Save window size when closing
    panelWindow.on('close', () => {
      const bounds = panelWindow.getBounds();
      panels[metadata.id].initialWidth = bounds.width - 40;
      panels[metadata.id].initialHeight = bounds.height - 60;
      savePanels();
      console.log('Panel size saved:', metadata.id, bounds.width - 40, bounds.height - 60);
    });

    // Add menu bar for build type panels
    if (metadata.type === 'build') {
      const menuTemplate = [
        {
          label: 'Edit',
          submenu: [
            {
              label: 'Enhance',
              click: () => {
                createEnhanceWindow(metadata.id, panels[metadata.id].content);
              }
            }
          ]
        }
      ];
      const menu = Menu.buildFromTemplate(menuTemplate);
      panelWindow.setMenu(menu);
    }

    if (metadata.type === 'web') {
      panelWindow.loadURL(metadata.alpha);
    } else {
      const loadingHTML = `
        <!DOCTYPE html>
        <html style="height: 100%; margin: 0; overflow: hidden;">
          <head>
            <title>${metadata.title}</title>
            <script>
              let rawData = '';
              const panelId = '${metadata.id}';
              window.electronAPI.onStreamData((data) => {
                rawData += data;
                document.body.innerText = rawData;
              });
              window.electronAPI.onStreamEnd(() => {
                document.body.innerHTML = \`<iframe src="data:text/html;charset=utf-8,\${encodeURIComponent(rawData)}" style="width:100%; height:100%; border:none;"></iframe>\`;
                window.electronAPI.saveContent(panelId, rawData);
              });
            </script>
          </head>
          <body style="display: flex; justify-content: center; align-items: center; height: 100%; margin: 0;">
            <h1>Loading...</h1>
          </body>
        </html>
      `;
      panelWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingHTML)}`);

      (async () => {
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
                panels[metadata.id].content = content;
                savePanels(); // Save to disk when content is complete
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
          console.error('Error fetching from API:', error);
        }
      })();
    }
    return metadata;
  } catch (error) {
    console.error('Error in add-panel:', error);
    return { error: error.message };
  }
});

ipcMain.handle('reopen-panel', (event, panelId) => {
  const panel = panels[panelId];
  if (panel) {
    const panelWindow = new BrowserWindow({
      width: panel.initialWidth,
      height: panel.initialHeight,
      title: panel.title,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    // Save window size when closing
    panelWindow.on('close', () => {
      const bounds = panelWindow.getBounds();
      panels[panelId].initialWidth = bounds.width;
      panels[panelId].initialHeight = bounds.height;
      savePanels();
      console.log('Panel size saved:', panelId, bounds.width, bounds.height);
    });

    // Add menu bar for build type panels
    if (panel.type === 'build') {
      const menuTemplate = [
        {
          label: 'Edit',
          submenu: [
            {
              label: 'Enhance',
              click: () => {
                createEnhanceWindow(panelId, panel.content);
              }
            }
          ]
        }
      ];
      const menu = Menu.buildFromTemplate(menuTemplate);
      panelWindow.setMenu(menu);
    }

    if (panel.type === 'web') {
      panelWindow.loadURL(panel.alpha);
    } else {
      panelWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(panel.content)}`);
    }
  }
});

// Handle saving content for panels
ipcMain.handle('save-content', (event, panelId, content) => {
  // Save content for the specific panel ID
  try {
    if (panels[panelId]) {
      panels[panelId].content = content;
      savePanels(); // Save to disk
      console.log('Content saved for panel:', panelId);
      return true;
    } else {
      console.error('Panel not found:', panelId);
      return false;
    }
  } catch (error) {
    console.error('Error saving content:', error);
    return false;
  }
});

// Handle panel deletion
ipcMain.handle('delete-panel', (event, panelId) => {
  try {
    if (panels[panelId]) {
      delete panels[panelId];
      savePanels(); // Save to disk
      console.log('Panel deleted:', panelId);
      
      // Notify the main window about the update
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('panels-updated', Object.values(panels));
      }
      
      return { success: true };
    } else {
      return { error: 'Panel not found' };
    }
  } catch (error) {
    console.error('Error deleting panel:', error);
    return { error: error.message };
  }
});

// Handle panel enhancement
ipcMain.handle('enhance-panel', async (event, panelId, userInput) => {
  try {
    const panel = panels[panelId];
    if (!panel || panel.type !== 'build') {
      throw new Error('Panel not found or not a build type panel');
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
        messages: [
          { role: 'user', content: panel.content },
          { role: 'user', content: userInput }
        ]
      })
    });

    if (!response.ok) {
      console.error('Error fetching from renderer API:', await response.text());
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const enhancedContent = data.choices[0].message.content;
    
    // Update panel content
    panels[panelId].content = enhancedContent;
    savePanels(); // Save to disk
    
    // Find and update any open panel windows
    const allWindows = BrowserWindow.getAllWindows();
    for (const window of allWindows) {
      if (window.getTitle() === panel.title && !window.isDestroyed()) {
        window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(enhancedContent)}`);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in enhance-panel:', error);
    return { error: error.message };
  }
});
