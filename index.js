const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}))
app.use(express.json())

app.use(cookieParser())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@groupstudy.kqtrbew.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
// auth middleware
const logger = async (req, res, next) => {
    console.log('called', req.host, req.originalUrl)
    next()
}
const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCES_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ messae: 'unauthorized access' })
        }
        req.user = decoded;
        next()
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const allAssignmentCollection = client.db('assignmentDB').collection('allAssignment')
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body
            console.log(user)
            const token = jwt.sign(user, process.env.ACCES_TOKEN_SECRET, { expiresIn: '1h' })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false,
                    // sameSite: 'none'
                })
                .send({ success: true })
        })
        app.post('/add-assignment', async (req, res) => {
            const data = req.body
            console.log(data)
            const result = await allAssignmentCollection.insertOne(data)
            res.send(result)
        })
        app.get('/get-assignment', async (req, res) => {
            const cursor = allAssignmentCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })
        app.get('/assignment/:difficulty', async(req,res)=>{
            const difficulty= req.params.difficulty
            const query= {difficulty: difficulty}
            const result= await allAssignmentCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/single-assignment/:id', async(req,res)=>{
            const id= req.params.id
            console.log(id)
            const query= {_id: new ObjectId(id)}
            const result= await allAssignmentCollection.findOne(query)
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('car doctor server is running')
})
app.listen(port, () => {
    console.log(`Port is running at ${port}`)
})
