const express = require('express')
const problemRouter = express.Router();
const { createProblem, updateProblem, deleteProblem, getProblemById, getAllProblem, solvedAllProblemUser, getRandomProblem } = require('../controllers/problemController');
const adminMiddleware = require('../middleware/adminMiddleware');
const userMiddleware = require('../middleware/userMiddleware');

//create
problemRouter.post('/create', adminMiddleware, createProblem);
//update
problemRouter.put('/update/:id', adminMiddleware, updateProblem);
//delete problem
problemRouter.delete('/delete/:id', adminMiddleware, deleteProblem);
//problem solved by user

//fetch
problemRouter.get('/problemById/:id', userMiddleware, getProblemById);//fetch single problem with id
problemRouter.get('/getAllProblem', userMiddleware, getAllProblem);//fetch all problems
problemRouter.get('/problemSolvedByUser', userMiddleware, solvedAllProblemUser);//problems solved by user
problemRouter.get('/getRandomProblem', userMiddleware, getRandomProblem);//fetch random problem

module.exports = problemRouter;
