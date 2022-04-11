const { v4: uuidv4 } = require('uuid');
const express = require("express");
const { MongoClient } = require("mongodb");
const res = require('express/lib/response');
const app = express();
app.use(express.json());
const uri = "mongodb+srv://6K9uMUAg2t6e:Ey4kype7VAYbsZG3@podscholarcluster.g5sjk.mongodb.net/podscholar?retryWrites=true&w=majority";
const client = new MongoClient(uri);

var db;
var podcasts;
var users;

async function tryConnect() {
    try {
        // Connect the client to the server
        await client.connect();
        // Establish and verify connection
        // await client.db("admin");
        console.log("Connected successfully to server");
        db = client.db("podscholar");
        podcasts = db.collection("podcasts");
        users = db.collection("users");
        users.createIndex({ id: 1 })

        return true;
    }
    catch (e) {
        console.log(" There was an error connecting to Mongodb: " + e);
        return false;
    }
}


/**
 * Create a new User
 */
app.post('/create/user/', function (req, res) {
    /**
     * TODO: ADD VALIDATION
     */
    let userId = uuidv4();
    let newUser = req.body;
    newUser.userId = userId;
    newUser.isAuthor = false;
    try {
        users.insertOne(newUser);
        res.send({ message: "User Created", id: userId });
    }
    catch (e) {
        res.send(e)
    }
})

/**
 * A neat solution for updating a user based on an object of just the new values
 */
app.put('/update/user/:userId', async function (req, res) {
    let userId = req.params.userId;
    const filter = {
        userId: userId
    };
    const options = { upsert: false }
    let update = {
        $set: {}
    }
    // There has to be a better way to do this.
    isAuthor = false;
    if (req.body.organization) {
        isAuthor = true;
        update.$set.organization = req.body.organization;
    }
    if (req.body.title) {
        isAuthor = true;
        update.$set.title = req.body.title;
    }
    if (req.body.isVerified && isAuthor) {
        update.$set.isVerified = req.body.isVerified;
    }
    if (isAuthor) {
        update.$set.isAuthor = isAuthor;
    }
    if (req.body.email) {
        update.$set.email = req.body.email;
    }
    if (req.body.firstName) {
        update.$set.firstName = req.body.firstName;
    }
    if (req.body.lastName) {
        update.$set.lastName = req.body.lastName;
    }

    console.log(update);

    try {
        let result = await users.updateOne(filter, update, options)
        res.send(result);
    }
    catch (e) {
        console.log("AAAA" + e)
        res.send({ message: "An error occured processing your request" });
    }
})


app.get('/user/:userId', async function (req, res) {
    let userId = req.params.userId

    const query = {
        userId: userId
    };
    const options = {
        projection: { _id: 0, password: 0 },
    }
    let mongoResp = await users.findOne(query, options)
    if (!mongoResp) {
        mongoResp = { message: "User does not exist." }
    }

    res.json(mongoResp)
})

app.delete('/user/:userId', async function (req, res) {
    let userId = req.params.userId

    const query = {
        userId: userId
    };
    const options = {
        projection: { _id: 0, password: 0 },
    }
    let mongoResp = await users.deleteOne(query, options)

    res.send(mongoResp)
})

app.get('/', function (req, res) {
    res.send("App is active")
})

async function main() {
    // if connection failed try again up to 10 times
    let retryCount = 0;
    while (!await tryConnect() && retryCount < 10) {
        console.log("RETRY CONNECTION: " + retryCount)
        retryCount++;
    }
    app.listen(3000)
}

main()