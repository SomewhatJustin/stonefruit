"use strict";

import Fastify from "fastify";
import { PrismaClient } from "./generated/prisma/index.js";

const fastify = Fastify({
  logger: true,
});

const prisma = new PrismaClient();

// Declare a route
fastify.get("/", function (request, reply) {
  reply.send({ hello: "world" });
});

fastify.put("/new-user", function (request, reply) {
  const new_user = prisma.user.create({
    data: { fname: request.fname },
  });
});

fastify.post("/", function (request, reply) {
  const message = prisma.message.create({
    data: { content: request.body.content },
  });
  return message;
});

// Run the server!
fastify.listen({ port: 3000, host: "0.0.0.0" }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  // Server is now listening on ${address}
});
