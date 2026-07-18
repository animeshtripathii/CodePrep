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
    enum: ["easy", "medium", "hard"],
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
      initialCode: { type: String, required: true },
    },
  ],
  driverCode: [
    {
      language: { type: String, required: true },
      code: { type: String, required: true },
    },
  ],
  referenceSolution: [
    {
      language: { type: String, required: true },
      completeCode: { type: String, required: true },
    },
  ],
  videoUrl: {
    type: String,
    trim: true
  },
  problemCreator: {
    type: Schema.Types.ObjectId,
    ref: "user",
    default: null
  }
});


const problemModel = mongoose.model("problem", problemSchema);
module.exports = problemModel;