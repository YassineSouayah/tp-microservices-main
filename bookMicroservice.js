// bookMicroservice.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
// Charger le fichier book.proto
const bookProtoPath = 'book.proto';
const mongoose = require('mongoose');
const Books = require('./models/bookModel');
const { Kafka } = require('kafkajs');

const bookProtoDefinition = protoLoader.loadSync(bookProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092']
});

const producer = kafka.producer();

const bookProto = grpc.loadPackageDefinition(bookProtoDefinition).book;
const url = 'mongodb://localhost:27017/books';
//const dbName = 'moviesDB';

mongoose.connect(url)
    .then(() => {
        console.log('connected to database!');
    }).catch((err) => {
        console.log(err);
    })

/*const  book = [
    {
        id: '1',
        title: 'Exemple de série  book 1',
        description: 'Ceci est le premier exemple de série  book.',
    },
    {
        id: '2',
        title: 'Exemple de série  book 2',
        description: 'Ceci est le deuxième exemple de série  book.',
    },
];*/

const bookService = {
    getBook: async (call, callback) => {
        try {
            const bookId = call.request. book_id;
            //console.log(call.request);
            const book = await Books.findOne({ _id: bookId }).exec();
            await producer.connect();
            await producer.send({
                topic: 'book-topic',
                messages: [{ value: 'Searched for  book id : '+bookId.toString() }],
            });

            if (!book) {
                callback({ code: grpc.status.NOT_FOUND, message: ' book not found' });
                return;
            }
            callback(null, {  book: book });

        } catch (error) {
            await producer.connect();
            await producer.send({
                topic: 'book-topic',
                messages: [{ value: `Error occurred while fetching  book : ${error}` }],
            });
            callback({ code: grpc.status.INTERNAL, message: 'Error occurred while fetching  book ' });
        }

        //const  book=getbookById(bookId);
        //console.log( book);
        // if (! book) {
        // callback({ code: grpc.status.NOT_FOUND, message: ' book not found' });
        //  return;
        // }
        /*const  book = {
            id: call.request. book_id,
            title: 'Exemple de série  book',
            description: 'Ceci est un exemple de série  book.',
        };*/
        //callback(null, {  book });
    },
    searchBooks: async (call, callback) => {
        try {
            const books = await Books.find({}).exec();

            await producer.connect();
            await producer.send({
                topic: 'book-topic',
                messages: [{ value: 'Searched for  book' }],
            });

            callback(null, {  book: books });
        } catch (error) {
            await producer.connect();
            await producer.send({
                topic: 'book-topic',
                messages: [{ value: `Error occurred while fetching  book : ${error}` }],
            });

            callback({ code: grpc.status.INTERNAL, message: 'Error occurred while fetching  book' });
        }
    },
    
    addBook: async (call, callback) => {
        /*const id= book.length+1;
        const titre = call.request.title;
        const desc = call.request.description;
        const newbook ={
            id:id,
            title:titre,
            description:desc
        }
        console.log(newbook);
        newbook.id=id;
         book.push(newbook);
        callback(null, {  book:newbook});*/
        /*const { title, description } = call.request;
        console.log(call.request);
        const newbook = new books({ title, description });
        await newbook.save()
            .then(savedbook => {
                producer.connect();
                producer.send({
                    topic: ' book-topic',
                    messages: [{ value: JSON.stringify(newbook) }],
                });
                //producer.disconnect();
                callback(null, {  book: savedbook });
            })
            .catch(error => {
                callback({ code: grpc.status.INTERNAL, message: 'Error occurred while adding  book' });
            });*/
        const { title, description } = call.request;
        console.log(call.request);
        const newbook = new Books({ title, description });

        try {
            await producer.connect();

            await producer.send({
                topic: 'book-topic',
                messages: [{ value: JSON.stringify(newbook) }],
            });

            await producer.disconnect();

            const savedbook = await newbook.save();

            callback(null, {  book: savedbook });
        } catch (error) {
            callback({ code: grpc.status.INTERNAL, message: 'Error occurred while adding  book ' });
        }
    }


};


// Créer et démarrer le serveur gRPC
const server = new grpc.Server();
server.addService(bookProto.bookService.service, bookService);
const port = 50052;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(),
    (err, port) => {
        if (err) {
            console.error('Échec de la liaison du serveur:', err);
            return;
        }
        console.log(`Le serveur s'exécute sur le port ${port}`);
        server.start();
    });
console.log(`Microservice de séries  book en cours d'exécution sur le port
${port}`);