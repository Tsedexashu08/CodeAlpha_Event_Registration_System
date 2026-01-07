const express = require("express");
const app = express();
const supabase = require("./supabaseClient");
const path = require("path");
const PORT = process.env.PORT || 3000;
const userRoutes = require("./routes/authRoutes.js");

app.use('/users', userRoutes);


app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.listen(PORT, () => {
  console.log(`Server listening on port : ${PORT}`);
});
