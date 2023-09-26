// express_server.js
const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const bcrypt = require("bcryptjs");
const password = "purple-monkey-dinosaur"; // found in the req.body object
const hashedPassword = bcrypt.hashSync(password, 10);

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const PORT = 8080;

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },

  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
};

function urlsForUser(id) {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return userUrls;
}

function getUserByEmail(email) {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
}

function generateRandomString() {
  let newString = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    newString += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return newString;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];

  const templateVars = {
    user: user,
  };
  if (req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    res.render("login", templateVars);
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = getUserByEmail(email, users);

  // if (user) {
  //   if (user.password === password) {
  //     res.cookie("user_id", user.id);
  //     res.redirect("/urls");
  //   } else {
  //     res.status(403).send("Incorrect password");
  //   }
  // }

  if (user) {
    if (bcrypt.compareSync(password, user.password)) {
      res.cookie("user_id", user.id);
      res.redirect("/urls");
    } else {
      res.status(403).send("Incorrect password");
    }
  } else {
    res.status(403).send("User not found");
  }
});

app.get("/urls", (req, res) => {
  const userId = req.cookies.user_id;
  if (!userId) {
    res.status(403).send("You must be logged in to view your URLs.");
    return;
  }
  const user = users[userId];
  const userUrls = urlsForUser(userId);
  const templateVars = {
    user: user,
    urls: userUrls,
  };

  res.render("urls_index", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];

  const templateVars = {
    user: user,
  };
  if (req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    res.render("registration", templateVars);
  }
});

app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  // Check if email or password is empty
  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty.");
    return;
  }

  // Check if email already exists
  if (getUserByEmail(email)) {
    res
      .status(400)
      .send("Email already exists. Please choose a different email.");
    return;
  }

  // Hash password before storing in database
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Create new user object
  users[userId] = {
    id: userId,
    email: email,
    password: hashedPassword,
  };

  res.cookie("user_id", userId);

  res.redirect("/urls");
});

//delete this route before submission
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//delete this route before submission
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];

  const templateVars = {
    user: user,
    urls: urlsForUser(userId),
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];

  const templateVars = {
    user: user,
  };
  if (!req.cookies.user_id) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  const userId = req.cookies.user_id;

  if (!userId) {
    return res
      .status(403)
      .send("You must be logged in to create a new URL");
  }

  if (!longURL) {
    res.status(404).send("URL not found");
    return;
  }

  if (longURL.userID !== req.cookies.user_id) {
    res
      .status(403)
      .send("You do not have permission to access this URL.");
    return;
  }

  const templateVars = {
    id: shortURL,
    longURL: longURL.longURL,
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const userId = req.cookies.user_id;

  if (!userId) {
    res.status(403).send("You must be logged in to create a new URL");
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: userId,
  };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];

  if (!longURL) {
    res.status(404).send("URL not found");
  }
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (!longURL) {
    res.status(404).send("URL not found");
    return;
  }

  if (longURL.userID !== req.cookies.user_id) {
    res
      .status(403)
      .send("You do not have permission to delete this URL.");
    return;
  }

  // Delete URL from database
  delete urlDatabase[shortURL];

  res.redirect("/urls"); // Redirect back to urls_index page
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (!longURL) {
    res.status(404).send("URL not found");
    return;
  }

  if (longURL.userID !== req.cookies.user_id) {
    res
      .status(403)
      .send("You do not have permission to edit this URL.");
    return;
  }

  const newLongURL = req.body.newLongURL;

  // Update the URL in the database
  urlDatabase[shortURL].longURL = newLongURL;

  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
