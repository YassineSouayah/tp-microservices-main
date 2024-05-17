const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { Kafka } = require('kafkajs');

// Load proto files for movies and TV shows
const movieProtoPath = 'movie.proto';
const bookProtoPath = 'book.proto';
const resolvers = require('./resolvers');
const typeDefs = require('./schema');

// Create a new Express application
const app = express();
const movieProtoDefinition = protoLoader.loadSync(movieProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const bookProtoDefinition = protoLoader.loadSync(bookProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
app.use(bodyParser.json());
const movieProto = grpc.loadPackageDefinition(movieProtoDefinition).movie;
const bookProto = grpc.loadPackageDefinition(bookProtoDefinition).book;

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092'] 
});

const consumer = kafka.consumer({ groupId: 'api-gateway-consumer' });

consumer.subscribe({ topic: 'movies-topic' });
consumer.subscribe({ topic: 'book-topic' });

(async () => {
    await consumer.connect();
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log(`Received message: ${message.value.toString()}, from topic: ${topic}`);
        },
    });
})();

// Create ApolloServer instance with imported schema and resolvers
const server = new ApolloServer({ typeDefs, resolvers });

// Apply ApolloServer middleware to Express application
server.start().then(() => {
    app.use(
        cors(),
        bodyParser.json(),
        expressMiddleware(server),
    );
});

app.get('/movies', (req, res) => {
    const client = new movieProto.MovieService('localhost:50051',
        grpc.credentials.createInsecure());
    client.searchMovies({}, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(response.movies);
        }
    });
});

app.get('/movies/:id', (req, res) => {
    const client = new movieProto.MovieService('localhost:50051',
        grpc.credentials.createInsecure());
    const id = req.params.id;
    client.getMovie({ movie_id: id }, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(response.movie);
        }
    });
});

app.post('/movies/add', (req, res) => {
    const client = new movieProto.MovieService('localhost:50051',
        grpc.credentials.createInsecure());
    const data = req.body;
    const titre=data.title;
    const desc= data.description
    client.addMovie({ title: titre,description:desc }, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(response.movie);
        }
    });
});

app.get('/books', (req, res) => {
    const client = new bookProto.bookService('localhost:50052',
        grpc.credentials.createInsecure());
    client.searchBooks({}, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(response.book);
        }
    });
});

app.get('/books/:id', (req, res) => {
    const client = new bookProto.bookService('localhost:50052',
        grpc.credentials.createInsecure());
    const id = req.params.id;
    client.getBook({ book_id: id }, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(response.book);
        }
    });
});

app.post('/books/add', (req, res) => {
    const client = new bookProto.bookService('localhost:50052',
        grpc.credentials.createInsecure());
    const data = req.body;
    const titre=data.title;
    const desc= data.description
    client.addBook({ title: titre,description:desc }, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(response.book);
        }
    });
});

// Start Express application
const port = 3000;
app.listen(port, () => {
    console.log(`API Gateway is running on port ${port}`);
});
