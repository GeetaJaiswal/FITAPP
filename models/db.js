const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://FitnessUser:Fitness123@cluster0.7xnxx.mongodb.net/Fitness?retryWrites=true&w=majority",{
    useNewUrlParser:true,
    useUnifiedTopology:true 
}).then(()=>{
    console.log("connection established");
}).catch((e)=>{
    console.log("no connection", e);
})

