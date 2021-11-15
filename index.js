const express = require("express");
const app = express();
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const { MongoClient } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("plant_orders");
    const orderCollection = database.collection("orders");
    const usersCollection = database.collection("users");
    const productsCollection = database.collection("products");
    const reviewCollection = database.collection("reviews");

    // Add Product
    app.post("/addProducts", (req, res) => {
      const name = req.body.name;
      const desc = req.body.desc;
      const price = req.body.price;
      const image = req.body.image;

      productsCollection
        .insertOne({ name, desc, price, image })
        .then((result) => {
          res.send(result.insertedCount > 0);
        });
    });

    // Show Product to home
    app.get("/products", (req, res) => {
      productsCollection.find({}).toArray((err, documents) => {
        res.send(documents);
      });
    });

    // DELETE ORDER
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      console.log("delete product with id", id);
      res.json(result);
    });

    // GET ORDERS
    app.get("/orders", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);

      if (user?.role === "admin") {
        const cursor = orderCollection.find({});
        const queryCursor = orderCollection.find(query);
        const adminOrders = await cursor.toArray();
        const orders = await queryCursor.toArray();
        res.json({ adminOrders, orders });
      } else {
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.json({ orders });
      }
    });

    // POST ORDERS
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.json(result);
    });

    // DELETE ORDER
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      console.log("delete orders with id", id);
      res.json(result);
    });

    // Status
    app.patch("/addStatus/:id", (req, res) => {
      const status = req.body.status;
      // console.log(status);
      orderCollection
        .updateOne({ _id: ObjectId(req.params.id) }, { $set: { status } })
        .then((result) => {
          res.send(result.insertedCount > 0);
        });
    });

    // GET USERS BY EMAIL
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // POST USERS
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
    });

    // UPSERT USERS
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // UPDATE USER TO ADMIN
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // Add Review
    app.post("/addReview", (req, res) => {
      const image = req.body.image;
      const name = req.body.name;
      const reviewDesc = req.body.reviewDesc;
      const rating = req.body.rating;

      reviewCollection
        .insertOne({ image, name, reviewDesc, rating })
        .then((result) => {
          res.send(result.insertedCount > 0);
        });
    });

    // Show review to home
    app.get("/reviews", (req, res) => {
      reviewCollection.find({}).toArray((err, documents) => {
        res.send(documents);
      });
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Plantous Server!");
});

app.listen(port, () => {
  console.log(`Listening at localhost:${port}`);
});
