import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true    
}));

app.use(express.json({
    limit: "16kb"
}))

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

app.use(express.static("/public"));
app.use(cookieParser());

//routes import

import userRoutes from "./routes/user.routes.js";
import updateRoutes from "./routes/update.routes.js";
import productRoutes from "./routes/product.routes.js";

//routes declaration
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/info", updateRoutes);
app.use("/api/v1/product", productRoutes);


export { app };