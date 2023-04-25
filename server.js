import express from 'express'
import mongoose from 'mongoose'
import Cors from 'cors'
import Pusher from 'pusher'
import Messages from './dbMessages.js'


const app = express()
const port = process.env.PORT || 9000
const connection_url ="mongodb+srv://WesleyB:Mongoose85@cluster0.p9iklke.mongodb.net/messagingDB?retryWrites=true&w=majority"
const pusher = new Pusher ({
    appId: "1586022",
    key: "c7f9df435c12676138ae",
    secret: "8c932397684cb92d8f88",
    cluster: "us2",
    forceTLS: true
});

// Middleware
app.use(express.json())
app.use(Cors())

// DB config
mongoose.connect(connection_url); 

// API endpoints
const db = mongoose.connection
db.once("open", () => {
    console.log("DB Connected")
    const msgCollection = db.collection("messagingmessages")
    const changeStream = msgCollection.watch()
    changeStream.on('change', change => {
        console.log(change)
        if(change.operationType === "insert"){
            const messageDetails = change.fullDocument
            pusher.trigger("messages", "inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            })
        } else {
            console.log('Error triggering Pusher')
        }
    })
})

app.get("/", (req, res) => res.status(200).send("Hello There Friend"))

app.post('/messages/new', function(req,res){
    const dbMessage = req.body
     Messages.create(dbMessage)
    .then((data) => {
        res.status(200).send(data)
    })
    .catch(err => {
        res.status(500).send(err)
    })
})

app.get('/messages/sync', function(req,res) {
    Messages.find()
    .then((data) => {
        res.status(200).send(data)
    })
    .catch((err) => {
        res.status(500).send(err)
    })
})

app.listen(port, () => console.log(`Listening on localhost: ${port}`))