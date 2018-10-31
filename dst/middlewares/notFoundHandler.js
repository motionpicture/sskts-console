"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ssktsapi = require("../ssktsapi");
exports.default = (req, __, next) => {
    next(new ssktsapi.factory.errors.NotFound(`router for [${req.originalUrl}]`));
};
