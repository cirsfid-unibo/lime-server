
# Installation guide

In this guide you'll find instructions on installing [LIME-server](https://github.com/cirsfid-unibo/lime-server), which is the server-side component of the [LIME editor](https://github.com/cirsfid-unibo/lime).

## Prerequisites

- Node.js >= v8.0
- A running MongoDb instance
- Java (Optional, needed by Saxon XSLT processor and Epub generation)
- Abiword (Optional, .doc conversion)
- A running ExistDb instance (Optional)

## Installation

    git clone git@github.com:cirsfid-unibo/lime-server.git
    cd lime-server
    npm install

## Configuration

### config.json

    port: the port you want to run LIME-server on

### documentsdb/config.json

    {
      "mongodb": { // MongoDb configuration
        "url": "mongodb://localhost:9006/documentsdb", // MongoDb url
          "collections": {
            "users": "dev_users" // Collection name for users
          }
      },
      "filesystem": { // Filesystem backend configuration
        // Path of documents: each users can access his folder in this directory
        // plus all folders in "users.shared_folders"
        "documents": "../data/documents/"
      },
      "users": {
        "shared_folders": [
          "/shared/" // List of folders shared by all users
        ]
      },
      "existIsMainBackend": true, // Wheter or not to use ExistDb as the main backend
      "existdb": { // ExistDb backend configuration
        "host": "localhost",
        "port": 8080,
        "rest": "/exist/rest",
        "baseCollection": "/lime_test",
        "auth": "username:password"
      },
      "abiword": {
        "path": "/usr/bin/abiword" // Path to abiword executable
      }
    }


## Running

    node server


## Lime configuration

Follow instructions [here](https://github.com/cirsfid-unibo/lime/blob/master/docs/Installation.md).

Short version: serve LIME on a web server and modify the *server.node* config in */config.json*.

    "node": "http://<your-domain>:<your-port>/",
