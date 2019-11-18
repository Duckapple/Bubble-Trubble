const c = {w: 1280, h: 720}
const weight = 0.2;
const sizes = [
    { bs: 9,  r: 10, },
    { bs: 11, r: 20, },
    { bs: 13, r: 30, },
    { bs: 14, r: 40, },
    { bs: 15, r: 50, },
    { bs: 12, r: 70, weightMod: 0.7 },
    { bs: 9, r: 80, weightMod: 0.4 },
];
let levels = [];

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let time = 0;
let gameSpeed = 1;
let level = 0;
let debug = false;
let levelCountdown = 0;
let joinTimer = 0;

let currentKeys = {};

let harpoons = [];

let pause = false;
let pauseHeld = false;

let controls = {
    players: [
        {
            "w": "up",
            "s": "down",
            "a": "left",
            "d": "right",
            " ": "shoot",
            "spacebar": "shoot",
        },
        {
            "arrowup": "up",
            "arrowdown": "down",
            "arrowleft": "left",
            "arrowright": "right",
            "shift": "shoot",
        },
        {
            "i": "up",
            "k": "down",
            "j": "left",
            "l": "right",
            "-": "shoot",
            "_": "shoot",
        },
        {
            "8": "up",
            "5": "down",
            "4": "left",
            "6": "right",
            "+": "shoot",
        },
    ],
    debug: {
        "å": "",
    },
};

let playerColors = [
    "green",
    "blue",
    "orange",
    "red",
]

let currentLevel = [];

let players = [
    new Player( {x: c.w / 2, y: c.h - 25}, 0 ),
]