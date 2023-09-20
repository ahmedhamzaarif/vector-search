import express from "express";
import { customAlphabet } from 'nanoid'
const nanoid = customAlphabet('1234567890', 20)
import { MongoClient, ObjectId } from "mongodb"
import morgan from 'morgan';
import cors from 'cors'
import path from 'path';
const __dirname = path.resolve();
import OpenAI from "openai";
import "dotenv/config.js";
import './config/index.mjs'
import http from "http"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const mongodbURI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.brs1yvz.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(mongodbURI);
const database = client.db('socialstories');
const postCollection = database.collection('posts');

async function run() {
  try {
    await client.connect();
    await client.db("socialstories").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


const app = express();
app.use(express.json());
// app.use(cors())
app.get("/",express.static(path.join(__dirname, "./web/build")))
// app.use( express.static(path.join(__dirname, './web/build')))

app.use(cors(["http://localhost:3000", "https://social-app-mongo-search.vercel.app/"]));
app.use(morgan('combined'));

// Get All
app.get("/api/v1/stories", async (req, res) => {
  const cursor = postCollection
    .find({})
    .sort({ _id: -1 })
    .project({ plot_embedding: 0 })
  try {
    const allStories = await cursor.toArray();
    res.send(allStories);
  } catch (error) {
    console.log("error", error);
    res.status(500).send({ message: "failed to get stories, please try later" });
  }
});

// Search
app.get('/api/v1/search/', async (req, res) => {
  const queryText = req.query.q
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: queryText,
  });

  const vector = response?.data[0]?.embedding
  console.log("vector: ", vector);

  const documents = await postCollection.aggregate([
    {
      "$search": {
        "index": "default",
        "knnBeta": {
          "vector": vector,
          "path": "plot_embedding",
          "k": 2147483647
        },
        "scoreDetails": true
      }
    },
    {
      "$project": {
        "plot_embedding": 0,
        "score": { "$meta": "searchScore" },
        "scoreDetails": { "$meta": "searchScoreDetails" }
      },
    }
  ]).toArray();
  res.send(documents)
});


// Upload 
app.post("/api/v1/story", async (req, res) => {
  try {
    const doc = {
      title: req?.body?.title,
      text: req?.body?.text,
      $currentDate: {
        createdOn: true
      },
    }
    const result = await postCollection.insertOne(doc);
    console.log("result: ", result);
    res.send({
      message: "story created successfully"
    });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).send({ message: "Failed to add, please try later" })
  }
});


// update 
app.put("/api/v1/story/:id", async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    res.status(403).send({ message: "incorrect product id" });
    return;
  }
  let story = {}
  if (req.body.title) story.title = req.body.title;
  if (req.body.text) story.text = req.body.text;
  try {
    const updateResponse = await postCollection
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: story }
      );
    console.log("Product updated: ", updateResponse);
    res.send({
      message: "story updated successfully"
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).send({ message: "failed to update story, please try later" });
  }
});


// delete
app.delete("/api/v1/story/:id", async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    res.status(403).send({ message: "incorrect product id" });
    return;
  }
  try {
    const deleteResponse = await postCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    console.log("Product deleted: ", deleteResponse);
    res.send({
      message: "story deleted successfully"
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).send({ message: "failed to delete story, please try later" });
  }
});



app.use((req, res) => {
  res.status(404).send("Not Found");
})

const server = http.createServer(app)

const port = process.env.PORT || 5001
server.listen(port, () => {
  console.log(`App running on port ${port} 🚀`)
})
