"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketIO = exports.setSocketIO = void 0;
let _io = null;
const setSocketIO = (io) => {
    _io = io;
};
exports.setSocketIO = setSocketIO;
const getSocketIO = () => _io;
exports.getSocketIO = getSocketIO;
