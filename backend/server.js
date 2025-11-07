require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const compression = require("compression");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const fs = require("fs");
const IndexRouter = require('./routes/index.routes')

// Load configurations
const MONGO_URI = process.env.MONGO
const { PORT, SESSION_SECRET, NODE_ENV, FRONTEND_URL } = process.env;
console.log("The db is", MONGO_URI)
// Database connection
const connectDB = require("./loaders/connectionDB");

// Remove logger import
// const logger = require("./loaders/logger");

// Middleware
const { notFound, errorHandler } = require("./middleware/errorHandler");

// Import routes
const healthRoutes = require("./health/health.route");

const app = express();

// Connect to database
connectDB().catch((err) => {
  console.error("❌ MongoDB connection failed:", err); // Use console instead
  process.exit(1);
});

// Ensure directories exist
["uploads", "logs"].forEach((dir) => {
  if (!fs.existsSync(`./${dir}`)) {
    fs.mkdirSync(`./${dir}`, { recursive: true });
  }
});

// Security middleware
app.use(helmet());

// Rate limiting (to prevent brute-force attacks)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    status: "error",
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Enable CORS
app.use(
  cors({
    origin: FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Data sanitization against NoSQL injection & XSS
// app.use(mongoSanitize());
// app.use(xss());
// app.use(hpp());

// Compression
app.use(compression());

// Logging - Simplified without logger
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ✅ FIXED: Session configuration with MongoDB
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URI, 
      collectionName: "sessions",
    }),
    cookie: {
      secure: NODE_ENV === "production", 
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, 
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/", healthRoutes);

// Index Router
app.use('/api',IndexRouter)

// // Error handling middleware
// app.use(notFound);
// app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`); // Use console
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`); // Use console
});

module.exports = app;