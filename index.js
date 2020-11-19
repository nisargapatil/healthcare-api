'use strict'
const { Pool } = require('pg')
const express = require("express");
const Enforcer = require("openapi-enforcer-middleware");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000" // local client
    ]
  })
);

const controllerDirectory = path.resolve(__dirname, "controllers");
const mockDirectory = path.resolve(__dirname, "mock-controllers");
const pathToOpenApiDoc = path.resolve(__dirname, "openapi.json");

// Create an enforcer middleware instance
const enforcer = Enforcer(pathToOpenApiDoc);

// Add mocking middleware to the enforcer middleware.
// This middleware will handle explicit mock requests.
enforcer.mocks(mockDirectory, false).catch(console.error);

// Add controller middleware to the enforcer middleware .
// This middleware will handle requests for real data.
enforcer.controllers(controllerDirectory).catch(console.error);

// Add fallback mocking middleware to the enforcer middleware.
// This middleware will automatically run mocking if the
// controller could not produce a response.
enforcer.mocks(mockDirectory, true).catch(() => {}); // Any errors will have already been reported by explicit mock middleware

// Add the enforcer middleware runner to the express app.
app.use(enforcer.middleware());

// Add error handling middleware
app.use((err, req, res, next) => {
  // If the error was in the client's request then send back a detailed report
  if (err.statusCode >= 400 && err.statusCode < 500 && err.exception) {
    res.set("Content-Type", "text/plain");
    res.status(err.statusCode);
    res.send(err.message);

    // If it's unsafe to send back detailed errors then send back limited error information
  } else {
    console.error(err.stack);
    res.sendStatus(err.statusCode || 500);
  }
});

const listener = app.listen(process.env.PORT || 4000, (err) => {
  if (err) return console.error(err.stack);
  console.log("Server listening on port " + listener.address().port);
});

