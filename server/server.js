const express = require("express");
const app = express();
const supabase = require("./supabaseClient");
const path = require("path");
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static("public"));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);

app.get('/test',(req,res)=>{
  return res.json({message:"Hello from server!"}) ;
})

app.listen(PORT, () => {
  console.log(`Server listening on port : ${PORT}`);
});
