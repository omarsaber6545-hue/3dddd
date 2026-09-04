const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Hardware acceleration & performance switches for 3D Three.js rendering
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#070a0c',
    autoHideMenuBar: true,
    title: 'St. Jude Memorial Hospital - 3D Horror Game',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: !app.isPackaged
    }
  });

  // Remove menu bar
  Menu.setApplicationMenu(null);

  // Load production build or dev server
  const distPath = path.join(__dirname, '../dist/index.html');
  const devUrl = process.env.VITE_DEV_SERVER_URL;

  if (!app.isPackaged && devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(distPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
