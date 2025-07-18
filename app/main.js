const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import the builder factory
const BuilderFactory = require('./builders/builder-factory');
const builderFactory = new BuilderFactory();

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
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
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
  loadApplets(); // Load applets and panels from new file system
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

// Clean up builders when app is quitting
app.on('before-quit', async () => {
  console.log('App is quitting, cleaning up builders...');
  try {
    await builderFactory.cleanup();
  } catch (error) {
    console.error('Error during builder cleanup:', error);
  }
});

// Data persistence paths
const appletsDataPath = path.join(app.getPath('userData'), 'applets.json');
const stdlibPath = path.join(app.getPath('userData'), 'stdlib');
console.log('Applets data path:', appletsDataPath);
console.log('Stdlib path:', stdlibPath);

// Ensure stdlib directory exists
if (!fs.existsSync(stdlibPath)) {
  fs.mkdirSync(stdlibPath, { recursive: true });
  console.log('Created stdlib directory');
}

// Load applets and panels from new file system
function loadApplets() {
  try {
    // Load applets metadata
    if (fs.existsSync(appletsDataPath)) {
      const data = fs.readFileSync(appletsDataPath, 'utf8');
      const loadedApplets = JSON.parse(data);
      Object.assign(applets, loadedApplets);
      console.log('Applets loaded from disk:', Object.keys(applets).length);
    }

    // Load panels from stdlib directory
    if (fs.existsSync(stdlibPath)) {
      const panelDirs = fs.readdirSync(stdlibPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const panelId of panelDirs) {
        const panelDir = path.join(stdlibPath, panelId);
        const packageJsonPath = path.join(panelDir, 'package.json');
        
        if (fs.existsSync(packageJsonPath)) {
          try {
            const packageData = fs.readFileSync(packageJsonPath, 'utf8');
            const panelMetadata = JSON.parse(packageData);
            panels[panelId] = panelMetadata;
            console.log('Panel loaded:', panelId);
          } catch (error) {
            console.error(`Error loading panel ${panelId}:`, error);
          }
        }
      }
      console.log('Panels loaded from stdlib:', Object.keys(panels).length);
    }
  } catch (error) {
    console.error('Error loading applets:', error);
  }
}

// Save applets to disk
function saveApplets() {
  try {
    fs.writeFileSync(appletsDataPath, JSON.stringify(applets, null, 2));
    console.log('Applets saved to disk');
  } catch (error) {
    console.error('Error saving applets:', error);
  }
}

// Save panel to stdlib directory
function savePanel(panelId, metadata, htmlContent = null) {
  try {
    const panelDir = path.join(stdlibPath, panelId);
    
    // Create panel directory if it doesn't exist
    if (!fs.existsSync(panelDir)) {
      fs.mkdirSync(panelDir, { recursive: true });
    }

    // Save package.json with metadata
    const packageJsonPath = path.join(panelDir, 'package.json');
    fs.writeFileSync(packageJsonPath, JSON.stringify(metadata, null, 2));

    // Save index.html for build type panels
    if (htmlContent && metadata.type === 'build') {
      const indexHtmlPath = path.join(panelDir, 'index.html');
      fs.writeFileSync(indexHtmlPath, htmlContent);
      console.log('Panel HTML saved:', panelId);
    }

    console.log('Panel metadata saved:', panelId);
  } catch (error) {
    console.error('Error saving panel:', error);
  }
}

// Delete panel from stdlib directory
function deletePanel(panelId) {
  try {
    const panelDir = path.join(stdlibPath, panelId);
    if (fs.existsSync(panelDir)) {
      fs.rmSync(panelDir, { recursive: true, force: true });
      console.log('Panel directory deleted:', panelId);
    }
  } catch (error) {
    console.error('Error deleting panel directory:', error);
  }
}

// Get panel HTML file path
function getPanelHtmlPath(panelId) {
  return path.join(stdlibPath, panelId, 'index.html');
}

let systemPromptCache = {};
function tryPrependWithSystemFile(systemPromptFile, messages) {
  if (!systemPromptFile || systemPromptFile.length < 1) {
    return messages;
  }

  if (!systemPromptCache[systemPromptFile]) {
    try {
      const systemPromptPath = path.join(__dirname, '..', systemPromptFile);
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

// Trigger enhancement modal in React app
function createEnhanceWindow(panelId, currentContent) {
  // Instead of creating a new window, send message to main window to show modal
  if (mainWindow) {
    mainWindow.webContents.send('show-enhance-modal', { panelId, currentContent });
  }
}

const panels = {};
const applets = {};

// Handle getting all applets
ipcMain.handle('get-applets', () => {
  const appletValues = Object.values(applets);
  // Also send applets-updated event to ensure UI is synchronized
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('applets-updated', appletValues);
  }
  return appletValues;
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
    
    // Create applet wrapper for the panel metadata
    const appletId = Date.now().toString();
    const applet = {
      id: appletId,
      caption: metadata.title || metadata.name || 'Untitled',
      color: metadata.color,
      panels: [metadata.id]
    };
    
    // Store panel and applet
    panels[metadata.id] = metadata;
    applets[appletId] = applet;
    
    // Save applet metadata only (builders will handle panel content)
    saveApplets();
    
    // Notify the main window about the applet update
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('applets-updated', Object.values(applets));
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
      // Only save metadata (package.json), builders handle content
      const panelDir = path.join(stdlibPath, metadata.id);
      if (!fs.existsSync(panelDir)) {
        fs.mkdirSync(panelDir, { recursive: true });
      }
      const packageJsonPath = path.join(panelDir, 'package.json');
      fs.writeFileSync(packageJsonPath, JSON.stringify(panels[metadata.id], null, 2));
      console.log('Panel size saved:', metadata.id, bounds.width - 40, bounds.height - 60);
    });

    // Add menu bar for build type panels
    if (metadata.type === 'build') {
      const menuTemplate = [
        {
          label: 'Enhance',
          click: () => {
            const htmlPath = getPanelHtmlPath(metadata.id);
            if (fs.existsSync(htmlPath)) {
              const currentContent = fs.readFileSync(htmlPath, 'utf8');
              createEnhanceWindow(metadata.id, currentContent);
            }
          }
        },
        {
          label: 'DevTools',
          click: () => {
            panelWindow.webContents.openDevTools();
          }
        }
      ];
      const menu = Menu.buildFromTemplate(menuTemplate);
      panelWindow.setMenu(menu);
    }

    if (metadata.type === 'web') {
      panelWindow.loadURL(metadata.alpha);
    } else {
      // Load the React app with loading state
      const loadingURL = `file://${path.join(__dirname, '../dist/index.html')}?mode=loading&panelId=${metadata.id}&title=${encodeURIComponent(metadata.title)}`;
      panelWindow.loadURL(loadingURL);

      // Use the builder factory to handle panel creation based on complexity
      (async () => {
        try {
          console.log(`Building panel with complexity: ${metadata.complexity || 'unknown'}`);
          await builderFactory.build(metadata, request, panelWindow, tryPrependWithSystemFile);
        } catch (error) {
          console.error('Error building panel:', error);
          // Show error in panel window using React component
          const errorURL = `file://${path.join(__dirname, '../dist/index.html')}?mode=error&message=${encodeURIComponent(error.message)}`;
          panelWindow.loadURL(errorURL);
        }
      })();
    }
    return metadata;
  } catch (error) {
    console.error('Error in add-panel:', error);
    return { error: error.message };
  }
});

// Handle saving content for panels
ipcMain.handle('save-content', (event, panelId, content) => {
  try {
    if (panels[panelId]) {
      // Check if HTML file already exists - don't overwrite existing content
      const htmlPath = getPanelHtmlPath(panelId);
      if (fs.existsSync(htmlPath)) {
        console.log('HTML file already exists for panel:', panelId, '- skipping save to prevent overwrite');
        return true;
      }
      
      // Save HTML content to file only if it doesn't exist
      savePanel(panelId, panels[panelId], content);
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

// Handle panel enhancement
ipcMain.handle('enhance-panel', async (event, panelId, userInput) => {
  try {
    const panel = panels[panelId];
    if (!panel || panel.type !== 'build') {
      throw new Error('Panel not found or not a build type panel');
    }

    const complexity = panel.complexity || 1;
    console.log(`Enhancing panel ${panelId} with complexity ${complexity}`);

    let tempWindow = null;
    
    // Create temporary window for complex builder streaming
    if (complexity > (process.env.COMPLEX_RENDERER_THRESHOLD || 2)) {
      tempWindow = new BrowserWindow({
        width: 400,
        height: 300,
        show: false, // Hidden window for streaming
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: false,
          contextIsolation: true,
        }
      });

      const loadingHTML = `
        <!DOCTYPE html>
        <html>
          <head><title>Enhancement Processing</title></head>
          <body>
            <script>
              let rawData = '';
              window.electronAPI.onStreamData((data) => {
                rawData += data;
              });
              window.electronAPI.onStreamEnd(() => {
                console.log('Enhancement streaming completed');
              });
            </script>
            <div>Processing enhancement...</div>
          </body>
        </html>
      `;
      tempWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingHTML)}`);
    }

    // Use builder factory to handle enhancement (builders handle all file operations)
    await builderFactory.enhance(
      panel, 
      userInput, 
      tempWindow, 
      tryPrependWithSystemFile
    );

    // Close temporary window if created
    if (tempWindow && !tempWindow.isDestroyed()) {
      tempWindow.close();
    }
    
    // Find and update any open panel windows
    const allWindows = BrowserWindow.getAllWindows();
    for (const window of allWindows) {
      if (window.getTitle() === panel.title && !window.isDestroyed()) {
        const htmlPath = getPanelHtmlPath(panelId);
        if (fs.existsSync(htmlPath)) {
          window.loadFile(htmlPath);
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in enhance-panel:', error);
    return { error: error.message };
  }
});

// Handle applet deletion
ipcMain.handle('delete-applet', (event, appletId) => {
  try {
    const applet = applets[appletId];
    if (applet) {
      // Delete all panels associated with this applet
      applet.panels.forEach(panelId => {
        if (panels[panelId]) {
          deletePanel(panelId);
          delete panels[panelId];
          console.log('Panel deleted from applet:', panelId);
        }
      });
      
      // Delete the applet itself
      delete applets[appletId];
      saveApplets();
      console.log('Applet deleted:', appletId);
      
      // Notify the main window about the update
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('applets-updated', Object.values(applets));
      }
      
      return { success: true };
    } else {
      return { error: 'Applet not found' };
    }
  } catch (error) {
    console.error('Error deleting applet:', error);
    return { error: error.message };
  }
});

// Handle applet reopening (opens the first panel of the applet)
ipcMain.handle('reopen-applet', (event, appletId) => {
  try {
    const applet = applets[appletId];
    if (applet && applet.panels.length > 0) {
      // For now, just open the first panel in the applet
      const firstPanelId = applet.panels[0];
      const panel = panels[firstPanelId];
      
      if (panel) {
        const panelWindow = new BrowserWindow({
          width: panel.initialWidth || 800,
          height: panel.initialHeight || 600,
          title: panel.title || panel.name || applet.caption,
          webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
          }
        });

        // Save window size when closing
        panelWindow.on('close', () => {
          const bounds = panelWindow.getBounds();
          panels[firstPanelId].initialWidth = bounds.width;
          panels[firstPanelId].initialHeight = bounds.height;
          // Only save metadata (package.json), builders handle content
          const panelDir = path.join(stdlibPath, firstPanelId);
          if (!fs.existsSync(panelDir)) {
            fs.mkdirSync(panelDir, { recursive: true });
          }
          const packageJsonPath = path.join(panelDir, 'package.json');
          fs.writeFileSync(packageJsonPath, JSON.stringify(panels[firstPanelId], null, 2));
          console.log('Panel size saved:', firstPanelId, bounds.width, bounds.height);
        });

        // Add menu bar for build type panels
        if (panel.type === 'build') {
          const menuTemplate = [
            {
              label: 'Enhance',
              click: () => {
                const htmlPath = getPanelHtmlPath(firstPanelId);
                if (fs.existsSync(htmlPath)) {
                  const currentContent = fs.readFileSync(htmlPath, 'utf8');
                  createEnhanceWindow(firstPanelId, currentContent);
                }
              }
            },
            {
              label: 'DevTools',
              click: () => {
                panelWindow.webContents.openDevTools();
              }
            }
          ];
          const menu = Menu.buildFromTemplate(menuTemplate);
          panelWindow.setMenu(menu);
        }

        if (panel.type === 'web') {
          panelWindow.loadURL(panel.alpha);
        } else {
          // Load from HTML file if it exists
          const htmlPath = getPanelHtmlPath(firstPanelId);
          if (fs.existsSync(htmlPath)) {
            panelWindow.loadFile(htmlPath);
          } else {
            // Load React app with loading state if no content exists
            const loadingURL = `file://${path.join(__dirname, '../dist/index.html')}?mode=loading&title=${encodeURIComponent(panel.name || applet.caption)}`;
            panelWindow.loadURL(loadingURL);
          }
        }
        
        return { success: true };
      } else {
        return { error: 'Panel not found' };
      }
    } else {
      return { error: 'Applet not found or has no panels' };
    }
  } catch (error) {
    console.error('Error reopening applet:', error);
    return { error: error.message };
  }
});

// Handle getting available panels from stdlib that are not used in any applet
ipcMain.handle('get-available-panels', () => {
  try {
    // Get all panel IDs that are already used in applets
    const usedPanelIds = new Set();
    Object.values(applets).forEach(applet => {
      applet.panels.forEach(panelId => usedPanelIds.add(panelId));
    });

    // Get all available panels that are not used
    const availablePanels = Object.entries(panels)
      .filter(([panelId, panel]) => !usedPanelIds.has(panelId))
      .map(([panelId, panel]) => ({
        id: panelId,
        name: panel.title || panel.name || panelId,
        description: panel.description || 'No description available',
        type: panel.type || 'build'
      }));

    return availablePanels;
  } catch (error) {
    console.error('Error getting available panels:', error);
    return [];
  }
});

// Handle importing a panel as a new applet
ipcMain.handle('import-panel', (event, panelId) => {
  try {
    const panel = panels[panelId];
    if (!panel) {
      return { error: 'Panel not found' };
    }

    // Check if panel is already used in an applet
    const isUsed = Object.values(applets).some(applet => 
      applet.panels.includes(panelId)
    );
    
    if (isUsed) {
      return { error: 'Panel is already used in an applet' };
    }

    // Create new applet wrapper for the panel
    const appletId = Date.now().toString();
    const colors = [
      '#10b981', '#ef4444', '#eab308', '#a855f7',
      '#6b7280', '#f97316', '#3b82f6', '#6366f1',
      '#ec4899', '#14b8a6', '#06b6d4', '#10b981'
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const applet = {
      id: appletId,
      caption: panel.title || panel.name || 'Imported Panel',
      color: color,
      panels: [panelId]
    };
    
    // Store the applet
    applets[appletId] = applet;
    saveApplets();
    
    // Notify the main window about the applet update
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('applets-updated', Object.values(applets));
    }
    
    return { success: true, applet: applet };
  } catch (error) {
    console.error('Error importing panel:', error);
    return { error: error.message };
  }
});

// Handle app visibility toggle for tray menu
ipcMain.handle('toggle-visibility', () => {
  if (mainWindow) {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      showWindowNearTray();
    }
  }
});

// Handle app exit for tray menu
ipcMain.handle('exit-app', () => {
  app.isQuiting = true;
  app.quit();
});
