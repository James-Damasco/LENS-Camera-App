# LENS - AI Camera Studio

A premium, producation-ready AI-powered camera wen application built with modern HTML5, CSS3, and JavaScript.

---
## Features

### Core Camera
| Features | Status |
|----------|--------|
| Live camera preview | Working |
| Front/back camera switch | Working |
| Photo capture (JPEG) | Working |
| Video recording (WebM) | Working |
| Pinch-to-zoom (touch) | Working |
| Tap to focus (visual) | Working |
| Zoom controls (-/+) | Working|
| Grid overlay | Working |
| Countdown timer (3s / 10s) | Working|
| Flash / Torch toggle (mobile) | Working |
| Pro exposure slider | Working |
| Mirror Selfie (mobile) | Working |
| Recording timer display | Working |

### Filters & Effects
- Normal, Vivid, Vintage, B&W, Sepia
- Neon, Cyberpunk, VHS, Cinematic
- Cold, Warm, Fade, Chrome, Glitch
- **Filter intensity slider** (0-100%)

### AI Features
| Feature | Status |
|---------|--------|
| Face detection (TF.js Blazeface) | Working |
| Face count display | Working |
| Confidence score overlay | Working |
| QR Code scanner (jsQR) | Working |
| URL Detection from QR | Working |

### Gallery System
| Feature | Status |
|---------|--------|
| IndexedDB persistent storage | Working |
| Photogrid (3-column) | Working |
| Video thumbnails | Working |
| Favorite / Unfavorite | Working |
| Delete media | Working |
| Filters | Working |
| Download to device | Working |
| Web Share API | Working |

### Photo Editor
| Feature | Status |
|---------|--------|
| Brightness / Contrast | Working |
| Saturation / Hue | Working |
| Blur | Working | 
| 14 editor filters | Working |
| Rotate (90degress) | Working |
| Flip H/V | Working |
| Sticker overlay | Working |
| Text overlay | Working |
| Undo / Reset | Working |
| Save to Gallery | Working |

### Settings
| Feature | PWA Support |
|---------|-------------|
| Sound Effects Toggle |Installable on mobile / desktop |
| Mirror font camera toggle | Service Worker Caching |
| AI face detection toggle | Manifest with icon |
| GPS / location toggle (UI) | Offline-ready shell |
| Beauty filter toggle (UI) |

---
## Setup & Usage

### Option 1 - Direct Open (Simplest)
```bash
# Just open the file in a browser
open lens-camera-app.html
```
> Some browsers block camera access on
`file://` URLS.
> Use Option 2 for reliable camera access.

### Option 2 - Local Server Recommended
```bash
# Python3
python3 -m http.server 8080
# Then visit:
# http://localhost:8080/lens-camera-app.html
```

```bash
# Node.js(npx)
npx serve .
```

```bash
# PHP
php -S localhost:8080
```

### Option 3 - Deploy to Web
Upload `lens-camera-app.html` to any HTTPS host:
- **Netlify**: Drag & drop into netlify.com/drop
- **GitHub Pages**: Push to a repo and enable Pages
- **Vercel**" `vercel --prod`

> HTTPS is required for camera access in production.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` / `Enter` | Capture Photo / Stop Video |
| `→` Arrow | Next filter |
| `←` Arrow | Previous Filter |
| `F` | Flip Camera |
| `G` | Toggle grid overlay |
| `A` | Toggle AI face detection |
---
## Mobile Gestures
| Gestures | Action |
|----------|--------|
| Pinch in/out | Zoom Camera |
| Tap viewfinder | Focus ring |
| Swipe down gallery | Close gallery |

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| UI Frameworks | Vanilla JS (ES6+) |
| Styling | CSS3 + Custom Properties |
| Camera | MediaDevices API + WebRTC |
| Recording | MediaRecorder API |
| Filters | CSS Filter API + Canvas |
| AI Detection | TensorFlow.js + Blazeface |
| QR Scanning | jsQR library |
| Storage | IndexedDB |
| PWA | Service Worker + Web Manifest |
| Sharing | Web Share API |

---

## Architectures
[LENS Camera]/
├── CSS/              
│   ├── style.css             
├── frontend/            
│   ├── index.html/             
├── js/              
├── App.js        
├── Camera.js  
├── Database.js        
└── Editor.js
├── Filter.js          
├── Gallery.js          
├── Initialization.js            
└── Scan.js 
├── Settings.js         
├── sw.js           
├── UI.js           
└── Utility.js

## Browser Supports
| Browser          | Camera | Recording | AI | QR |
|------------------|--------|-----------|----|----|
| Chrome 90+       | ✅      | ✅         | ✅  | ✅  |
| Firefox 85+      | ✅      | ✅         | ✅  | ✅  |
| Safari 15+ (iOS) | ✅      | ⚠️         | ✅  | ✅  |
| Edge 90+         | ✅      | ✅         | ✅  | ✅  |
| Samsung Internet | ✅      | ✅         | ✅  |  ✅ |

> ⚠️ Safari/iOS: Video recording requires user interaction.
> ⚠️ Firefox: Flash/torch not supported via Constraints API.

---
