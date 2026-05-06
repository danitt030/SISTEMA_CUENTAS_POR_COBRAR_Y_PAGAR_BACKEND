'use strict'

import mongoose from "mongoose"

export const dbConnection = async () => {
    try{
        mongoose.connection.on("error", (err) =>{
            console.log(" MongoDB | Error:", err)
            mongoose.disconnect()
        })
        mongoose.connection.on("connecting", () =>{
            console.log(" MongoDB | try connecting")
        })
        mongoose.connection.on("connected", () =>{
            console.log(" MongoDB | connected to MongoDB")
        })
        mongoose.connection.on("open", () =>{
            console.log(" MongoDB | Connnected to DataBase")
        })
        mongoose.connection.on("reconnected", () => {
            console.log(" MongoDB | reconnected to MongoDB")
        })
        mongoose.connection.on("disconnected", () => {
            console.log(" MongoDB | disconnected to MongoDB")
        })

        const connection = await mongoose.connect(process.env.URI_MONGO,{
            serverSelectionTimeoutMS: 30000, 
            socketTimeoutMS: 60000,                   
            maxPoolSize: 50,
            minPoolSize: 5,
            maxIdleTimeMS: 30000,
            connectTimeoutMS: 30000
        })
        
        return connection;
        
    }catch(err){
        console.log(` Database connection failed: ${err}`)
        throw err; 
    }
}