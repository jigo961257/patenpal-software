const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    openFile: (data) => ipcRenderer.send('dialog:openFile', data),
    saveFile: (data) => ipcRenderer.send('dialog:saveFile', data),
    getStatus: (callback) => ipcRenderer.on('update-status', callback) 
    // getStatus: () => {
    //     const result = ipcRenderer.sendSync('synchronous-message', 'ping')
    //     console.log(result) // prints "pong" in the DevTools console
    // }
})