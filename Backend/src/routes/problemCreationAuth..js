const express=require('express')
const problemRouter=express.Router();
const adminMiddleware=require('../middleware/adminMiddleware');

//create
problemRouter.post('/createProblem',adminMiddleware,createProblem);


//update
problemRouter.patch('/:id',adminMiddleware,updateProblem);
//delete problem
problemRouter.delete('/:id',deleteProblem);
//problem solved by user

//fetch
problemRouter.get('/:id',getProblemById);//fetch single problem with id
problemRouter.get('/',getAllProblem);//fetch all problems
problemRouter.get('/user',solvedAllProblemUser);//probelms solved by user

module.exports=problemRouter;