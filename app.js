const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const dbConnect = require('./config/dbConnect');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const app = express();
const port = process.env.PORT || 3000;


const authRouter = require('./routes/authRoutes');
const movieRouter = require('./routes/movieRoutes');


const cookieParser = require('cookie-parser');
const morgan = require('morgan');


app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
dbConnect();

app.use("/healthcheck", (req, res) => {
    res.status(200).send('ok');
});
app.use("/api/u", authRouter);
app.use("/api/m", movieRouter);
// app.use("/api/s", streamRoutes);

app.use(errorHandler);

app.use(notFound);

app.listen(port, () => {
    console.log(`Server is running at ${port}`);
});




