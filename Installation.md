
# Installation guide

In this guide you'll find instructions on installing aknservices, which is the server-side component of the [LIME editor](https://github.com/cirsfid-unibo/lime).

## Prerequisites

- Node.js v0.10 (it it should work on newer versions but has not been tested yet)
- Java (needed by Saxon XSLT processor)
- A running MongoDb instance
- Abiword (Optional, .doc conversion)
- A running ExistDb instance (Optional)

## Installation

    git clone git@github.com:cirsfid-unibo/lime-server.git
    cd lime-server
    npm install

## Configuration

### config.json

    port: the port you want to run aknservices on

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

Follow instructions [here](https://github.com/cirsfid-unibo/lime/blob/lime2/docs/Installation.md).

Short version: serve Lime on Apache and modify the *server.node* config in */config.json*.

    "node": "http://<your-domain>:<your-port>/",
