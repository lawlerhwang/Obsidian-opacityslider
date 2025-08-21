const { Plugin, addIcon } = require('obsidian');

// 自定义图标SVG
const OPACITY_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
	<circle cx="12" cy="12" r="10"/>
	<path d="M12 2a10 10 0 0 0 0 20z"/>
</svg>`;

const DEFAULT_SETTINGS = {
	currentOpacity: 1.0
};

class OpacitySliderPlugin extends Plugin {
	constructor() {
		super(...arguments);
		this.opacityControlEl = null;
		this.sliderEl = null;
		this.valueDisplayEl = null;
		this.isControlVisible = false;
	}

	async onload() {
		// 加载设置
		await this.loadSettings();

		// 注册自定义图标
		addIcon('opacity-control', OPACITY_ICON);

		// 添加功能区图标
		this.addRibbonIcon('opacity-control', 'OpacitySlider - 透明度控制', () => {
			this.toggleOpacityControl();
		});

		// 创建透明度控制界面
		this.createOpacityControl();

		// 应用保存的透明度设置
		this.applyOpacity(this.settings.currentOpacity);

		// 监听文档点击事件，用于关闭控制界面
		document.addEventListener('click', this.handleDocumentClick.bind(this));
	}

	onunload() {
		// 恢复默认透明度
		this.applyOpacity(1.0);

		// 移除控制界面
		if (this.opacityControlEl) {
			this.opacityControlEl.remove();
		}

		// 移除事件监听器
		document.removeEventListener('click', this.handleDocumentClick.bind(this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	createOpacityControl() {
		// 创建主容器
		this.opacityControlEl = document.createElement('div');
		this.opacityControlEl.className = 'opacityslider-opacity-control';
		this.opacityControlEl.style.display = 'none';

		// 创建标题
		const titleEl = document.createElement('div');
		titleEl.className = 'opacityslider-title';
		titleEl.textContent = '界面透明度';
		this.opacityControlEl.appendChild(titleEl);

		// 创建滑块容器
		const sliderContainer = document.createElement('div');
		sliderContainer.className = 'opacityslider-slider-container';

		// 创建滑块
		this.sliderEl = document.createElement('input');
		this.sliderEl.type = 'range';
		this.sliderEl.min = '5';
		this.sliderEl.max = '100';
		this.sliderEl.value = String(this.settings.currentOpacity * 100);
		this.sliderEl.className = 'opacityslider-slider';

		// 创建数值显示
		this.valueDisplayEl = document.createElement('div');
		this.valueDisplayEl.className = 'opacityslider-value';
		this.valueDisplayEl.textContent = `${Math.round(this.settings.currentOpacity * 100)}%`;

		// 组装滑块容器
		sliderContainer.appendChild(this.sliderEl);
		sliderContainer.appendChild(this.valueDisplayEl);
		this.opacityControlEl.appendChild(sliderContainer);

		// 添加到文档
		document.body.appendChild(this.opacityControlEl);

		// 绑定滑块事件
		this.sliderEl.addEventListener('input', this.handleSliderChange.bind(this));

		// 阻止点击事件冒泡
		this.opacityControlEl.addEventListener('click', (e) => {
			e.stopPropagation();
		});
	}

	toggleOpacityControl() {
		if (!this.opacityControlEl) return;

		this.isControlVisible = !this.isControlVisible;

		if (this.isControlVisible) {
			this.showOpacityControl();
		} else {
			this.hideOpacityControl();
		}
	}

	showOpacityControl() {
		if (!this.opacityControlEl) return;

		// 显示控制界面
		this.opacityControlEl.style.display = 'block';

		// 定位到功能区图标附近
		const ribbonEl = document.querySelector('.side-dock-ribbon');
		if (ribbonEl) {
			const rect = ribbonEl.getBoundingClientRect();
			this.opacityControlEl.style.left = `${rect.right + 10}px`;
			this.opacityControlEl.style.top = `${rect.top + 50}px`;
		}

		// 添加显示动画
		this.opacityControlEl.classList.add('opacityslider-show');
	}

	hideOpacityControl() {
		if (!this.opacityControlEl) return;

		this.opacityControlEl.classList.remove('opacityslider-show');
		setTimeout(() => {
			if (this.opacityControlEl) {
				this.opacityControlEl.style.display = 'none';
			}
		}, 200);
	}

	handleSliderChange(event) {
		const target = event.target;
		const value = parseInt(target.value) / 100;

		// 更新透明度
		this.applyOpacity(value);

		// 更新显示值
		if (this.valueDisplayEl) {
			this.valueDisplayEl.textContent = `${Math.round(value * 100)}%`;
		}

		// 保存设置
		this.settings.currentOpacity = value;
		this.saveSettings();
	}

	applyOpacity(opacity) {
		// 确保透明度在有效范围内
		opacity = Math.max(0.05, Math.min(1.0, opacity));

		// 尝试使用Electron API设置窗口透明度
		try {
			if (window.require) {
				const { remote } = window.require('electron');
				if (remote && remote.getCurrentWindow) {
					const win = remote.getCurrentWindow();
					if (win && win.setOpacity) {
						win.setOpacity(opacity);
						return;
					}
				}
			}
		} catch (e) {
			// Electron API不可用，使用DOM方法
		}

		// 备用方案：应用到document.body
		if (document.body) {
			document.body.style.opacity = String(opacity);
			// 确保控制面板保持完全可见
			if (this.opacityControlEl) {
				this.opacityControlEl.style.opacity = '1';
			}
		}
	}

	handleDocumentClick(event) {
		// 如果点击的不是控制界面，则隐藏它
		if (this.isControlVisible && this.opacityControlEl) {
			const target = event.target;
			if (!this.opacityControlEl.contains(target)) {
				this.isControlVisible = false;
				this.hideOpacityControl();
			}
		}
	}
}

module.exports = OpacitySliderPlugin;