const validator = require('validator');
const validate = (data, isUpdate = false) => {
    const mandatoryFields = isUpdate ? ['firstName'] : ['firstName', 'emailId', 'password'];

    // Check if mandatory fields for the context are present
    const missingFields = mandatoryFields.filter(field => !data[field]);
    if (missingFields.length > 0 && !isUpdate) {
        throw new Error(`Missing mandatory fields: ${missingFields.join(', ')}`);
    }

    if (data.emailId && !validator.isEmail(data.emailId)) {
        throw new Error('Invalid email format');
    }

    if (data.password && !validator.isStrongPassword(data.password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    })) {
        throw new Error('Password is not strong enough');
    }

    if (data.firstName && (data.firstName.length < 3 || data.firstName.length > 30)) {
        throw new Error('FirstName must be between 3 and 30 characters');
    }

    if (data.lastName && (data.lastName.length < 3 || data.lastName.length > 30)) {
        throw new Error('LastName must be between 3 and 30 characters');
    }
};
module.exports = validate;   