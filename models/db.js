const mongoose = require('mongoose');
// console.log(process.env.DB);
mongoose.connect(process.env.DB,{
    useNewUrlParser:true,
    useUnifiedTopology:true 
}).then(()=>{
    console.log("connection established");
}).catch((e)=>{
    console.log("no connection", e);
})

