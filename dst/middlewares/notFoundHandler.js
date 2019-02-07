"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cinerinoapi = require("../cinerinoapi");
exports.default = (req, __, next) => {
    next(new cinerinoapi.factory.errors.NotFound(`router for [${req.originalUrl}]`));
};
