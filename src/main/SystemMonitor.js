const si = require('systeminformation');

let monitorInterval = null;

function startSystemMonitor(mainWindow) {
  if (monitorInterval) clearInterval(monitorInterval);

  // Poll every 5 seconds
  monitorInterval = setInterval(async () => {
    if (mainWindow.isDestroyed()) {
      clearInterval(monitorInterval);
      return;
    }

    try {
      const [osInfo, cpu, cpuTemp, mem, fsSize, graphics] = await Promise.all([
        si.osInfo(),
        si.cpu(),
        si.cpuTemperature(),
        si.mem(),
        si.fsSize(),
        si.graphics()
      ]);

      // Calculate RAM
      const ramTotalGB = (mem.total / (1024 ** 3)).toFixed(1);
      const ramUsedGB = (mem.active / (1024 ** 3)).toFixed(1);
      const ramPercent = Math.round((mem.active / mem.total) * 100);

      // CPU
      const cpuLoad = await si.currentLoad();
      const cpuUsage = Math.round(cpuLoad.currentLoad);
      const cpuName = cpu.brand;
      const cpuTemperature = cpuTemp.main > 0 ? `${Math.round(cpuTemp.main)}°C` : 'N/A';

      // GPU
      let gpuName = 'N/A';
      let gpuTemp = 'N/A';
      if (graphics.controllers && graphics.controllers.length > 0) {
        // Prefer dedicated GPU if available
        const gpu = graphics.controllers.find(g => g.vram > 100) || graphics.controllers[0];
        gpuName = gpu.model;
        if (gpu.temperatureGpu) gpuTemp = `${Math.round(gpu.temperatureGpu)}°C`;
      }

      // Storage (Main Drive)
      let storageUsed = 'N/A';
      let storageTotal = 'N/A';
      if (fsSize && fsSize.length > 0) {
        const mainDrive = fsSize[0];
        storageTotal = (mainDrive.size / (1024 ** 3)).toFixed(0);
        storageUsed = (mainDrive.used / (1024 ** 3)).toFixed(0);
      }

      const metrics = {
        device: osInfo.hostname,
        os: osInfo.distro,
        cpuName,
        cpuUsage: `${cpuUsage}%`,
        cpuTemp: cpuTemperature,
        ram: `${ramUsedGB} / ${ramTotalGB} GB (${ramPercent}%)`,
        gpuName,
        gpuTemp,
        storage: `${storageUsed} / ${storageTotal} GB`
      };

      mainWindow.webContents.send('sys-metrics', metrics);
    } catch (error) {
      console.error("[SystemMonitor] Error fetching metrics:", error.message);
    }
  }, 5000);
}

function stopSystemMonitor() {
  if (monitorInterval) clearInterval(monitorInterval);
}

module.exports = { startSystemMonitor, stopSystemMonitor };
