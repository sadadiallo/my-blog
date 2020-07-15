import express, { request } from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb'; // client to allow us to connect to mongodb
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build'))); // Tells the server where to serve the static files from.
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try{
        // connect to db
        const client = await MongoClient.connect('mongodb://localhost:27017', { userNewUrlParser: true }) // url to mongodb you want to connect to. By default Mongodb runs on port 27017
        const db = client.db('my-blog');
        // end connection

        await operations(db);

        // close connection
        client.close();
    } catch(error) {
        res.status(500).json({ message: 'Error connecting to db ', error})
    }
}

app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        // query db
        const articleInfo = await db.collection('articles').findOne({ name: articleName});        
        // return response
        res.status(200).json(articleInfo); 
    }, res);        
});

app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        // query db
        const articleInfo = await db.collection('articles').findOne({ name: articleName});
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articleInfo.upvotes + 1,
            },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
    
        res.status(200).json(updatedArticleInfo);
    }, res);        
});

app.post('/api/articles/:name/add-comment', async (req, res) => {

    withDB(async (db) => {
        const { username, text } = req.body;
        const articleName = req.params.name;
        // query db
        const articleInfo = await db.collection('articles').findOne({ name: articleName});
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articleInfo.comments.concat({ username, text }),
            },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });    
        res.status(200).json(updatedArticleInfo);
    }, res);
});

// examples
app.get('/hello', (req, res) => res.send('Hello!'));
app.get('/hello/:name', (req, res) => res.send(`Hello ${req.params.name}!`)); // exmaple of get value from request param and returning it in the response
app.post('/hello', (req, res) => res.send(`Hello ${req.body.name}!`)); // example of using POST, and getting a value (name) from the request body and returning it in the response
// end examples

// This tells the server that any request that isn't caught by the other endpoints, should be passed on to the app.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log('Listening on port 8000'));