const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const port = process.env.PORT || 5000;


// middlewares
app.use(cors());
app.use(express.json());




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0zyo6s3.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)


    const userCollection = client.db("sportsDb").collection("users");
    const itemCollection = client.db("sportsDb").collection("item");
    const reviewCollection = client.db("sportsDb").collection("reviews");
    const cartCollection = client.db("sportsDb").collection("carts");


    // jwt related api

    app.post('/jwt', async(req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h'  });
        res.send({token});
    })

    // middlewares
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);

      if(!req.headers.authorization){
        return res.status(401).send({message: 'forbidden access'});
      }
 const token = req.headers.authorization.split(' ')[1];

 jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
     if(err) {
        return res.status(401).send({message: 'forbidden access'})
     }
     req.decoded = decoded;
     next();
     
 })

 
    }



    // users related api

    app.get('/users', verifyToken, async(req, res) => {
     
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get('/users/admin/:email', verifyToken, async(req, res) => {
const email = req.params.email;
if ( email !== req.decoded.email) {
  return res.status(403).send({message: 'unauthorized access'})
}
const query = {email: email};
const user = await userCollection.findOne(query);
let admin = false;
if(user){
  admin = user?.role === 'admin'
}
res.send({ admin });

    })


    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = {email: user.email};
      const existingUser = await userCollection.findOne(query);
      if(existingUser){
        return res.send({message: 'user already exists', insertedId: null})
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })

    // Item related api
    app.get('/item', async (req, res) => {
      const result = await itemCollection.find().toArray();
      res.send(result);
    })

    app.get('/reviews', async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    })

    // carts collection

    app.get('/carts', async(req, res) => {    
      const email = req.query.email;
      const query = {email: email};  
      const result = await  cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post('/carts', async (req, res) => {
     const cartItem = req.body;
     const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    });

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
     const result = await cartCollection.deleteOne(query);
     res.send(result);

    })

    // Send a ping to confirm a successful connection

    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {

  res.send('Items are here')
})


app.listen(port, () => {
  console.log(`Sports Shop is live on port ${port}`);
})