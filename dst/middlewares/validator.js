"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const cinerinoapi_1 = require("../cinerinoapi");
const api_1 = require("../error/api");
exports.default = (req, __, next) => __awaiter(this, void 0, void 0, function* () {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = check_1.validationResult(req);
    if (!errors.isEmpty()) {
        next(new api_1.APIError(http_status_1.BAD_REQUEST, errors.array()
            .map((mappedRrror) => {
            return new cinerinoapi_1.factory.errors.Argument(mappedRrror.param, mappedRrror.msg);
        })));
    }
    else {
        next();
    }
});
