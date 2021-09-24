const express = require("express");
const logger = require("morgan");
const path = require("path");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 3000;

const db = require("./models");

const app = express();

app.use(logger("dev"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/workout", { useNewUrlParser: true });

app.get("/exercise", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/exercise.html"));
});

app.get("/stats", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/stats.html"));
});

app.get("/api/workouts", (req, res) => {
  db.Workout.aggregate([
    {
      $addFields: {
        totalDuration: { $sum: "$exercises.duration" },
      },
    }
  ])
  .then(dbWorkouts => {
    res.json(dbWorkouts);
  })
  .catch(err => {
    res.json(err);
  });
});

app.get("/api/workouts/range", function (req, res) {
  db.Workout.aggregate([
    {
      $addFields: {
        totalDuration: { $sum: "$exercises.duration" },
        dateDifference: { $subtract: [new Date(), "$day"], },
      }
    },
  ])
  .then(function (dbWorkouts) {
    res.json(dbWorkouts);
  });
});

app.post("/api/workouts", ({ body }, res) => {
  db.Workout.create(body)
    .then(({ _id }) => db.Workout.findOneAndUpdate({},
      { $push: { exercises: _id } }, { new: true }))
    .then(dbWorkouts => {
      res.json(dbWorkouts);
    })
    .catch(err => {
      res.json(err);
    });
});

app.put("/api/workouts/:id", function (req, res) {
  let id = req.params.id;
  db.Workout.findOneAndUpdate(
    { _id: id },
    { $push: { exercises: req.body } },
    function (error, success) {
      if (error) {
        console.log(error);
      } else {
        res.send(success);
      }
    }
  );
});

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}!`);
});
