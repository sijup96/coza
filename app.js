const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/usersRouter');
const authRouter = require('./routes/authRoute');
//const userRouter = require('./routes/userRoute');
const productRouter = require('./routes/productRoute');
const blogRouter = require('./routes/blogRoute');
const categoryRouter = require('./routes/categoryRouter');
const brandRouter = require('./routes/brandRoute');
const adminRoute = require('./routes/adminRouter')
const cartRouter = require('./routes/cartRouter')
const orderRouter = require('./routes/orderRouter')
const wishListRouter = require('./routes/wishListRouter')
const offerRouter = require('./routes/offerRouter')
const walletRouter = require('./routes/walletRouter')
const couponRouter = require('./routes/couponRouter')


const session = require('express-session');
const flash = require('express-flash');


const dotenv = require("dotenv").config()

const app = express();
const port = process.env.PORT || 8080

//db connection
const dbConnect = require('./config/dbConnection');
const bodyParser = require('body-parser');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
dbConnect();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));
app.use(flash());



app.use((req, res, next) => {
  res.locals.user = req.cookies.refreshToken;
  next();
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/coupon', couponRouter);
app.use('/wallet', walletRouter);
app.use('/offer', offerRouter);
app.use('/wishList', wishListRouter);
app.use('/order', orderRouter);
app.use('/products', productRouter);
app.use('/blog', blogRouter)
app.use('/prodCategory', categoryRouter)
app.use('/brand', brandRouter)
app.use('/about', indexRouter)
app.use('/admin', adminRoute)
app.use('/user', usersRouter)
app.use('/cart', cartRouter)
app.use('/', authRouter);

app.use(notFound)
app.use(errorHandler)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(err.status || 404);
  res.render('errorPage');
});
app.use((err, req, res, next) => {
  // Check if headers have already been sent
  if (res.headersSent) {
    res.status(err.status || 404);
    res.render('errorPage');
  }
  // Send an error response
  res.status(500).json({ error: 'Internal Server Error' });
});

// error handler 
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('errorPage');
});


app.listen(port, () => {
  console.log(`http://localhost:${port}`);
})