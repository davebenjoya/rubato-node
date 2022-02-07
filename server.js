const express = require("express");
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
require("dotenv").config();
const app = express();
const title = "Rubato"
let userName = 'Monty';
const PORT = process.env.PORT || 3000;
app.use(express.static('views'))
const initializePassport = require("./passportConfig");
let songArray = []

initializePassport(passport);

// Middleware

// Parses details from a form
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");

app.use(
  session({
    // Key we want to keep secret which will encrypt all of our information
    secret: process.env.SESSION_SECRET,
    // Should we resave our session variables if nothing has changes which we dont
    resave: false,
    // Save empty value if there is no vaue which we do not want to do
    saveUninitialized: false
  })
);
// Funtion inside passport which initializes passport
app.use(passport.initialize());
// Store our variables to be persisted across the whole session. Works with app.use(Session) above
app.use(passport.session());
app.use(flash());

app.get("/", (req, res) => {
  res.render("index", {title});
});

function resolve(){
  console.log('resolve');
}
function reject(){
  console.log('reject');
}

function getSongs(res2) {
  pool
  .connect()
  .then(client => {
    return client
      .query('SELECT * FROM songs')
      .then(res => {
        // client.release()
        songArray = res.rows;
        console.log(res.rows)
        res2.setHeader('Content-Type', 'text/html')
        res2.render('songs', {title, user: userName, songs: res.rows})
      })
      .catch(err => {
        client.release()
        console.log(err.stack)
      })
  })
}

// app.get('/songs', async function(req, res) {
//   console.log("Running test...")
//   const content = await getSongs();
//   console.log(content);
//   // res.send(content)
//   // console.log(content)
// });

app.get('/songs', (req,res) => {
  pool
  .connect()
  .then(client => {
    return client
      .query('SELECT * FROM songs')
      .then(res2 => {
        songArray = res2.rows;
        console.log(res2.rows)
      })
      .catch(err => {
        client.release()
        console.log(err.stack)
      })
        res.setHeader('Content-Type', 'text/html')
        songArray = res2.rows;
        res.render('songs', {title, user: userName, songs: res2.rows});
        client.release()
  })


        res.render('songs', {title, user: userName, songs: songArray})

  // console.log(songArray);
  //   res.setHeader('Content-Type', 'text/html')
    // res.render('songs', {title, user: userName, songs: [{title: 'Oregon Trail', skill_level: 'beginner'}, {title: 'Lush Life', skill_level: 'advanced'}, {title: 'Space Oddity', skill_level: 'intermediate'}]})
});

app.get('/songs/new', (req,res) => {
    res.setHeader('Content-Type', 'text/html')
    res.render('new', {title, user: userName})
});




app.get("/users/register", checkAuthenticated, (req, res) => {
  res.render("register.ejs", {title});
});

app.get("/users/login", checkAuthenticated, (req, res) => {
  // flash sets a messages variable. passport sets the error message
//   console.log(req.session.flash.error);
  res.render("login.ejs", {title});
});

app.get("/users/dashboard", checkNotAuthenticated, (req, res) => {
  userName = req.user.name;
  res.render("dashboard", { title, user: userName });
});

app.get("/users/logout", (req, res) => {
  req.logout();
  res.render("logout", { title, message: "You have logged out successfully" });
});

app.post("/users/register", async (req, res) => {
  let { name, email, password, password2 } = req.body;

  let errors = [];

  console.log({
    name,
    email,
    password,
    password2
  });

  if (!name || !email || !password || !password2) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password must be a least 6 characters long" });
  }

  if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("register", { errors, name, email, password, password2, title });
  } else {
    hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    // Validation passed
    pool.query(
      `SELECT * FROM users
        WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results.rows);

        if (results.rows.length > 0) {
          return res.render("register", {
            title, message: "Email already registered"
          });
        } else {
          pool.query(
            `INSERT INTO users (name, email, password)
                VALUES ($1, $2, $3)
                RETURNING id, password`,
            [name, email, hashedPassword],
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash("success_msg", "You are now registered. Please log in");
              res.redirect("/users/login");
            }
          );
        }
      }
    );
  }
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/users/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true
  })
);

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/users/dashboard");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});