const express = require("express");
const app = express();
// const supabase = require("./supabaseClient");
const PORT = process.env.PORT || 3000;


app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.listen(PORT, () => {
  console.log(`Server listening on port : ${PORT}`);
});
