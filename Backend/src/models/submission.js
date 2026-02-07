const mongoose=require('mongoose');
const Schema = mongoose.Schema;
const submissionSchema = new Schema({
userId:{
    type:Schema.Types.ObjectId,
    ref:"user",
    required:true,
},
problemId:{
    type:Schema.Types.ObjectId,
    ref:"problem",
    required:true,
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
const submissionModel = mongoose.model("Submission", submissionSchema);
module.exports =  submissionModel;