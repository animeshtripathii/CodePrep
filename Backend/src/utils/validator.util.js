const validator = require('validator');
const validate = (data)=>{
    const mandatoryFields = ['firstName','emailId','password'];
    const isAllowed = mandatoryFields.every(field => Object.keys(data).includes(field));

    if(!isAllowed){
        throw new Error(`Missing mandatory fields`);
    }
    if(!validator.isEmail(data.emailId)){
        throw new Error('Invalid email format');
    }
    if(!validator.isStrongPassword(data.password,{
        minLength:8,
        minLowercase:1,
        minUppercase:1,
        minNumbers:1,
        minSymbols:1
    })){
        throw new Error('Password is not strong enough');
    }
    if(data.firstName.length<3 || data.firstName.length>30){
        throw new Error('FirstName must be between 3 and 30 characters');
    }
};
module.exports = validate;   
