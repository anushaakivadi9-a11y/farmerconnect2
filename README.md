FarmConnect

A farmer-to-buyer marketplace, built to actually scale — not just demo.

🔗 Live App: connectfarmers.netlify.app

🚀 What is FarmConnect?

FarmConnect connects farmers directly with buyers — cutting out middlemen and giving farmers a digital storefront to list, sell, and manage produce. It started as a MERN monolith and is actively being re-engineered toward a production-grade architecture, one bottleneck at a time.

✨ Highlights
⚡ Redis caching on product listing endpoints — faster reads under load
🗂️ MongoDB indexing for efficient querying at scale
🔄 React Query replacing manual useState/useEffect fetch logic — cleaner data layer, fewer race conditions
☁️ Deployed on Netlify (frontend) + Render (backend), with real production issues solved along the way — CORS lockdowns, env config, SPA routing, Cloudinary integration, and Mongoose/bcrypt edge cases

This isn't a tutorial clone — it's a working product going through the same scaling growing pains a real startup would hit.

🛠️ Tech Stack
Layer	Tech
Frontend	React, Vite
Backend	Node.js, Express
Database	MongoDB (indexed), Redis (caching)
Media	Cloudinary
Deployment	Netlify · Render
🗺️ Roadmap
 Break monolith into services (product catalog, orders, auth)
 Add observability (logging, metrics, tracing)
 Horizontal scaling for the API layer
🧑‍💻 Getting Started
bash
git clone https://github.com/<your-username>/farmconnect.git
cd farmconnect
npm install
npm run dev
📬 Contact

Built by Anusha — BE Computer Science student, building toward full-stack + systems engineering.

⭐ If this caught your eye, the code tells the rest of the story.
