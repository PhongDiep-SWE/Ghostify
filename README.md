# Ghostify

A transparent, always-on-top note overlay for interviews and meetings. Ghostify floats silently above all your apps so you can glance at your key points without switching tabs or using a second monitor, and it stays invisible to screen sharing, so only you can see it.

---

## Demo

[Watch demo](https://drive.google.com/file/d/1wl3dFQubQj0Tr49i7tel9imFA-gCWT-h/view?usp=sharing)

---

## Download

| Platform               | Link                                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| macOS (Apple Silicon) | [Ghostify-1.0.0-arm64.dmg](https://github.com/PhongDiep-SWE/Ghostify/releases/download/v1.0.0/Ghostify-1.0.0-arm64.dmg) |
| Windows               | [Ghostify.Setup.1.0.0.exe](https://github.com/PhongDiep-SWE/Ghostify/releases/download/v1.0.1/Ghostify.Setup.1.0.0.exe)               |

---

## Tech Stack

- Electron
- React 19
- Vite
- Tailwind CSS
- Framer Motion
- electron-store

---

## Development & Building

If you want to clone the repository and run or build the application locally, follow these steps.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Setup
Clone the repository and install the required dependencies:
```bash
git clone <this_repository_url>
cd Ghostify
npm install
```

### 2. Run Locally (Development)
```bash
npm run dev
```

### 3. Build Production Package For Windows
The built assets will appear in the dist/ directory.
```bash
npm run package:win
```
