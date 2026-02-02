const express=require('express')
const problemRouter=express.Router();

//create
problemRouter.post('/createProblem',problemCreate);
//fetch

//update
problemRouter.patch('/:id',problemUdpate);
//delete problem
problemRouter.delete('/:id',problemDelete);
//problem solved by user


problemRouter.get('/:id',problemFetch);//fetch single problem with id
problemRouter.get('/',getAllProblem);//fetch all problems
problemRouter.get('/user',solvedProblemByUser);//probelms solved by user

module.exports=problemRouter;