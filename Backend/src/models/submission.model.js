const mongoose=require('mongoose');
const Schema = mongoose.Schema;
const submissionSchema = new Schema({
userId:{
    type:Schema.Types.ObjectId,
    ref:"user",
    required:true,
    index:true/// here we do index because  if user if user check their submission for a particular problem then this index help it to find user id from databse it in less time
},
problemId:{
    type:Schema.Types.ObjectId,
    ref:"problem",
    required:true,
    index:true// here we do index because  if user if user check their submission for a particular problem then this index help it to find it in less time
},
code:{  
    type:String,
    required:true,
},
language:{
    type:String,
    required:true,
},
status:{
    type:String,
    default:"pending",
},
runtime:{
    type:Number,//in milliseconds
    default:0,
},memory:{
    type:Number,//in kilobytes
    default:0,
},
errorMessage:{
    type:String,
    default:"",
},
testCasesPassed:{
    type:Number,
    default:0,
},
testCasesTotal:{
    type:Number,
    default:0,
}
},{
    timestamps:true
}
);
submissionSchema.index({userId:1,problemId:1});// here we create a compound index on userId and problemId because when user check their submission for a particular problem then it will help to find the submission in less time
const submissionModel = mongoose.model("Submission", submissionSchema);
module.exports =  submissionModel;
