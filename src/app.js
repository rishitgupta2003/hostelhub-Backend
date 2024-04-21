import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

const app = express();

const limiter = rateLimit(
    {
        windowMs: 60 * 1000,
        max: 10,
        message: "Too Many Request, please try again in 1 minuter",
    }
);

app.use(limiter);

app.get('/' , (req, res) => {
    res.status(200).send("Working");
});

app.use(cors({
    origin: true,
    credentials: true    
}));

app.use(express.json({
    limit: "50mb"
}))

app.use(express.urlencoded({
    extended: true,
    limit: "50mb"
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