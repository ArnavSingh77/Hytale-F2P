
class ClientUpdateManager {
    constructor() {
        this.updatePopupVisible = false;
        this.init();
    }

    init() {
        window.electronAPI.onUpdatePopup((updateInfo) => {
            this.showUpdatePopup(updateInfo);
        });

        // Listen for electron-updater events
        window.electronAPI.onUpdateAvailable((updateInfo) => {
            this.showUpdatePopup(updateInfo);
        });

        window.electronAPI.onUpdateDownloadProgress((progress) => {
            this.updateDownloadProgress(progress);
        });

        window.electronAPI.onUpdateDownloaded((updateInfo) => {
            this.showUpdateDownloaded(updateInfo);
        });

        this.checkForUpdatesOnDemand();
    }

    showUpdatePopup(updateInfo) {
        if (this.updatePopupVisible) return;

        this.updatePopupVisible = true;
        
        const popupHTML = `
            <div id="update-popup-overlay">
                <div class="update-popup-container update-popup-pulse">
                    <div class="update-popup-header">
                        <div class="update-popup-icon">
                            <i class="fas fa-download"></i>
                        </div>
                        <h2 class="update-popup-title">
                            NEW UPDATE AVAILABLE
                        </h2>
                    </div>

                    <div class="update-popup-versions">
                        <div class="version-row">
                            <span class="version-label">Current Version:</span>
                            <span class="version-current">${updateInfo.currentVersion || updateInfo.version || 'Unknown'}</span>
                        </div>
                        <div class="version-row">
                            <span class="version-label">New Version:</span>
                            <span class="version-new">${updateInfo.newVersion || updateInfo.version || 'Unknown'}</span>
                        </div>
                    </div>

                    <div class="update-popup-message">
                        A new version of Hytale F2P Launcher is available.<br>
                        <span id="update-status-text">Downloading update automatically...</span>
                    </div>

                    <div id="update-progress-container" style="display: none; margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.75rem; color: #9ca3af;">
                            <span id="update-progress-percent">0%</span>
                            <span id="update-progress-speed">0 KB/s</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden;">
                            <div id="update-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #3b82f6, #9333ea); transition: width 0.3s ease;"></div>
                        </div>
                        <div style="margin-top: 0.5rem; font-size: 0.75rem; color: #9ca3af; text-align: center;">
                            <span id="update-progress-size">0 MB / 0 MB</span>
                        </div>
                    </div>

                    <div id="update-buttons-container" style="display: none;">
                        <button id="update-install-btn" class="update-download-btn">
                            <i class="fas fa-check" style="margin-right: 0.5rem;"></i>
                            Install & Restart
                        </button>
                        <button id="update-download-btn" class="update-download-btn update-download-btn-secondary" style="margin-top: 0.75rem;">
                            <i class="fas fa-external-link-alt" style="margin-right: 0.5rem;"></i>
                            Manually Download
                        </button>
                    </div>

                    <div class="update-popup-footer">
                        This popup cannot be closed until you update the launcher
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', popupHTML);

        this.blockInterface();

        // Show progress container immediately (auto-download is enabled)
        const progressContainer = document.getElementById('update-progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }

        const installBtn = document.getElementById('update-install-btn');
        if (installBtn) {
            installBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                installBtn.disabled = true;
                installBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 0.5rem;"></i>Installing...';
                
                try {
                    await window.electronAPI.quitAndInstallUpdate();
                } catch (error) {
                    console.error('❌ Error installing update:', error);
                    installBtn.disabled = false;
                    installBtn.innerHTML = '<i class="fas fa-check" style="margin-right: 0.5rem;"></i>Install & Restart';
                }
            });
        }

        const downloadBtn = document.getElementById('update-download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                downloadBtn.disabled = true;
                downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 0.5rem;"></i>Opening GitHub...';
                
                try {
                    await window.electronAPI.openDownloadPage();
                    console.log('✅ Download page opened, launcher will close...');
                    
                    downloadBtn.innerHTML = '<i class="fas fa-check" style="margin-right: 0.5rem;"></i>Launcher closing...';
                    
                } catch (error) {
                    console.error('❌ Error opening download page:', error);
                    downloadBtn.disabled = false;
                    downloadBtn.innerHTML = '<i class="fas fa-external-link-alt" style="margin-right: 0.5rem;"></i>Manually Download';
                }
            });
        }

        const overlay = document.getElementById('update-popup-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            });
        }

        console.log('🔔 Update popup displayed with new style');
    }

    updateDownloadProgress(progress) {
        const progressBar = document.getElementById('update-progress-bar');
        const progressPercent = document.getElementById('update-progress-percent');
        const progressSpeed = document.getElementById('update-progress-speed');
        const progressSize = document.getElementById('update-progress-size');
        const statusText = document.getElementById('update-status-text');

        if (progressBar && progress) {
            const percent = Math.round(progress.percent || 0);
            progressBar.style.width = `${percent}%`;
            
            if (progressPercent) {
                progressPercent.textContent = `${percent}%`;
            }

            if (progressSpeed && progress.bytesPerSecond) {
                const speedMBps = (progress.bytesPerSecond / 1024 / 1024).toFixed(2);
                progressSpeed.textContent = `${speedMBps} MB/s`;
            }

            if (progressSize && progress.transferred && progress.total) {
                const transferredMB = (progress.transferred / 1024 / 1024).toFixed(2);
                const totalMB = (progress.total / 1024 / 1024).toFixed(2);
                progressSize.textContent = `${transferredMB} MB / ${totalMB} MB`;
            }

            if (statusText) {
                statusText.textContent = `Downloading update... ${percent}%`;
            }
        }
    }

    showUpdateDownloaded(updateInfo) {
        const statusText = document.getElementById('update-status-text');
        const progressContainer = document.getElementById('update-progress-container');
        const buttonsContainer = document.getElementById('update-buttons-container');

        if (statusText) {
            statusText.textContent = 'Update downloaded! Ready to install.';
        }

        if (progressContainer) {
            progressContainer.style.display = 'none';
        }

        if (buttonsContainer) {
            buttonsContainer.style.display = 'block';
        }

        console.log('✅ Update downloaded, ready to install');
    }

    blockInterface() {
        const mainContent = document.querySelector('.flex.w-full.h-screen');
        if (mainContent) {
            mainContent.classList.add('interface-blocked');
        }

        document.body.classList.add('no-select');

        document.addEventListener('keydown', this.blockKeyEvents.bind(this), true);
        
        document.addEventListener('contextmenu', this.blockContextMenu.bind(this), true);
        
        console.log('🚫 Interface blocked for update');
    }

    blockKeyEvents(event) {
        if (event.target.closest('#update-popup-overlay')) {
            if ((event.key === 'Enter' || event.key === ' ') && 
                event.target.id === 'update-download-btn') {
                return;
            }
            if (event.key !== 'Tab') {
                event.preventDefault();
                event.stopPropagation();
            }
            return;
        }
        
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
    }

    blockContextMenu(event) {
        if (!event.target.closest('#update-popup-overlay')) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }

    async checkForUpdatesOnDemand() {
        try {
            const updateInfo = await window.electronAPI.checkForUpdates();
            if (updateInfo.updateAvailable) {
                this.showUpdatePopup(updateInfo);
            }
            return updateInfo;
        } catch (error) {
            console.error('Error checking for updates:', error);
            return { updateAvailable: false, error: error.message };
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.updateManager = new ClientUpdateManager();
});

window.ClientUpdateManager = ClientUpdateManager;