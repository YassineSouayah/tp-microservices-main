// resolvers.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
// Charger les fichiers proto pour les films et les séries TV
const movieProtoPath = 'movie.proto';
const bookProtoPath = 'book.proto';
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
const movieProto = grpc.loadPackageDefinition(movieProtoDefinition).movie;
const bookProto = grpc.loadPackageDefinition(bookProtoDefinition).book;
// Définir les résolveurs pour les requêtes GraphQL
const resolvers = {
    Query: {
        movie: (_, { id }) => {
            // Effectuer un appel gRPC au microservice de films
            const client = new movieProto.MovieService('localhost:50051',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.getMovie({ movie_id: id }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.movie);
                    }
                });
            });
        },
        addMovie: (_, { title,description }) => {
            // Effectuer un appel gRPC au microservice de films
            const client = new movieProto.MovieService('localhost:50051',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.addMovie({ title: title,description:description }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.movie);
                    }
                });
            });
        },
        movies: () => {
            // Effectuer un appel gRPC au microservice de films
            const client = new movieProto.MovieService('localhost:50051',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.searchMovies({}, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.movies);
                    }
                });
            });
        },
        addbook: (_, { title,description }) => {
            // Effectuer un appel gRPC au microservice de films
            const client = new bookProto.bookService('localhost:50052',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.addbook({ title: title,description:description }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.tv_show);
                    }
                });
            });
        },
         book: (_, { id }) => {
            // Effectuer un appel gRPC au microservice de séries TV
            const client = new bookProto.bookService('localhost:50052',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.getbook({ tv_show_id: id }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.tv_show);
                    }
                });
            });
        },
        books: () => {
            // Effectuer un appel gRPC au microservice de séries TV
            const client = new bookProto.bookService('localhost:50052',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.searchbooks({}, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.tv_shows);
                    }
                });
            });
        },
    },
};
module.exports = resolvers;