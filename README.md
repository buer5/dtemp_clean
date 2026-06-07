# DTempClean

> A lightning-fast, terminal-native CLI to reclaim your disk space from developer caches and system junk.

## Features

DTempClean offers two powerful, fully interactive modes operated directly from your terminal:

### 1. Project Cache Mode
Scans your current directory and all subdirectories for heavy developer cache folders.
- **Multithreaded Scanning**: Utilizes Node.js `worker_threads` to calculate sizes asynchronously without freezing the UI.
- **Auto-Detection**: Automatically identifies `.next`, `.nuxt`, `node_modules`, `target`, `dist`, `__pycache__`, and more.
- **Skip Calculation**: Press `Esc` while scanning to instantly skip heavy I/O size calculations for massive directories.
- **Safe Selection**: Explicitly select what to delete with an interactive checkbox list.

### 2. General Cache Mode (Powered by BleachBit)
A comprehensive system and application cache cleaner featuring a custom terminal Tree-View multi-select UI.
- **BleachBit Engine**: *Note: This mode heavily relies on the [BleachBit](https://github.com/bleachbit/bleachbit) core engine for secure system cleaning.* Python is required on your system to use this mode.
- **Hierarchical View**: Categorizes hundreds of cleaning targets (e.g., `[System] tmp`, `[Google Chrome] cache`) for easy parent/child selection.

## Installation & Usage

You can run the tool directly or install it globally via npm:

```bash
npm install -g .
```

Once installed, simply run the command from any directory:

```bash
dtmpc
```

### UI Controls
- `Up / Down`: Navigate through lists.
- `Space`: Select / Deselect items (toggles all children if pressed on a category in General Mode).
- `Enter / Return`: Confirm your selection and proceed with cleanup.
- `Ctrl + C`: Exit immediately.

## Multi-Language Support
DTempClean supports dynamic language switching on the fly. From the main menu, select **Project > Language** to switch between:
- English
- 日本語 (Japanese)
- 한국어 (Korean)
- 繁體中文 (Traditional Chinese)
- 简体中文 (Simplified Chinese)

## License

This project is licensed under the **GPL-3.0 License**. See the `LICENSE` file for more details. 

*Portions of the General Cache Mode rely on BleachBit, which is also distributed under the GPL-3.0 License.*