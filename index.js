const express = require("express");
const cors = require("cors");
const monk = require("monk");
const Filter = require("bad-words");
const rateLimit = require("express-rate-limit");

const app = express();

const db = monk(process.env.MONGO_URI || "localhost:27017/meower");
const mews = db.get("mews");
const filter = new Filter();

app.use(cors());
app.use(express.json());

// app.post(
//   "/",
//   rateLimit({
//     windowMs: 30 * 1000, // 30 secs
//     max: 1 // limit each IP to 100 requests per windowMs
//   })
// );

app.get("/", (req, res) => {
  res.json({
    message: "Meower!"
  });
});

app.get("/mews", (req, res) => {
  mews.find().then(mews => {
    res.json(mews);
  });
});

function isValidMew(mew) {
  return (
    mew.name &&
    mew.name.toString().trim() !== "" &&
    mew.content &&
    mew.content.toString().trim() !== ""
  );
}

app.use(
  rateLimit({
    windowMs: 30 * 1000, // 30 secs
    max: 1 // limit each IP to 100 requests per windowMs
  })
);

app.post("/mews", (req, res) => {
  if (isValidMew(req.body)) {
    const mew = {
      name: filter.clean(req.body.name.toString()),
      content: filter.clean(req.body.content.toString()),
      created: new Date()
    };

    mews.insert(mew).then(createdMew => {
      res.json(createdMew);
      console.log(createdMew);
    });
    console.log("done");
  } else {
    res.status(422);
    res.json({
      message: "Hey! Name and Content are required!"
    });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
