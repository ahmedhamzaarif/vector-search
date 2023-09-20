import { MongoClient } from "mongodb";

export const DB = ()=>{

MongoClient.connect(`mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.nabnixg.mongodb.net/?retryWrites=true&w=majority`).then((result)=>{
    console.log("DB CONNECTED")

}).catch((error)=>{
    console.log(error)
})}