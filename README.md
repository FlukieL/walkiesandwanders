# Walkies and Wanders with Becky - Website

A modern, responsive website for the Walkies and Wanders with Becky dog walking service, featuring seamless registration form embedding, Instagram integration, and smooth scroll animations.

## Features

- **Responsive Design**: Mobile-first approach with beautiful UI across all devices
- **Logo-based Theming**: Warm colour palette (burnt orange, beige, dark brown) matching the brand logo
- **Seamless Registration**: Embedded registration form with smooth iframe integration
- **Instagram Integration**: Instagram feed display and profile links
- **Smooth Animations**: Scroll-triggered animations using Intersection Observer API
- **Accessibility**: Respects user's reduced motion preferences

## File Structure

```
walkiesandwanders/
├── index.html          # Main HTML structure
├── styles.css          # Styling with logo-based theme
├── script.js           # Registration iframe, Instagram feed & scroll animations
├── server.py           # Waitress Python server for test hosting
├── requirements.txt    # Python dependencies
├── LogoCircle.png      # Brand logo (also used as favicon)
└── README.md           # This file
```

## Setup Instructions

### Prerequisites

- Python 3.7 or higher
- pip (Python package manager)

### Installation

1. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Start the local server:**

   ```bash
   python server.py
   ```

   Or specify a custom port:

   ```bash
   python server.py --port 8080
   ```

3. **Access the website:**

   Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

### Server Options

The server supports the following command-line options:

- `--port PORT`: Specify the port number (default: 8080)
- `--host HOST`: Specify the host to bind to (default: 127.0.0.1)
- `--root DIR`: Specify the root directory to serve files from (default: current directory)

Example:

```bash
python server.py --port 3000 --host 0.0.0.0
```

## Development

### Local Development

For local development, you can also use Python's built-in HTTP server:

```bash
python -m http.server 8080
```

However, the Waitress server is recommended as it includes CORS headers needed for iframe embedding.

### Production Deployment

For production deployment, consider:

- Using a proper web server (Nginx, Apache)
- Setting up SSL/HTTPS
- Configuring proper CORS headers
- Minifying CSS and JavaScript
- Optimising images

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- The registration form is embedded from an external service. Ensure the iframe source URL is accessible.
- Instagram feed integration may require API credentials for full functionality. Currently uses placeholder posts that link to the Instagram profile.
- The website respects user's `prefers-reduced-motion` setting for accessibility.

## License

© 2024 Walkies and Wanders with Becky. All rights reserved.

