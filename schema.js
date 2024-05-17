const { gql } = require('@apollo/server');
// Définir le schéma GraphQL
const typeDefs = `#graphql
type Movie {
id: String!
title: String!
description: String!
}
type book {
id: String!
title: String!
description: String!
}
type Query {
movie(id: String!): Movie
movies: [Movie]
book(id: String!): book
books: [book]
addMovie(title: String!, description: String!): Movie
addbook(title: String!, description: String!): book

}
`;
module.exports = typeDefs