# Pocket - PII Manager

A secure, offline personal information manager with AES-256 encryption. Keep your sensitive data safe on your device without relying on cloud storage.

## Features

- 🔒 **End-to-End Encryption**: AES-GCM-256 encryption for all private data
- 📱 **Progressive Web App**: Install on your phone or desktop
- 🔐 **PIN Protection**: Secure access with PIN and lockout policy
- 💾 **Local Storage**: All data stays on your device using IndexedDB
- 📂 **Multiple Categories**: Cards, Net Banking, Accounts, and Notes
- 🔍 **Smart Search**: Fuzzy search across all your data
- 📤 **Export/Import**: Encrypted backups for data portability
- 🌐 **Fully Offline**: Works completely without internet

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Security Features

- **PBKDF2 Key Derivation**: 300,000 iterations with SHA-256
- **AES-GCM-256**: Authenticated encryption for all private data
- **Lockout Policy**: Exponential backoff after failed PIN attempts
- **Auto-Lock**: Automatic locking after inactivity
- **Clipboard Security**: Auto-clear clipboard after 2 minutes
- **Web Crypto API**: Uses browser's native cryptography

## Technology Stack

- **React 18**: Modern UI library
- **TypeScript**: Type-safe code
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Beautiful icons
- **Fuse.js**: Fuzzy search
- **IndexedDB**: Browser storage
- **Web Crypto API**: Encryption

## Data Privacy

- ✅ All data stored locally in your browser
- ✅ No external API calls
- ✅ No analytics or tracking
- ✅ No cloud storage
- ✅ No account required
- ✅ Open source and transparent

## Deployment

### Deploy to Vercel (Recommended)

The easiest way to deploy Pocket is using Vercel:

#### Option 1: Deploy with Vercel CLI

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
# From your project directory
vercel

# For production deployment
vercel --prod
```

#### Option 2: Deploy via Vercel Dashboard

1. Push your code to GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Vercel will auto-detect Vite settings
6. Click **"Deploy"**

Your app will be live at: `https://your-project-name.vercel.app`

#### Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to **Domains**
3. Add your custom domain
4. Update DNS records as instructed

### Security Considerations

✅ **HTTPS Only**: Vercel provides HTTPS by default  
✅ **No Server-Side Code**: Static hosting means no server vulnerabilities  
✅ **Client-Side Encryption**: All encryption happens in your browser  
✅ **No Backend**: No database or API to compromise  
✅ **Local Storage**: Data never leaves your device  
✅ **Security Headers**: Configured in `vercel.json`  
✅ **Open Source**: Code is auditable by anyone

### Alternative Hosting Options

You can also host this on:

- **Netlify**: Drag and drop the `dist` folder or connect GitHub
- **GitHub Pages**: Use GitHub Actions workflow
- **Cloudflare Pages**: Connect your GitHub repository
- **Self-hosted**: Copy the `dist` folder to any web server

For all hosting options, ensure:
- HTTPS is enabled
- No server-side processing is added
- No analytics or tracking scripts are injected

## License

MIT License - Feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
