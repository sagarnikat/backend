import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path:"./env"
})

connectDB();








// bellow is code for all function in one file
/*
// async function connectDB(){
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

//     }catch(error){
//         console.error("ERROR: ",error)
//         throw error
//     }
// }
// connectDB()

// same as above funtion and funtion call

;(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERROR: ",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    }catch(error){
        console.error("ERROR: ",error)
        throw error
    }
})()

*/
