const express=require('express')
const problemRouter=express.Router();
const {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblemUser}=require('../controllers/problem.controller');
const adminMiddleware=require('../middlewares/admin.middleware');
const userMiddleware=require('../middlewares/user.middleware');

//create
problemRouter.post('/create',adminMiddleware,createProblem);
//update
problemRouter.put('/update/:id',adminMiddleware,updateProblem);
//delete problem
problemRouter.delete('/delete/:id',adminMiddleware,deleteProblem);
//problem solved by user

//fetch
problemRouter.get('/problemById/:id',userMiddleware,getProblemById);//fetch single problem with id
problemRouter.get('/getAllProblem',userMiddleware,getAllProblem);//fetch all problems
problemRouter.get('/problemSolvedByUser',userMiddleware,solvedAllProblemUser);//problems solved by user

module.exports=problemRouter;
