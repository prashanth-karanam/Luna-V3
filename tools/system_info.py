import json
import sys

def get_system_info():
    try:
        import psutil
        
        # Initialize process CPU stats before the 1-second interval
        for p in psutil.process_iter():
            try:
                p.cpu_percent(interval=None)
            except Exception:
                pass
                
        cpu = psutil.cpu_percent(interval=1)
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Battery might not exist on desktops
        battery = psutil.sensors_battery()
        batt_percent = battery.percent if battery else "N/A"
        batt_plugged = battery.power_plugged if battery else "N/A"
        
        # Get top processes if resource usage is somewhat high (e.g., > 50%)
        top_cpu = []
        top_mem = []
        if cpu > 50 or mem.percent > 50:
            processes = []
            for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                try:
                    processes.append(p.info)
                except Exception:
                    pass
            top_cpu = sorted(processes, key=lambda x: x.get('cpu_percent', 0) or 0, reverse=True)[:3]
            top_mem = sorted(processes, key=lambda x: x.get('memory_percent', 0) or 0, reverse=True)[:3]

        gpu_info = None
        try:
            import pynvml
            pynvml.nvmlInit()
            handle = pynvml.nvmlDeviceGetHandleByIndex(0)
            mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
            util_info = pynvml.nvmlDeviceGetUtilizationRates(handle)
            try:
                name = pynvml.nvmlDeviceGetName(handle)
                if isinstance(name, bytes):
                    name = name.decode('utf-8')
            except Exception:
                name = "Unknown NVIDIA GPU"
                
            gpu_info = {
                "name": name,
                "gpu_percent": util_info.gpu,
                "vram_total_gb": round(mem_info.total / (1024**3), 2),
                "vram_used_gb": round(mem_info.used / (1024**3), 2),
                "vram_percent": round((mem_info.used / mem_info.total) * 100, 1) if mem_info.total > 0 else 0
            }
            pynvml.nvmlShutdown()
        except ImportError:
            gpu_info = "pynvml not installed"
        except Exception as e:
            gpu_info = f"GPU info unavailable ({str(e)})"
        
        info = {
            "ok": True,
            "cpu_usage_percent": cpu,
            "ram_total_gb": round(mem.total / (1024**3), 2),
            "ram_used_gb": round(mem.used / (1024**3), 2),
            "ram_percent": mem.percent,
            "disk_total_gb": round(disk.total / (1024**3), 2),
            "disk_free_gb": round(disk.free / (1024**3), 2),
            "disk_percent": disk.percent,
            "battery_percent": batt_percent,
            "power_plugged": batt_plugged,
            "top_processes_cpu": top_cpu,
            "top_processes_mem": top_mem,
            "gpu_info": gpu_info
        }
        
        print(json.dumps(info))
    except ImportError:
        print(json.dumps({"error": "psutil is not installed. Please run: pip install psutil"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    get_system_info()
