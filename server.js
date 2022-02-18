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
// const puppeteer = require('puppeteer');
const PORT = process.env.PORT || 3000;
app.use(express.static(__dirname + '/views'))
const initializePassport = require("./passportConfig");
let songArray = [];
let mySongs = [];
let uId = 0;
initializePassport(passport);
let pupFlag = false;

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


//// my songs


app.get('/mysongs', (req,res) => {
  mySongs = [];
  pool
  .connect()
  .then(client => {
    return client
      .query('SELECT * FROM songs ORDER BY id DESC')
      .then(res4 => {
        songArray = res4.rows;
        let mySongs = songArray.map(song => {
          if (song.editors != null) {
            if (song.editors[song.editors.length - 1] === userName) {
              return song;
            }
          } else {
            if (song.creator_name === userName) {
              return song;
            }
          }
        })
        // console.log(mySongs);

        // selectMySongs();
        res.render('songs', {title, user: userName, songs: mySongs});

      })
      .catch(err => {
        client.release()
        // console.log(err.stack)
      })
  })
});



//// my library

app.get('/songlibrary', (req,res) => {
  pool
  .connect()
  .then(client => {
    return client
      .query('SELECT * FROM songs ORDER BY id DESC')
      .then(res2 => {
        songArray = res2.rows;
        // console.log(res2.rows)
      })
      .catch(err => {
        client.release()
        // console.log(err.stack)
      })
  })

  res.render('songs', {title, user: userName, songs: songArray})
});



//////   DUPLICATE SONG   /////////////////////////////////////

app.get(/\/songs\/dupe\/[0-9]*/, (req,res) => {
  const urlArray = req.url.split('/');


  const songNumber = parseInt(urlArray[urlArray.length-1]);
  let songObject;
  pool
  .connect()
  .then(client => {
    return client
      .query("SELECT * FROM songs WHERE id = $1", [songNumber])
      .then(res3 => {
        songObject = res3.rows[0];
        if (songObject.editors == null) {
        songObject['editors'] = [userName];

        } else {
        songObject.editors.push(userName);

        }
        // console.log('songObject' , songObject);
        res.setHeader('Content-Type', 'text/html');
        res.render('new', {title, user: userName, songObject});
        // return songObject;
      })
      .catch(err => {
        client.release()
        // console.log(err)
      })
  })


});


//////   EDIT SONG    /////////////////////////////////////

app.get(/\/songs\/edit\/[0-9]*/, (req,res) => {
  const urlArray = req.url.split('/');
  const songNumber = parseInt(urlArray[urlArray.length-1]);
  let songObject;
  pool
  .connect()
  .then(client => {
    return client
      .query("SELECT * FROM songs WHERE id = $1", [songNumber])
      .then(res3 => {
        songObject = res3.rows[0];
        res.setHeader('Content-Type', 'text/html')
        res.render('edit', {title, songObject})
        // return songObject;
      })
      .catch(err => {
        client.release()
        // console.log(err)
      })
  })
});

//////   SHOW SONG    /////////////////////////////////////

app.get(/\/songs\/[0-9]*/, (req,res) => { 
  const urlArray = req.url.split('/');
  const songNumber = parseInt(urlArray[urlArray.length-1]);
  let songObject;
  pool
  .connect()
  .then(client => {
    return client
      .query("SELECT * FROM songs WHERE id = $1", [songNumber])
      .then(res3 => {
        songObject = res3.rows[0];
        res.setHeader('Content-Type', 'text/html')
        res.render('show', {title, songObject})
        // return songObject;
      })
      .catch(err => {
        client.release()
        // console.log(err)
      })
  })
});

///////////////////////////  NEW SONG  /////////////////////////

app.post('/songs/new', (req,res) => {
  // console.log(req);
  let vis = false;
  let dup = false;
  if (req.body.visible) {
    vis = true;
    if (req.body.dupable) {
      dup = true;
    }
  }
    pool
    .connect()
    .then(client => {
      return client
        .query(
        `INSERT INTO songs (title, skill_level, html, creator, creator_name, visible, dupable)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [req.body.title, req.body.skill_level, `<div class="song-title"> HTML from the server </div>`, uId, userName, vis, dup])
        .catch(err => {
          client.release()
          // console.log(err.stack)
        })
      })

  res.setHeader('Content-Type', 'text/html')
  res.render('new', {title, user: userName})
});

app.post(/\/songs\/dupe\/[0-9]*/, (req,res) => {
  // console.log(req.body)
  let vis = false;
  let dup = false;
  if (req.body.visible) {
    vis = true;
    if (req.body.dupable) {
      dup = true;
    }
  }
    pool
    .connect()
    .then(client => {
      return client
        .query(
        `INSERT INTO songs (title, skill_level, html, creator, creator_name, visible, dupable)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [req.body.title, req.body.skill_level, `<div class="song-title"> HTML from the server </div>`, uId, userName, vis, dup])
        .catch(err => {
          client.release()
          // console.log(err.stack)
        })
      })

  res.setHeader('Content-Type', 'text/html')
  res.render('new', {title, user: userName})
});

/////////////////////  DELETE SONG  //////////////

app.get(/\/songs\/delete\/[0-9]*/, (req,res) => {
  const urlArray = req.url.split('/');


  const songNumber = parseInt(urlArray[urlArray.length-1]);
    pool
    .connect()
    .then(client => {
      return client
        .query(
        `DELETE FROM songs WHERE id=$1`, [songNumber],
        )
        .then(res2 => {
          pool
          .connect()
          .then(client => {
            return client
              .query('SELECT * FROM songs ORDER BY id DESC')
              .then(res2 => {
                songArray = res2.rows;
                // console.log(res2.rows)
              })
              .catch(err => {
                client.release()
                // console.log(err.stack)
              })
          // res2.setHeader('Content-Type', 'text/html')
          // res2.render("songs", {title, user: userName, songs:songArray})
          })
          // res.redirect("/songs");
        })
        .catch(err => {
          client.release()
          // console.log(err.stack)
        })
      })


});

///////////////// SONGS INDEX  //////////////////////////////////////////////


///  all songs

app.get('/allsongs', (req,res) => {
  pool
  .connect()
  .then(client => {
    return client
      .query('SELECT * FROM songs ORDER BY id DESC')
      .then(res2 => {
        songArray = res2.rows;
        // console.log(res2.rows)
      })
      .catch(err => {
        client.release()
        // console.log(err.stack)
      })
  })
  res.render('songs', {title, user: userName, songs: songArray})
  
  if (pupFlag === false) {
    pupFlag = true;
    // selectAllSongs();
  }
});


/////////////////////////  AUTHENTICATION ROUTES  ///////////////////////////


app.get("/users/register", checkAuthenticated, (req, res) => {
  res.render("register.ejs", {title});
});

app.get("/users/login", checkAuthenticated, (req, res) => {
  // flash sets a messages variable. passport sets the error message
//   console.log(req.session.flash.error);
  res.render("login.ejs", {title});
});

app.get("/users/dashboard", checkNotAuthenticated, (req, res) => {
  uId = req.user.id;
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

  // console.log({
  //   name,
  //   email,
  //   password,
  //   password2
  // });

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
    // console.log(hashedPassword);
    // Validation passed
    pool.query(
      `SELECT * FROM users
        WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          // console.log(err);
        }
        // console.log(results.rows);

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
              // console.log(results.rows);
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


async function selectAllSongs(){
  const browser = await puppeteer.launch({ headless: true }); 
  const page = await browser.newPage();
  await page.goto("http://localhost:5000/allsongs",{waitUntil: 'networkidle0'});

  // console.log("start evaluate javascript")
  /** @type {string[]} */
  var productNames = await page.evaluate(()=>{
      // const allsongs = document.querySelector('#allsongs');
      // const mysongs = document.querySelector('#mysongs');
      // const songslibrary = document.querySelector('#songslibrary');
     
      // allsongs.classList = "songs-head"
      // mysongs.classList = "songs-head songs-head-disabled"
      // songslibrary.classList = "songs-head songs-head-disabled"
  })
  .catch((err) => {
    // console.log(err)
  })
  // return productNames;
  browser.close()
} 

async function selectMySongs(){
  const browser = await puppeteer.launch({ headless: true }); 
  const page = await browser.newPage();
  await page.goto("http://localhost:5000/allsongs",{waitUntil: 'networkidle2'});

  console.log("start evaluate javascript mySongs")
  /** @type {string[]} */
  const classes = await page.evaluate(() => {
    return document.querySelector("#mySongs").classList;
  });

  // console.log(classes);

    await document.querySelector("#mySongs").remove('songs-head-disabled');
  
  await browser.close()
} 
