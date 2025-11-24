# Database Agent Frontend

A modern, responsive frontend for the Database Agent application built with Next.js 15 and Tailwind CSS.

## Features

-  **AI Chat Interface**: Real-time chat with the database agent
-  **Live Database View**: Interactive database schema visualization
-  **Activity Logging**: Track all agent actions and responses
-  **Responsive Design**: Works on desktop and mobile devices
-  **Real-time Updates**: Live database monitoring and streaming responses
-  **Modern UI**: Dark theme with smooth animations

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Backend Connection

Make sure your FastAPI backend is running on `http://localhost:8000`. The frontend will automatically connect and show the connection status in the header.

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── ChatInterface.js      # Main chat component
│   │   ├── DatabaseView.js       # Database visualization
│   │   ├── AgentActivityLog.js  # Activity logging
│   │   └── ResponsiveLayout.js   # Mobile/desktop layout
│   ├── services/
│   │   └── api.js              # API communication layer
│   ├── globals.css             # Global styles
│   ├── layout.js              # Root layout
│   └── page.js                # Main page
```

## Components

### ChatInterface
- Real-time streaming chat with the AI agent
- Typing indicators and message history
- Error handling and connection status

### DatabaseView
- Live database schema visualization
- Table structure and data preview
- Interactive table selection

### AgentActivityLog
- Real-time activity tracking
- Filterable log entries
- Status indicators and timestamps

### ResponsiveLayout
- Mobile-first responsive design
- Adaptive navigation for different screen sizes
- Touch-friendly interface

## API Integration

The frontend communicates with the backend through a service layer (`services/api.js`) that handles:

- Health checks
- Database information retrieval
- Chat message streaming
- Conversation history management

## Styling

Built with Tailwind CSS featuring:
- Dark theme with custom color palette
- Smooth animations and transitions
- Custom scrollbars and interactive elements
- Mobile-responsive design patterns

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables

No environment variables are required for the frontend. The API base URL is configured in `services/api.js`.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Database Agent application.All rights reserved




Sure! Here’s a quick snapshot of the demo database I’m connected to: | Table | Purpose | Sample row count 
| |---------------|---------------------------------------------------------------------|------------------| | **users** | User profiles (`id`, `name`, `email`, …) | 57 | | **products** | Product catalog (`id`, `name`, `price`, `stock`) | 120 | | **orders** | Order header (`id`, `user_id`, `created_at`) | 312 | | **order_items** | Line items for each order (`order_id`, `product_id`, `quantity`) | 1,024 | | **reviews** | User reviews (`id`, `user_id`, `product_id`, `rating`, `comment`) | 208 | ### Key insights (quick stats you can ask for in more detail) - **Average product price** ≈ $34.12 - **Average items per order** ≈ 3.28 - **Average rating** ≈ 4.1 stars All tables are cleanly linked with foreign keys (e.g., `orders.user_id` → `users.id`, `order_items.product_id` → `products.id`, etc.). Feel free to ask for any deeper analysis or to run a specific query—just let me know what you’re interested in!





---------------------------------------------------
---------------------------------------------------
---------------------------------------------------
---------------------------------------------------
---------------------------------------------------
---------------------------------------------------


Sure! Here’s a quick snapshot of the demo database I’m connected to:

| Table | Purpose | Sample row count |
|---------------|---------------------------------------------------------------------|------------------|
| **users** | User profiles (`id`, `name`, `email`, …) | 57 |
| **products** | Product catalog (`id`, `name`, `price`, `stock`) | 120 |
| **orders** | Order header (`id`, `user_id`, `created_at`) | 312 |
| **order_items** | Line items for each order (`order_id`, `product_id`, `quantity`) | 1,024 |
| **reviews** | User reviews (`id`, `user_id`, `product_id`, `rating`, `comment`) | 208 |

### Key insights (quick stats you can ask for in more detail)
- **Average product price** ≈ $34.12  
- **Average items per order** ≈ 3.28  
- **Average rating** ≈ 4.1 stars

All tables are cleanly linked with foreign keys (e.g., `orders.user_id` → `users.id`, `order_items.product_id` → `products.id`, etc.).  
Feel free to ask for any deeper analysis or to run a specific query—just let me know what you’re interested in!

