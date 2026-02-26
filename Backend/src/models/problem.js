const mongoose = require("mongoose");
const { Schema } = mongoose;

const problemSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minLength: 10,
  },
  difficulty: {
    type: String,
    required: true,
    enum: ["easy", "medium", "hard"], // Lowercase to match your JSON
  },
  tags: {
    type: [String],
    default: [],
    required: true,
  },
  visibleTestCases: [
    {
      input: { type: String, required: true },
      output: { type: String, required: true },
      explanation: { type: String, required: true }
    }
  ],
  hiddenTestCases: [
    {
      input: { type: String, required: true },
      output: { type: String, required: true },
    },
  ],
  startCode: [
    {
      language: { type: String, required: true },
      initialCode: { type: String, required: true }, // Fixed typo: intialCode -> initialCode
    },
  ],
<<<<<<< HEAD
  referenceSolution: [
=======
  referenceSolution: [ 
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
    {
      language: { type: String, required: true },
      completeCode: { type: String, required: true },
    },
  ],
<<<<<<< HEAD
  videoUrl: {
    type: String,
    trim: true
  },
=======
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
  problemCreator: {
    type: Schema.Types.ObjectId,
    ref: "user",
    default: null
  }
});


const problemModel = mongoose.model("problem", problemSchema);
module.exports = problemModel;